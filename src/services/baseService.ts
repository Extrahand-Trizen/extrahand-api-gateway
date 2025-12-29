import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import logger from '../config/logger.js';
import { ServiceConfig, ServiceRequestConfig, UserToken } from '../types/service.js';

export abstract class BaseService {
  protected client: AxiosInstance;
  protected serviceName: string;

  constructor(config: ServiceConfig) {
    this.serviceName = config.serviceName;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const serviceConfig = config as ServiceRequestConfig;
        serviceConfig.metadata = { startTime: Date.now() };
        
        // ✅ Clear banner showing microservice call
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔀 [GATEWAY → MICROSERVICE] ${this.serviceName}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Service: ${this.serviceName}`);
        console.log(`📍 Method: ${config.method?.toUpperCase()}`);
        console.log(`📍 URL: ${config.url}`);
        console.log(`📍 Base URL: ${config.baseURL}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        logger.info(`[${this.serviceName}] Request: ${config.method?.toUpperCase()} ${config.url}`, {
          service: this.serviceName,
          method: config.method,
          url: config.url,
          hasAuth: !!config.headers?.Authorization,
        });
        return config;
      },
      (error: AxiosError) => {
        logger.error(`[${this.serviceName}] Request error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const serviceConfig = response.config as ServiceRequestConfig;
        const duration = serviceConfig.metadata
          ? Date.now() - serviceConfig.metadata.startTime
          : 0;
        
        // ✅ Clear banner showing microservice response
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ [MICROSERVICE → GATEWAY] ${this.serviceName}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Service: ${this.serviceName}`);
        console.log(`📍 Status: ${response.status}`);
        console.log(`📍 Duration: ${duration}ms`);
        console.log(`📍 URL: ${response.config.url}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        logger.info(`[${this.serviceName}] Response: ${response.status} (${duration}ms)`, {
          service: this.serviceName,
          status: response.status,
          duration,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        const serviceConfig = error.config as ServiceRequestConfig | undefined;
        const duration = serviceConfig?.metadata 
          ? Date.now() - (serviceConfig.metadata.startTime || 0)
          : 0;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`❌ [MICROSERVICE ERROR] ${this.serviceName}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Service: ${this.serviceName}`);
        console.log(`📍 Base URL: ${error.config?.baseURL || 'N/A'}`);
        console.log(`📍 Full URL: ${error.config?.baseURL}${error.config?.url || ''}`);
        console.log(`📍 Status: ${error.response?.status || 'N/A'}`);
        console.log(`📍 Error: ${error.message}`);
        console.log(`📍 Error Code: ${error.code || 'N/A'}`);
        if (error.code === 'ENOTFOUND') {
          console.log(`⚠️ DNS Resolution Failed - Service hostname not found`);
          console.log(`💡 Check if ${this.serviceName} is running in CapRover`);
          console.log(`💡 Verify service name matches: ${error.config?.baseURL}`);
        }
        console.log(`📍 Duration: ${duration}ms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        logger.error(`[${this.serviceName}] Response error:`, {
          service: this.serviceName,
          status: error.response?.status,
          message: error.message,
          duration,
          url: error.config?.url,
          data: error.response?.data,
        });

        return Promise.reject(error);
      }
    );
  }

  protected addServiceAuth(config: AxiosRequestConfig = {}): AxiosRequestConfig {
    const serviceAuthToken = process.env.SERVICE_AUTH_TOKEN;
    if (serviceAuthToken) {
      config.headers = {
        ...config.headers,
        'X-Service-Auth': serviceAuthToken,
        'X-Service-Name': 'api-gateway',
      };
      console.log(`🔐 [${this.serviceName}] Added service auth token (length: ${serviceAuthToken.length})`);
    } else {
      console.warn(`⚠️ [${this.serviceName}] SERVICE_AUTH_TOKEN not set! Service auth will fail.`);
    }
    return config;
  }

  protected forwardUserAuth(userToken: UserToken | null | undefined, config: AxiosRequestConfig = {}): AxiosRequestConfig {
    if (userToken) {
      // ✨ CRITICAL: Ensure token is a string (JWT), not an object
      const tokenString = typeof userToken.token === 'string' 
        ? userToken.token 
        : JSON.stringify(userToken.token); // Fallback if it's an object (shouldn't happen)
      
      console.log(`🔐 [${this.serviceName}] Forwarding user auth:`, {
        uid: userToken.uid,
        profileId: userToken.profileId?.toString() || 'not set',
        tokenType: typeof userToken.token,
        tokenLength: tokenString.length,
        tokenPrefix: tokenString.substring(0, 20) + '...',
      });
      
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${tokenString}`,
        'X-User-Id': userToken.uid, // Keep for backward compatibility
        ...(userToken.profileId && {
          'X-Profile-Id': userToken.profileId.toString(), // ✅ New header for ObjectId reference
        }),
      };
    }
    return config;
  }

  protected async handleRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // ✨ Enhanced error logging for debugging
        const errorDetails = {
          code: axiosError.code,
          message: axiosError.message,
          response: axiosError.response ? {
            status: axiosError.response.status,
            data: axiosError.response.data,
          } : null,
          request: {
            url: axiosError.config?.url,
            baseURL: axiosError.config?.baseURL,
            method: axiosError.config?.method,
          },
        };
        
        logger.error(`[${this.serviceName}] Request failed:`, errorDetails);
        console.error(`❌ [${this.serviceName}] Detailed Error:`, JSON.stringify(errorDetails, null, 2));
        
        // Check for specific error types
        if (axiosError.code === 'ENOTFOUND' || axiosError.message.includes('ENOTFOUND')) {
          const hostname = axiosError.config?.baseURL?.replace(/^https?:\/\//, '').split(':')[0];
          throw {
            status: 503,
            message: `Cannot resolve hostname for ${this.serviceName}: ${hostname}. Service may not be running or service name is incorrect.`,
            data: { 
              code: 'ENOTFOUND', 
              service: this.serviceName, 
              url: axiosError.config?.baseURL,
              hostname: hostname,
              troubleshooting: 'Check if the service is running in CapRover and verify the service name matches exactly'
            },
            service: this.serviceName,
          };
        }
        
        if (axiosError.code === 'ECONNREFUSED') {
          throw {
            status: 503,
            message: `Cannot connect to ${this.serviceName} at ${axiosError.config?.baseURL}. Service may not be running.`,
            data: { code: 'ECONNREFUSED', service: this.serviceName, url: axiosError.config?.baseURL },
            service: this.serviceName,
          };
        }
        
        if (axiosError.code === 'ETIMEDOUT' || axiosError.message.includes('timeout')) {
          throw {
            status: 504,
            message: `Request to ${this.serviceName} timed out. Service may be overloaded or not responding.`,
            data: { code: 'ETIMEDOUT', service: this.serviceName, url: axiosError.config?.baseURL },
            service: this.serviceName,
          };
        }
        
        throw {
          status: axiosError.response?.status || 500,
          message: axiosError.message,
          data: axiosError.response?.data || errorDetails,
          service: this.serviceName,
        };
      }
      throw error;
    }
  }
}

