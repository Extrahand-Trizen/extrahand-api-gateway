import { BaseService } from "./baseService.js";
import { AxiosResponse } from "axios";
import { UserToken } from "../types/service.js";
import { Profile, ApiResponse, SessionResponse } from "../types/api.js";
import FormData from "form-data";
import { parseReferralChannel } from "../utils/rewardsContext.js";

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
    const serviceURL = process.env.USER_SERVICE_URL || "http://localhost:4001";
    super({
      serviceName: "UserService",
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async getProfile(
    userId: string,
    userToken: UserToken | undefined
  ): Promise<AxiosResponse<ApiResponse<Profile>>> {
    const baseConfig = {
      headers: {
        "X-User-Id": userId,
      },
    };

    const config = this.addServiceAuth(
      userToken
        ? this.forwardUserAuth(userToken, baseConfig)
        : baseConfig
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

  async getCategoryAlerts(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ categories: Array<{ slug: string; name: string }> }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<{ categories: Array<{ slug: string; name: string }> }>>(
        "/api/v1/profiles/me/category-alerts",
        config
      )
    );
  }

  async updateCategoryAlerts(
    categories: Array<{ slug: string; name: string }>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ categories: Array<{ slug: string; name: string }> }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.put<ApiResponse<{ categories: Array<{ slug: string; name: string }> }>>(
        "/api/v1/profiles/me/category-alerts",
        { categories },
        config
      )
    );
  }

  async getBookNowCart(userToken: UserToken): Promise<
    AxiosResponse<
      ApiResponse<{
        items: Array<Record<string, unknown>>;
      }>
    >
  > {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<{ items: Array<Record<string, unknown>> }>>(
        "/api/v1/profiles/me/book-now-cart",
        config
      )
    );
  }

  async addBookNowCartItem(
    item: Record<string, unknown>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ items: Array<Record<string, unknown>> }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ items: Array<Record<string, unknown>> }>>(
        "/api/v1/profiles/me/book-now-cart/items",
        item,
        config
      )
    );
  }

  async updateBookNowCartItemQuantity(
    payload: { catalogId: string; packageId: string; quantity: number },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ items: Array<Record<string, unknown>> }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.patch<ApiResponse<{ items: Array<Record<string, unknown>> }>>(
        "/api/v1/profiles/me/book-now-cart/items",
        payload,
        config
      )
    );
  }

  async removeBookNowCartItem(
    catalogId: string,
    packageId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ items: Array<Record<string, unknown>> }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<{ items: Array<Record<string, unknown>> }>>(
        `/api/v1/profiles/me/book-now-cart/items/${encodeURIComponent(catalogId)}/${encodeURIComponent(packageId)}`,
        config
      )
    );
  }

  async clearBookNowCart(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ items: Array<Record<string, unknown>> }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<{ items: Array<Record<string, unknown>> }>>(
        "/api/v1/profiles/me/book-now-cart",
        config
      )
    );
  }

  async getKeywordAlerts(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ keywords: string[] }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<{ keywords: string[] }>>(
        "/api/v1/profiles/me/keyword-alerts",
        config
      )
    );
  }

  async updateKeywordAlerts(
    keywords: string[],
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ keywords: string[] }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.put<ApiResponse<{ keywords: string[] }>>(
        "/api/v1/profiles/me/keyword-alerts",
        { keywords },
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
      this.client.get<ApiResponse<Profile[]>>("/api/v1/profiles/search", config)
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

  async getProfileStats(
    userId: string
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth({});

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/profiles/${userId}/stats`,
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

  async uploadCertificate(
    formData: FormData,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ url: string; key: string }>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ url: string; key: string }>>(
        "/api/v1/uploads/certificate",
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

  // Auth endpoints (public - no auth required from user, but needs service auth for gateway)
  async checkPhone(
    phone: string
  ): Promise<AxiosResponse<ApiResponse<{ exists: boolean; phone: string }>>> {
    const config = this.addServiceAuth({});

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ exists: boolean; phone: string }>>(
        "/api/v1/auth/check-phone",
        { phone },
        config
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
    options?: {
      clientType?: "web" | "mobile";
      deviceId?: string;
      otp?: string;
      referralCode?: string;
      referralChannel?: "poster" | "tasker" | "customer";
    }
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
    const payload: Record<string, unknown> = {
      idToken,
      mode,
      phone,
      name,
      otp: options?.otp,
      clientType: options?.clientType ?? "web",
      deviceId: options?.deviceId,
    };
    if (options?.referralCode?.trim()) {
      payload.referralCode = options.referralCode.trim();
    }
    if (options?.referralChannel) {
      payload.referralChannel = parseReferralChannel(options.referralChannel);
    }

    // Service auth is required by User Service's gatewayAuthMiddleware
    const config = this.addServiceAuth({});

    return this.handleRequest(() =>
      this.client.post<
        ApiResponse<{
          success: boolean;
          profile?: any;
          user?: any;
          error?: string;
        }>
      >("/api/v1/auth/otp/complete", payload, config)
    );
  }

  /**
   * Dev-only: dummy signin/signup with +91 9876543210, OTP 123456 (no Firebase).
   * Use when LOCAL_TEST=true or NODE_ENV=development.
   */
  async completeOTPDev(
    phone: string,
    otp: string,
    mode: "login" | "signup",
    name?: string,
    options?: {
      clientType?: "web" | "mobile";
      deviceId?: string;
      referralCode?: string;
      referralChannel?: "poster" | "tasker" | "customer";
    }
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        success: boolean;
        profile?: any;
        user?: any;
        sessionId?: string;
        accessTokenExpiresAt?: string;
        error?: string;
      }>
    >
  > {
    const payload: Record<string, unknown> = {
      phone,
      otp,
      mode,
      name,
      clientType: options?.clientType ?? "web",
      deviceId: options?.deviceId,
    };
    if (options?.referralCode?.trim()) {
      payload.referralCode = options.referralCode.trim();
    }
    if (options?.referralChannel) {
      payload.referralChannel = parseReferralChannel(options.referralChannel);
    }
    const config = this.addServiceAuth({});
    return this.handleRequest(() =>
      this.client.post<
        ApiResponse<{
          success: boolean;
          profile?: any;
          user?: any;
          sessionId?: string;
          accessTokenExpiresAt?: string;
          error?: string;
        }>
      >("/api/v1/auth/otp/complete-dev", payload, config)
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

  async checkPhoneAvailability(
    phone: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ available: boolean; message?: string }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ available: boolean; message?: string }>>(
        '/api/v1/profiles/check-phone',
        { phone },
        config
      )
    );
  }

  async changePhone(
    phone: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.put<ApiResponse<any>>(
        '/api/v1/profiles/change-phone',
        { phone },
        config
      )
    );
  }

  async sendAlternatePhoneOtp(
    phone: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/profiles/alternate-phone/send-otp',
        { phone },
        config
      )
    );
  }

  async verifyAlternatePhoneOtp(
    phone: string,
    otp: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/profiles/alternate-phone/verify',
        { phone, otp },
        config
      )
    );
  }

  async verifyAlternatePhoneFirebase(
    phone: string,
    originalIdToken: string,
    alternateIdToken: string
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth({});
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/profiles/alternate-phone/verify-firebase',
        { phone, originalIdToken, alternateIdToken },
        config
      )
    );
  }

  async removeAlternatePhone(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.delete<ApiResponse<any>>(
        '/api/v1/profiles/alternate-phone',
        config
      )
    );
  }

  async sendAlternateLoginOtp(
    phone: string
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth({});
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/auth/alternate-login/send-otp',
        { phone },
        config
      )
    );
  }

  async verifyAlternateLoginOtp(
    phone: string,
    otp: string
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth({});
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/auth/alternate-login/verify',
        { phone, otp },
        config
      )
    );
  }

  async completeAlternateLoginFirebase(
    phone: string,
    alternateIdToken: string
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth({});
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/auth/alternate-login/verify-firebase',
        { phone, alternateIdToken },
        config
      )
    );
  }

  async restoreFirebaseSession(idToken: string): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth({});
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/auth/session/restore-firebase',
        { idToken },
        config
      )
    );
  }

  /**
   * GET /api/v1/profiles/by-id/:profileId
   * Get profile by ObjectId (for enrichment - minimal fields)
   */
  async getProfileById(
    profileId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{
    _id: string;
    name: string;
    photoURL?: string | null;
    rating?: number;
    totalReviews?: number;
  }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<{
        _id: string;
        name: string;
        photoURL?: string | null;
        rating?: number;
        totalReviews?: number;
      }>>(`/api/v1/profiles/by-id/${profileId}`, config)
    );
  }

  /**
   * POST /api/v1/profiles/batch
   * Get multiple profiles by ObjectIds (for enrichment - minimal fields)
   */
  async getProfilesBatch(
    profileIds: string[],
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{
    _id: string;
    name: string;
    photoURL?: string | null;
    rating?: number;
    totalReviews?: number;
  }[]>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{
        _id: string;
        name: string;
        photoURL?: string | null;
        rating?: number;
        totalReviews?: number;
      }[]>>(
        "/api/v1/profiles/batch",
        { profileIds },
        config
      )
    );
  }

  /**
   * GET /api/v1/profiles/public/id/:profileId
   * Get public profile by MongoDB ObjectId (full public profile)
   */
  async getPublicProfileById(
    profileId: string,
    userToken: UserToken | undefined
  ): Promise<AxiosResponse<ApiResponse<Profile>>> {
    const config = this.addServiceAuth(
      userToken ? this.forwardUserAuth(userToken) : {}
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Profile>>(
        `/api/v1/profiles/public/id/${profileId}`,
        config
      )
    );
  }

  /**
   * GET /api/v1/profiles/public/:uid
   * Get public profile by Firebase UID (full public profile with visibility enforcement)
   * Visibility rules applied server-side:
   *   - public       → anyone can view
   *   - registered   → must be logged in
   *   - connections  → must have a completed task together
   */
  async getPublicProfileByUid(
    uid: string,
    userToken: UserToken | undefined
  ): Promise<AxiosResponse<ApiResponse<Profile>>> {
    const config = this.addServiceAuth(
      userToken ? this.forwardUserAuth(userToken) : {}
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Profile>>(
        `/api/v1/profiles/public/${uid}`,
        config
      )
    );
  }

  // Address Management Methods
  async getAddresses(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>("/api/v1/profiles/me/addresses", config)
    );
  }

  async addAddress(
    addressData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        "/api/v1/profiles/me/addresses",
        addressData,
        config
      )
    );
  }

  async updateAddress(
    addressId: string,
    addressData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.put<ApiResponse<any>>(
        `/api/v1/profiles/me/addresses/${addressId}`,
        addressData,
        config
      )
    );
  }

  async deleteAddress(
    addressId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<any>>(
        `/api/v1/profiles/me/addresses/${addressId}`,
        config
      )
    );
  }

  async setDefaultAddress(
    addressId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.patch<ApiResponse<any>>(
        `/api/v1/profiles/me/addresses/${addressId}/default`,
        {},
        config
      )
    );
  }

  /**
   * GET /api/v1/profiles/nearby-helpers
   * Returns helpers (taskers) near the given coordinates or location text tokens.
   */
  async getNearbyHelpers(
    params: {
      lat?: number;
      lng?: number;
      radiusKm?: number;
      city?: string;
      area?: string;
      pinCode?: string;
      fullAddress?: string;
      limit?: number;
    },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{
    helpers: Array<{
      _id: string;
      uid: string;
      name: string;
      photoURL: string | null;
      rating: number;
      totalReviews: number;
      skills: any;
      location: { city?: string; state?: string; area?: string } | null;
      isAadhaarVerified: boolean;
      verificationBadge?: string;
    }>;
    count: number;
    hasHelpers: boolean;
  }>>> {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.set('lat', String(params.lat));
    if (params.lng !== undefined) query.set('lng', String(params.lng));
    if (params.radiusKm !== undefined) query.set('radiusKm', String(params.radiusKm));
    if (params.city?.trim()) query.set('city', params.city.trim());
    if (params.area?.trim()) query.set('area', params.area.trim());
    if (params.pinCode?.trim()) query.set('pinCode', params.pinCode.trim());
    if (params.fullAddress?.trim()) query.set('fullAddress', params.fullAddress.trim());
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/profiles/nearby-helpers?${query.toString()}`,
        config
      )
    );
  }

  async createLocationNotifyRequest(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>('/api/v1/profiles/location-notify', {}, config)
    );
  }

  async getLocationNotifyRequestStatus(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>('/api/v1/profiles/location-notify/me', config)
    );
  }

  async createInstantServicesNotifyRequest(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>('/api/v1/profiles/instant-services-notify', {}, config)
    );
  }

  async getInstantServicesNotifyRequestStatus(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>('/api/v1/profiles/instant-services-notify/me', config)
    );
  }

  // Profile Stats Methods
  async getMyStats(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{
    totalTasks: number;
    completedTasks: number;
    postedTasks: number;
    totalReviews: number;
    rating: number;
  }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<{
        totalTasks: number;
        completedTasks: number;
        postedTasks: number;
        totalReviews: number;
        rating: number;
      }>>("/api/v1/profiles/me/stats", config)
    );
  }

  async recalculateStats(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{
    totalTasks: number;
    completedTasks: number;
    postedTasks: number;
    totalReviews: number;
    rating: number;
  }>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{
        totalTasks: number;
        completedTasks: number;
        postedTasks: number;
        totalReviews: number;
        rating: number;
      }>>("/api/v1/profiles/me/stats/recalculate", {}, config)
    );
  }

  async proxySupply(
    method: 'get' | 'post' | 'patch',
    path: string,
    userToken: UserToken,
    body?: unknown,
  ): Promise<AxiosResponse<ApiResponse<unknown>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    const url = `/api/v1/profiles${path}`;
    return this.handleRequest(() => {
      if (method === 'get') return this.client.get(url, config);
      if (method === 'post') return this.client.post(url, body, config);
      return this.client.patch(url, body, config);
    });
  }
}

export const userService = new UserService();
