import { Request, Response } from "express";
import { userService } from "../services/userService.js";
import {
   forwardOrSetAuthCookies,
   sanitizeSessionPayload,
} from "../utils/cookies.js";
import logger from "../config/logger.js";

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

   // =========================================================================
   // REDUNDANT METHODS - Commented out as app uses OTP-based auth flow
   // These methods are never called since their routes are disabled
   // =========================================================================

   /**
    * POST /api/v1/auth/signup
    * Public endpoint - creates new user account
    * REDUNDANT: OTP flow handles signup via /otp/complete
    */
   // static async signup(req: Request, res: Response): Promise<void> {
   //    try {
   //       const signupData = req.body;

   //       logger.info("Processing signup request");

   //       // Forward to User Service
   //       const response = await userService.signup(signupData);

   //       res.status(response.status).json(response.data);
   //    } catch (error: any) {
   //       logger.error("Error during signup", {
   //          error: error.message,
   //          stack: error.stack,
   //       });
   //       res.status(500).json({
   //          success: false,
   //          error: "Signup failed",
   //          message: error.message,
   //       });
   //    }
   // }

   /**
    * POST /api/v1/auth/login
    * Public endpoint - authenticates user
    * REDUNDANT: OTP flow handles login via /otp/complete
    */
   // static async login(req: Request, res: Response): Promise<void> {
   //    try {
   //       const loginData = req.body;

   //       logger.info("Processing login request");

   //       // Forward to User Service
   //       const response = await userService.login(loginData);

   //       const upstreamCookies = response.headers["set-cookie"];
   //       forwardOrSetAuthCookies(
   //          res,
   //          upstreamCookies,
   //          (response.data as any)?.tokens
   //       );

   //       res.status(response.status).json(
   //          sanitizeSessionPayload(response.data)
   //       );
   //    } catch (error: any) {
   //       logger.error("Error during login", {
   //          error: error.message,
   //          stack: error.stack,
   //       });
   //       res.status(500).json({
   //          success: false,
   //          error: "Login failed",
   //          message: error.message,
   //       });
   //    }
   // }

   /**
    * POST /api/v1/auth/password/reset
    * Public endpoint - generates password reset link
    * REDUNDANT: App uses phone OTP, not password-based auth
    */
   // static async passwordReset(req: Request, res: Response): Promise<void> {
   //    try {
   //       const { email, continueUrl } = req.body;

   //       if (!email) {
   //          res.status(400).json({
   //             success: false,
   //             error: "Email is required",
   //          });
   //          return;
   //       }

   //       logger.info("Processing password reset request", { email });

   //       // Forward to User Service
   //       const response = await userService.passwordReset(email, continueUrl);

   //       res.status(response.status).json(response.data);
   //    } catch (error: any) {
   //       logger.error("Error during password reset", {
   //          error: error.message,
   //          stack: error.stack,
   //       });
   //       res.status(500).json({
   //          success: false,
   //          error: "Password reset failed",
   //          message: error.message,
   //       });
   //    }
   // }

   // =========================================================================


   /**
    * POST /api/v1/auth/otp/complete
    * Public endpoint - completes OTP authentication flow
    */
   static async completeOTP(req: Request, res: Response): Promise<void> {
      try {
         const { idToken, mode, phone, name, clientType, deviceId } = req.body;

         if (!idToken || !mode || !phone) {
            res.status(400).json({
               success: false,
               error: "Missing required fields: idToken, mode, phone",
            });
            return;
         }

         const normalizedClientType: "web" | "mobile" =
            clientType === "mobile" ? "mobile" : "web";

         logger.info("Processing OTP completion request", {
            mode,
            phone: phone.replace(/\d(?=\d{4})/g, "*"),
         });

         // Forward to User Service
         const response = await userService.completeOTP(
            idToken,
            mode,
            phone,
            name,
            {
               clientType: normalizedClientType,
               deviceId,
            }
         );

         const upstreamCookies = response.headers["set-cookie"];
         forwardOrSetAuthCookies(
            res,
            upstreamCookies,
            (response.data as any)?.tokens
         );

         res.status(response.status).json(
            sanitizeSessionPayload(response.data)
         );
      } catch (error: any) {
         logger.error("Error during OTP completion", {
            error: error.message,
            stack: error.stack,
         });
         res.status(500).json({
            success: false,
            error: "OTP completion failed",
            message: error.message,
         });
      }
   }


   /**
    * POST /api/v1/auth/otp/complete-dev
    * Dev-only: dummy signin/signup with +91 9876543210, OTP 123456. Forwards cookies.
    * Enabled when LOCAL_TEST=true or NODE_ENV=development.
    */
   static async completeOTPDev(req: Request, res: Response): Promise<void> {
      const allowDev =
         process.env.LOCAL_TEST === "true" ||
         process.env.LOCAL_TEST === "1" ||
         process.env.NODE_ENV === "development";
      if (!allowDev) {
         res.status(404).json({ success: false, error: "Not found" });
         return;
      }
      try {
         const { phone, otp, mode, name, clientType, deviceId } = req.body;
         if (!phone || !otp || !mode) {
            res.status(400).json({
               success: false,
               error: "Missing required fields: phone, otp, mode",
            });
            return;
         }
         const response = await userService.completeOTPDev(
            phone,
            otp,
            mode,
            name,
            { clientType: clientType === "mobile" ? "mobile" : "web", deviceId }
         );
         const upstreamCookies = response.headers["set-cookie"];
         forwardOrSetAuthCookies(
            res,
            upstreamCookies,
            (response.data as any)?.tokens
         );
         res.status(response.status).json(
            sanitizeSessionPayload(response.data as any)
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
