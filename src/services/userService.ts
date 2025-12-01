import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { Profile, ApiResponse } from '../types/api.js';

export class UserService extends BaseService {
  constructor() {
    const serviceURL = process.env.USER_SERVICE_URL || 'http://localhost:4001';
    super({
      serviceName: 'UserService',
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async getProfile(userId: string, userToken: UserToken): Promise<AxiosResponse<ApiResponse<Profile>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        headers: {
          'X-User-Id': userId,
        },
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Profile>>(`/api/v1/profiles/${userId}`, config)
    );
  }

  async getCurrentProfile(userToken: UserToken): Promise<AxiosResponse<ApiResponse<Profile>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Profile>>('/api/v1/profiles/me', config)
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
          'X-User-Id': userId,
        },
      })
    );

    return this.handleRequest(() =>
      this.client.put<ApiResponse<Profile>>(`/api/v1/profiles/${userId}`, profileData, config)
    );
  }

  async upsertProfile(
    profileData: Partial<Profile>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Profile>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Profile>>('/api/v1/profiles', profileData, config)
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
      this.client.get<ApiResponse<Profile[]>>('/api/v1/profiles/search', config)
    );
  }
}

export const userService = new UserService();

