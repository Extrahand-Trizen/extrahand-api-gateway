import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { ApiResponse } from '../types/api.js';

export class NotificationService extends BaseService {
  constructor() {
    const serviceURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';
    super({
      serviceName: 'NotificationService',
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async registerToken(
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse>(
        '/api/v1/notifications/token',
        { token, platform, deviceId },
        config
      )
    );
  }

  /**
   * In-app notifications (polling) - proxied via gateway
   */

  async getInAppNotifications(
    userToken: UserToken,
    options: { limit?: number; skip?: number; unreadOnly?: boolean } = {}
  ): Promise<AxiosResponse<ApiResponse>> {
    const { limit = 50, skip = 0, unreadOnly = false } = options;

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: {
          limit,
          skip,
          unreadOnly,
        },
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse>('/api/v1/notifications/in-app', config)
    );
  }

  async getUnreadInAppCount(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse>('/api/v1/notifications/in-app/unread-count', config)
    );
  }

  async markAllInAppRead(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    // Send userId in body as fallback in case X-User-Id header is stripped by proxy
    const body = userToken?.uid ? { userId: userToken.uid } : undefined;

    return this.handleRequest(() =>
      this.client.patch<ApiResponse>('/api/v1/notifications/in-app/mark-all-read', body ?? null, config)
    );
  }

  async markInAppRead(
    notificationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.patch<ApiResponse>(
        `/api/v1/notifications/in-app/${notificationId}/read`,
        null,
        config
      )
    );
  }

  async deleteInAppNotification(
    notificationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse>(
        `/api/v1/notifications/in-app/${notificationId}`,
        config
      )
    );
  }

  async removeToken(
    token: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse>(
        '/api/v1/notifications/token',
        {
          ...config,
          data: { token }
        }
      )
    );
  }

  async getPreferences(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse>('/api/v1/notifications/preferences', config)
    );
  }

  async updatePreferences(
    preferences: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.put<ApiResponse>(
        '/api/v1/notifications/preferences',
        preferences,
        config
      )
    );
  }

  // Service-to-service method for sending notifications
  async sendNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      body: string;
      data?: Record<string, any>;
      category?: string;
    }
  ): Promise<AxiosResponse<ApiResponse>> {
    const config = this.addServiceAuth({
      headers: {
        'X-User-Id': userId,
        'X-Service-Name': 'api-gateway'
      }
    });

    return this.handleRequest(() =>
      this.client.post<ApiResponse>(
        '/api/v1/notifications/send',
        {
          userId,
          ...notification
        },
        config
      )
    );
  }
}



























