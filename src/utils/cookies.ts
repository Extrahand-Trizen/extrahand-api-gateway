/**
 * Utilities for issuing secure HttpOnly cookies for auth tokens
 */
import type { Response } from "express";
import type { SessionTokens } from "../types/api.js";

export const ACCESS_COOKIE_NAME =
   process.env.ACCESS_TOKEN_COOKIE_NAME || "accessToken";
export const REFRESH_COOKIE_NAME =
   process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken";
const isProd = process.env.NODE_ENV === "production";
const sameSite = (process.env.COOKIE_SAMESITE as any) || "Lax";
const cookieDomain = process.env.COOKIE_DOMAIN;

function buildCookie(
   name: string,
   value: string | null,
   opts?: { expiresAtMs?: number; httpOnly?: boolean }
): string {
   const maxAge = value
      ? Math.max(
           Math.floor(
              ((opts?.expiresAtMs ?? Date.now() + 30 * 24 * 60 * 60 * 1000) -
                 Date.now()) /
                 1000
           ),
           0
        )
      : 0;

   const parts = [
      `${name}=${value ? encodeURIComponent(value) : ""}`,
      "Path=/",
      `Max-Age=${maxAge}`,
      opts?.httpOnly !== false ? "HttpOnly" : null,
      isProd ? "Secure" : process.env.FORCE_SECURE_COOKIES === "true"
      ? "Secure"
      : null,
      `SameSite=${sameSite}`,
      cookieDomain ? `Domain=${cookieDomain}` : null,
   ].filter(Boolean);

   return parts.join("; ");
}

export function buildAuthCookies(tokens?: Partial<SessionTokens>): string[] {
   if (!tokens) return [];

   const cookies: string[] = [];

   if (tokens.accessToken) {
      const expiresAt = tokens.accessTokenExpiresAt
         ? new Date(tokens.accessTokenExpiresAt).getTime()
         : undefined;
      cookies.push(
         buildCookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
            expiresAtMs: expiresAt,
            httpOnly: true,
         })
      );
   }

   if (tokens.refreshToken) {
      const expiresAt = tokens.refreshTokenExpiresAt
         ? new Date(tokens.refreshTokenExpiresAt).getTime()
         : undefined;
      cookies.push(
         buildCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
            expiresAtMs: expiresAt,
            httpOnly: true,
         })
      );
   }

   return cookies;
}

export function clearAuthCookies(): string[] {
   return [
      buildCookie(ACCESS_COOKIE_NAME, null),
      buildCookie(REFRESH_COOKIE_NAME, null),
   ];
}

export function forwardOrSetAuthCookies(
   res: Response,
   upstreamCookies?: string[] | string,
   tokens?: Partial<SessionTokens>
) {
   if (upstreamCookies && (Array.isArray(upstreamCookies) || typeof upstreamCookies === "string")) {
      res.setHeader("set-cookie", upstreamCookies);
      return;
   }

   const cookies = buildAuthCookies(tokens);
   if (cookies.length) {
      res.setHeader("set-cookie", cookies);
   }
}

export function sanitizeSessionPayload<T extends Record<string, any>>(data: T): T {
   if (!data || typeof data !== "object") return data;
   const clone: any = { ...data };
   if (clone.tokens) {
      delete clone.tokens;
   }
   return clone;
}
