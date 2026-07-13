export interface SavedAddress {
  _id?: string;
  label: "Home" | "Work" | "Other";
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  city?: string;
  state?: string;
  country?: string;
  addressDetails?: {
    doorNo?: string;
    landmark?: string;
    area?: string;
    pinCode?: string;
  };
  name?: string;
  phone?: string;
  isDefault?: boolean;
  createdAt?: Date | string;
}

export interface Profile {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  /** Alias returned by some user-service payloads */
  phoneNumber?: string;
  /** Demo / play-review account flag from user-service */
  reviewBypassActive?: boolean;
  roles: string[];
  userType: "individual" | "business";
  skills?: string[];
  rating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  isAadhaarVerified?: boolean;
  isBankVerified?: boolean;
  isPanVerified?: boolean;
  business?: {
    pan?: { isPANVerified?: boolean };
  };
  location?: {
    type: "Point";
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
  };
  savedAddresses?: SavedAddress[];
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget: {
    amount: number;
    currency: string;
    type: "fixed" | "hourly";
  };
  isNegotiable: boolean;
  status: string;
  requesterId: string;
  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
    city?: string;
    state?: string;
    country?: string;
    taskArea?: string;
  };
  flexibility: "strict" | "flexible" | "anytime";
  timeFlexibilityValue?: "exact" | "1h" | "3h";
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
   success: boolean;
   data?: T;
   error?: string;
   message?: string;
}

export interface SessionTokens {
   accessToken: string;
   accessTokenExpiresAt: string;
   sessionId: string;
   refreshToken?: string;
   refreshTokenExpiresAt?: string;
}export interface SessionResponse {
   success: boolean;
   tokens: SessionTokens;
   message?: string;
}