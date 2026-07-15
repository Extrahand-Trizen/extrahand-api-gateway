import { Request, Response } from "express";
import { userService } from "../services/userService.js";
import {
   forwardOrSetAuthCookies,
   clearAuthCookies,
   sanitizeSessionPayload,
} from "../utils/cookies.js";
import logger from "../config/logger.js";

export class SessionController {
   static async refresh(req: Request, res: Response): Promise<void> {
      try {
         const cookies = req.headers.cookie;
         const refreshToken = req.body?.refreshToken;

         if (!cookies && !refreshToken) {
            res.status(401).json({
               success: false,
               error: "Refresh token missing",
               message: "Please sign in again to obtain a new session token.",
            });
            return;
         }

         const clientType =
            req.body?.clientType === "mobile" ? "mobile" : "web";

         const response = await userService.refreshSession({
            cookies,
            deviceId: req.body?.deviceId,
            clientType,
            userAgent: req.get("user-agent") ?? undefined,
            ipAddress: req.ip,
            refreshToken,
         });

         const upstreamCookies = response.headers["set-cookie"];
         forwardOrSetAuthCookies(res, upstreamCookies, response.data?.tokens);

         res.status(response.status).json(
            sanitizeSessionPayload(response.data, {
               keepTokensInBody: clientType === "mobile",
            })
         );
      } catch (error: any) {
         const status = error?.status || error?.response?.status || 500;
         logger.error("Session refresh failed", {
            status,
            message: error?.message,
            data: error?.data || error?.response?.data,
         });

         res.status(status).json({
            success: false,
            error: error?.message || "Failed to refresh session",
            details: error?.data || error?.response?.data,
         });
      }
   }

   static async logout(req: Request, res: Response): Promise<void> {
      try {
         const response = await userService.logoutSession({
            cookies: req.headers.cookie,
            deviceId: req.body?.deviceId,
            clientType: "web",
            userAgent: req.get("user-agent") ?? undefined,
            ipAddress: req.ip,
         });

         const upstreamCookies = response.headers["set-cookie"];
         forwardOrSetAuthCookies(
            res,
            upstreamCookies ?? clearAuthCookies()
         );

         res.status(response.status).json(
            sanitizeSessionPayload(response.data)
         );
      } catch (error: any) {
         const status = error?.status || error?.response?.status || 500;
         logger.error("Session logout failed", {
            status,
            message: error?.message,
            data: error?.data || error?.response?.data,
         });

         res.status(status).json({
            success: false,
            error: error?.message || "Failed to logout session",
            details: error?.data || error?.response?.data,
         });
      }
   }
}
