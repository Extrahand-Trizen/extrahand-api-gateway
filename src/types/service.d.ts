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

export interface UserToken {
  uid: string;
  token: any;
  profileId?: string; // Profile ID from user-service
  sessionId?: string;
}

export interface ServiceError {
  status: number;
  message: string;
  data?: any;
  service: string;
}

