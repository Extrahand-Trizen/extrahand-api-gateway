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

/**
 * Normalize upstream Set-Cookie value from axios (string or array) to string[].
 * Axios may return response.headers["set-cookie"] as string (single cookie) or
 * string[] (multiple); Express requires each cookie to be sent separately for
 * multiple Set-Cookie headers to reach the client.
 */
function normalizeSetCookieHeaders(upstreamCookies: string[] | string | undefined): string[] {
   if (upstreamCookies == null) return [];
   if (Array.isArray(upstreamCookies)) {
      return upstreamCookies.filter((c): c is string => typeof c === "string" && c.length > 0);
   }
   if (typeof upstreamCookies === "string" && upstreamCookies.length > 0) {
      return [upstreamCookies];
   }
   return [];
}

export function forwardOrSetAuthCookies(
   res: Response,
   upstreamCookies?: string[] | string,
   tokens?: Partial<SessionTokens>
) {
   const cookies = normalizeSetCookieHeaders(upstreamCookies);
   if (cookies.length > 0) {
      // Remove any existing Set-Cookie so we can set multiple via append
      res.removeHeader("Set-Cookie");
      for (const cookie of cookies) {
         res.append("Set-Cookie", cookie);
      }
      return;
   }

   const built = buildAuthCookies(tokens);
   if (built.length) {
      res.removeHeader("Set-Cookie");
      for (const cookie of built) {
         res.append("Set-Cookie", cookie);
      }
   }
}

export type SanitizeSessionPayloadOptions = {
   /**
    * React Native does not reliably use HttpOnly cookies for API calls.
    * When true, keep `tokens` in the JSON body so the mobile app can persist
    * the access token (e.g. AsyncStorage). Web clients still omit tokens from JSON
    * when this is false (cookies carry the session).
    */
   keepTokensInBody?: boolean;
};

export function sanitizeSessionPayload<T extends Record<string, any>>(
   data: T,
   options?: SanitizeSessionPayloadOptions
): T {
   if (!data || typeof data !== "object") return data;
   if (options?.keepTokensInBody) {
      return { ...data };
   }
   const clone: any = { ...data };
   if (clone.tokens) {
      delete clone.tokens;
   }
   return clone;
}
