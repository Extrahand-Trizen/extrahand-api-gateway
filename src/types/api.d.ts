export interface Profile {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  roles: string[];
  userType: 'individual' | 'business';
  skills?: string[];
  rating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  isAadhaarVerified?: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
  };
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  requesterId: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

