import { BaseService } from "./baseService.js";
import { AxiosResponse } from "axios";
import { UserToken } from "../types/service.js";
import { Profile, ApiResponse, SessionResponse } from "../types/api.js";
import FormData from "form-data";

interface SessionRequestOptions {
   cookies?: string;
   deviceId?: string;
   clientType?: "web" | "mobile";
   userAgent?: string;
   ipAddress?: string;
   refreshToken?: string;
}

export class UserService extends BaseService {
   constructor() {
      const serviceURL =
         process.env.USER_SERVICE_URL || "http://localhost:4001";
      super({
         serviceName: "UserService",
         baseURL: serviceURL,
         timeout: 15000,
      });
   }

   async getProfile(
      userId: string,
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<Profile>>> {
      const config = this.addServiceAuth(
         this.forwardUserAuth(userToken, {
            headers: {
               "X-User-Id": userId,
            },
         })
      );

      return this.handleRequest(() =>
         this.client.get<ApiResponse<Profile>>(
            `/api/v1/profiles/${userId}`,
            config
         )
      );
   }

   async getCurrentProfile(
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<Profile>>> {
      const config = this.addServiceAuth(this.forwardUserAuth(userToken));

      return this.handleRequest(() =>
         this.client.get<ApiResponse<Profile>>("/api/v1/profiles/me", config)
      );
   }

   async updateProfile(
      userId: string,
      profileData: Partial<Profile>,
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<Profile>>> {
      const config = this.addServiceAuth(
         this.forwardUserAuth(userToken, {
            headers: {
               "X-User-Id": userId,
            },
         })
      );

      return this.handleRequest(() =>
         this.client.put<ApiResponse<Profile>>(
            `/api/v1/profiles/${userId}`,
            profileData,
            config
         )
      );
   }

   async updateCurrentProfile(
      profileData: Partial<Profile>,
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<Profile>>> {
      const config = this.addServiceAuth(this.forwardUserAuth(userToken));

      // Log request data for debugging
      console.log("🔍 [UserService.updateCurrentProfile] Sending request:", {
         hasSavedAddresses: !!profileData.savedAddresses,
         savedAddressesCount: Array.isArray(profileData.savedAddresses)
            ? profileData.savedAddresses.length
            : 0,
         savedAddressesPreview:
            Array.isArray(profileData.savedAddresses) &&
            profileData.savedAddresses.length > 0
               ? {
                    firstAddress: {
                       label: profileData.savedAddresses[0].label,
                       addressLength:
                          profileData.savedAddresses[0].address?.length || 0,
                       hasCoordinates: Array.isArray(
                          profileData.savedAddresses[0].coordinates
                       ),
                       coordinates: profileData.savedAddresses[0].coordinates,
                    },
                 }
               : null,
      });

      return this.handleRequest(() =>
         this.client.put<ApiResponse<Profile>>(
            "/api/v1/profiles/me",
            profileData,
            config
         )
      );
   }

   async upsertProfile(
      profileData: Partial<Profile>,
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<Profile>>> {
      const config = this.addServiceAuth(this.forwardUserAuth(userToken));

      return this.handleRequest(() =>
         this.client.post<ApiResponse<Profile>>(
            "/api/v1/profiles",
            profileData,
            config
         )
      );
   }

   async searchProfiles(
      query: string,
      limit: number = 10,
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<Profile[]>>> {
      const config = this.addServiceAuth(
         this.forwardUserAuth(userToken, {
            params: { q: query, limit },
         })
      );

      return this.handleRequest(() =>
         this.client.get<ApiResponse<Profile[]>>(
            "/api/v1/profiles/search",
            config
         )
      );
   }

   async deleteProfile(
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<{ deletedCount: number }>>> {
      const config = this.addServiceAuth(this.forwardUserAuth(userToken));

      return this.handleRequest(() =>
         this.client.delete<ApiResponse<{ deletedCount: number }>>(
            "/api/v1/profiles/me",
            config
         )
      );
   }

   async uploadProfilePicture(
      formData: FormData,
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<{ url: string; key: string }>>> {
      const config = this.addServiceAuth(
         this.forwardUserAuth(userToken, {
            headers: {
               ...formData.getHeaders(),
               // Remove Content-Type to let axios set it with boundary
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
         })
      );

      return this.handleRequest(() =>
         this.client.post<ApiResponse<{ url: string; key: string }>>(
            "/api/v1/uploads/profile-picture",
            formData,
            config
         )
      );
   }

   async deleteProfilePicture(
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<void>>> {
      const config = this.addServiceAuth(this.forwardUserAuth(userToken));

      return this.handleRequest(() =>
         this.client.delete<ApiResponse<void>>(
            "/api/v1/uploads/profile-picture",
            config
         )
      );
   }

   // Auth endpoints (public - no auth required)
   async checkPhone(
      phone: string
   ): Promise<AxiosResponse<ApiResponse<{ exists: boolean; phone: string }>>> {
      return this.handleRequest(() =>
         this.client.post<ApiResponse<{ exists: boolean; phone: string }>>(
            "/api/v1/auth/check-phone",
            { phone }
         )
      );
   }

   // =========================================================================
   // REDUNDANT METHODS - Commented out as app uses OTP-based auth flow
   // These methods are never called since their controller methods are disabled
   // =========================================================================

   // async signup(signupData: any): Promise<AxiosResponse<ApiResponse<any>>> {
   //    return this.handleRequest(() =>
   //       this.client.post<ApiResponse<any>>("/api/v1/auth/signup", signupData)
   //    );
   // }

   // async login(loginData: any): Promise<AxiosResponse<ApiResponse<any>>> {
   //    return this.handleRequest(() =>
   //       this.client.post<ApiResponse<any>>("/api/v1/auth/login", loginData)
   //    );
   // }

   // async passwordReset(
   //    email: string,
   //    continueUrl?: string
   // ): Promise<
   //    AxiosResponse<ApiResponse<{ email: string; resetLink: string }>>
   // > {
   //    return this.handleRequest(() =>
   //       this.client.post<ApiResponse<{ email: string; resetLink: string }>>(
   //          "/api/v1/auth/password/reset",
   //          { email, continueUrl }
   //       )
   //    );
   // }

   // =========================================================================


   async completeOTP(
      idToken: string,
      mode: "login" | "signup",
      phone: string,
      name?: string,
      options?: { clientType?: "web" | "mobile"; deviceId?: string }
   ): Promise<
      AxiosResponse<
         ApiResponse<{
            success: boolean;
            profile?: any;
            user?: any;
            error?: string;
         }>
      >
   > {
      const payload = {
         idToken,
         mode,
         phone,
         name,
         clientType: options?.clientType ?? "web",
         deviceId: options?.deviceId,
      };

      return this.handleRequest(() =>
         this.client.post<
            ApiResponse<{
               success: boolean;
               profile?: any;
               user?: any;
               error?: string;
            }>
         >("/api/v1/auth/otp/complete", payload)
      );
   }

   async syncProfile(
      profileData: { name?: string; phone?: string },
      userToken: UserToken
   ): Promise<AxiosResponse<ApiResponse<any>>> {
      const config = this.addServiceAuth(this.forwardUserAuth(userToken));

      return this.handleRequest(() =>
         this.client.post<ApiResponse<any>>(
            "/api/v1/auth/sync",
            profileData,
            config
         )
      );
   }

   async refreshSession(
      options: SessionRequestOptions
   ): Promise<AxiosResponse<SessionResponse>> {
      const config = this.addServiceAuth({
         withCredentials: true,
         headers: {
            ...(options.cookies ? { Cookie: options.cookies } : {}),
            ...(options.userAgent ? { "User-Agent": options.userAgent } : {}),
            ...(options.ipAddress
               ? { "X-Forwarded-For": options.ipAddress }
               : {}),
         },
      });

      return this.handleRequest(() =>
         this.client.post<SessionResponse>(
            "/api/v1/sessions/refresh",
            {
               clientType: options.clientType ?? "web",
               deviceId: options.deviceId,
               refreshToken: options.refreshToken,
            },
            config
         )
      );
   }

   async logoutSession(
      options: SessionRequestOptions = {}
   ): Promise<AxiosResponse<ApiResponse<{ message?: string }>>> {
      const config = this.addServiceAuth({
         withCredentials: true,
         headers: {
            ...(options.cookies ? { Cookie: options.cookies } : {}),
            ...(options.userAgent ? { "User-Agent": options.userAgent } : {}),
            ...(options.ipAddress
               ? { "X-Forwarded-For": options.ipAddress }
               : {}),
         },
      });

      return this.handleRequest(() =>
         this.client.post<ApiResponse<{ message?: string }>>(
            "/api/v1/sessions/logout",
            {
               clientType: options.clientType ?? "web",
               deviceId: options.deviceId,
            },
            config
         )
      );
   }
}

export const userService = new UserService();
