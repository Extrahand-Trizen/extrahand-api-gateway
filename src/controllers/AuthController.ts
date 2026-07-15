import { Request, Response } from "express";
import { userService } from "../services/userService.js";
import {
   forwardOrSetAuthCookies,
   sanitizeSessionPayload,
} from "../utils/cookies.js";
import logger from "../config/logger.js";
import { parseReferralChannel } from "../utils/rewardsContext.js";
import { parseAuthChannel } from "../utils/authChannel.js";

export class AuthController {
   /**
    * POST /api/v1/auth/check-phone
    * Public endpoint - checks if phone number exists
    */
   static async checkPhone(req: Request, res: Response): Promise<void> {
      try {
         const { phone } = req.body;

         if (!phone || typeof phone !== "string") {
            res.status(400).json({
               success: false,
               error: "Phone number is required",
            });
            return;
         }

         logger.info("Checking phone existence", { phone });

         // Forward to User Service
         const response = await userService.checkPhone(phone);

         res.status(response.status).json(response.data);
      } catch (error: any) {
         logger.error("Error checking phone", {
            error: error.message,
            stack: error.stack,
         });
         res.status(500).json({
            success: false,
            error: "Failed to check phone number",
            message: error.message,
         });
      }
   }


   /**
    * POST /api/v1/auth/otp/complete
    * Public endpoint - completes OTP authentication flow
    */
   static async completeOTP(req: Request, res: Response): Promise<void> {
      try {
         const { idToken, mode, phone, name, clientType, deviceId, referralCode, referralChannel, authChannel } = req.body;

         if (!idToken || !mode || !phone) {
            res.status(400).json({
               success: false,
               error: "Missing required fields: idToken, mode, phone",
            });
            return;
         }

         const normalizedClientType: "web" | "mobile" =
            clientType === "mobile" ? "mobile" : "web";
         // Mobile apps only — do not apply authChannel for website clients
         const normalizedAuthChannel =
            normalizedClientType === "mobile"
               ? parseAuthChannel(authChannel)
               : undefined;

         const referralCodeNormalized =
            typeof referralCode === "string" ? referralCode.trim().toUpperCase() : "";
         const normalizedReferralChannel =
            referralChannel != null && String(referralChannel).trim() !== ""
               ? parseReferralChannel(referralChannel)
               : undefined;

         const phoneLast4 = String(phone).replace(/\D/g, "").slice(-4);
         logger.info("[Signup][WA] gateway otp/complete", {
            mode,
            phoneLast4,
            clientType: normalizedClientType,
            authChannel: normalizedAuthChannel ?? null,
            hasReferralCode: Boolean(referralCodeNormalized),
         });

         if (mode === "signup" && referralCodeNormalized) {
            logger.info(
               `[REFERRAL_COINS] step=gateway_otp_complete_forward ${JSON.stringify({
                  referralCode: referralCodeNormalized,
                  clientType: normalizedClientType,
               })}`
            );
         } else if (mode === "signup") {
            logger.info(
               `[REFERRAL_COINS] step=gateway_otp_complete_no_referral ${JSON.stringify({
                  note: "signup without referralCode in body — no coins will be scheduled",
               })}`
            );
         }

         // Forward to User Service
         const response = await userService.completeOTP(
            idToken,
            mode,
            phone,
            name,
            {
               clientType: normalizedClientType,
               deviceId,
               referralCode: referralCodeNormalized || undefined,
               referralChannel: normalizedReferralChannel,
               authChannel: normalizedAuthChannel,
            }
         );

         const upstreamCookies = response.headers["set-cookie"];
         forwardOrSetAuthCookies(
            res,
            upstreamCookies,
            (response.data as any)?.tokens
         );

         res.status(response.status).json(
            sanitizeSessionPayload(response.data, {
               keepTokensInBody: normalizedClientType === "mobile",
            })
         );
      } catch (error: any) {
         const status = error.response?.status ?? error.status ?? 500;
         const data = error.response?.data ?? error.data;
         const upstreamError =
            data?.error ?? data?.message ?? error.message ?? "OTP completion failed";
         logger.error("Error during OTP completion", {
            status,
            upstreamError,
            error: error.message,
            stack: error.stack,
         });
         res.status(status).json({
            success: false,
            error: upstreamError,
            message: upstreamError,
         });
      }
   }


   /**
    * POST /api/v1/auth/otp/complete-dev
    * Dev-only: dummy signin/signup with whitelisted test credentials. Forwards cookies.
    * Enabled only when LOCAL_TEST=true or LOCAL_TEST=1.
    */
   static async completeOTPDev(req: Request, res: Response): Promise<void> {
      const allowDev =
         process.env.LOCAL_TEST === "true" ||
         process.env.LOCAL_TEST === "1";
      if (!allowDev) {
         res.status(404).json({ success: false, error: "Not found" });
         return;
      }
      try {
         const { phone, otp, mode, name, clientType, deviceId, referralCode, referralChannel, authChannel } = req.body;
         if (!phone || !otp || !mode) {
            res.status(400).json({
               success: false,
               error: "Missing required fields: phone, otp, mode",
            });
            return;
         }
         const normalizedClientType: "web" | "mobile" =
            clientType === "mobile" ? "mobile" : "web";
         // Mobile apps only — do not apply authChannel for website clients
         const normalizedAuthChannel =
            normalizedClientType === "mobile"
               ? parseAuthChannel(authChannel)
               : undefined;
         const referralCodeNormalized =
            typeof referralCode === "string" ? referralCode.trim().toUpperCase() : "";
         const normalizedReferralChannel =
            referralChannel != null && String(referralChannel).trim() !== ""
               ? parseReferralChannel(referralChannel)
               : undefined;

         if (mode === "signup" && referralCodeNormalized) {
            logger.info(
               `[REFERRAL_COINS] step=gateway_otp_complete_dev_forward ${JSON.stringify({
                  referralCode: referralCodeNormalized,
               })}`
            );
         }

         const response = await userService.completeOTPDev(
            phone,
            otp,
            mode,
            name,
            {
               clientType: normalizedClientType,
               deviceId,
               referralCode: referralCodeNormalized || undefined,
               referralChannel: normalizedReferralChannel,
               authChannel: normalizedAuthChannel,
            }
         );
         const upstreamCookies = response.headers["set-cookie"];
         forwardOrSetAuthCookies(
            res,
            upstreamCookies,
            (response.data as any)?.tokens
         );
         res.status(response.status).json(
            sanitizeSessionPayload(response.data as any, {
               keepTokensInBody: normalizedClientType === "mobile",
            })
         );
      } catch (error: any) {
         logger.error("OTP complete-dev failed", {
            error: error.message,
         });
         res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message || "OTP complete-dev failed",
         });
      }
   }

   static async sendAlternateLoginOtp(req: Request, res: Response): Promise<void> {
      try {
         const { phone } = req.body;
         if (!phone || typeof phone !== 'string') {
            res.status(400).json({ success: false, error: 'Phone number is required' });
            return;
         }
         const response = await userService.sendAlternateLoginOtp(phone);
         res.status(response.status).json(response.data);
      } catch (error: any) {
         logger.error('Alternate login send OTP failed', { error: error.message });
         res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to send verification code',
         });
      }
   }

   static async verifyAlternateLoginOtp(req: Request, res: Response): Promise<void> {
      try {
         const { phone, otp } = req.body;
         if (!phone || typeof phone !== 'string' || !otp) {
            res.status(400).json({ success: false, error: 'Phone number and OTP are required' });
            return;
         }
         const response = await userService.verifyAlternateLoginOtp(phone, otp);
         res.status(response.status).json(response.data);
      } catch (error: any) {
         logger.error('Alternate login verify OTP failed', { error: error.message });
         res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to verify code',
         });
      }
   }

   static async completeAlternateLoginFirebase(req: Request, res: Response): Promise<void> {
      try {
         const { phone, alternateIdToken } = req.body;
         if (!phone || typeof phone !== 'string' || !alternateIdToken) {
            res.status(400).json({
               success: false,
               error: 'Phone number and verification token are required',
            });
            return;
         }
         const response = await userService.completeAlternateLoginFirebase(phone, alternateIdToken);
         res.status(response.status).json(response.data);
      } catch (error: any) {
         logger.error('Alternate login Firebase verify failed', { error: error.message });
         res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to verify code',
         });
      }
   }

   static async restoreFirebaseSession(req: Request, res: Response): Promise<void> {
      try {
         const { idToken } = req.body;
         if (!idToken || typeof idToken !== 'string') {
            res.status(400).json({ success: false, error: 'Session token is required' });
            return;
         }
         const response = await userService.restoreFirebaseSession(idToken);
         res.status(response.status).json(response.data);
      } catch (error: any) {
         logger.error('Restore Firebase session failed', { error: error.message });
         res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to restore session',
         });
      }
   }

   /**
    * POST /api/v1/auth/sync
    * Authenticated endpoint to ensure Mongo profile is bound to the session user
    */
   static async sync(req: Request, res: Response): Promise<void> {
      try {
         const user = req.user;
         if (!user) {
            res.status(401).json({ success: false, error: "Unauthorized" });
            return;
         }

         logger.info("🔄 [Gateway] Syncing user profile", {
            uid: user.uid,
         });

         // 🔥 Forward request to User Service WITH USER TOKEN
         const response = await userService.syncProfile(req.body, user);

         res.status(response.status).json(response.data);
      } catch (error: any) {
         logger.error("❌ [Gateway] Profile sync failed", {
            error: error.message,
            service: error.service,
            data: error.data,
         });

         res.status(error.status || 500).json({
            success: false,
            error: error.message || "Profile sync failed",
            data: error.data,
         });
      }
   }
}
