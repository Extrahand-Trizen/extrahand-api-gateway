import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ServiceConfig {
  baseURL: string;
  timeout?: number;
  serviceName: string;
}

export interface ServiceRequestConfig extends AxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

export interface ServiceResponse<T = any> extends AxiosResponse<T> {
  config: ServiceRequestConfig;
}

import mongoose from 'mongoose';

export interface UserToken {
  uid: string;
  token: any;
  profileId?: mongoose.Types.ObjectId; // ObjectId reference to Profile
  sessionId?: string;
}

export interface ServiceError {
  status: number;
  message: string;
  data?: any;
  service: string;
}

