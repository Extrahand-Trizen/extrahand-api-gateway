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
  roles: string[];
  userType: "individual" | "business";
  skills?: string[];
  rating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  isAadhaarVerified?: boolean;
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
