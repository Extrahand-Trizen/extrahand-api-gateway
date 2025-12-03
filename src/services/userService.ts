import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { Profile, ApiResponse } from '../types/api.js';
import FormData from 'form-data';

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

  async updateCurrentProfile(
    profileData: Partial<Profile>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Profile>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.put<ApiResponse<Profile>>('/api/v1/profiles/me', profileData, config)
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

  async deleteProfile(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ deletedCount: number }>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<{ deletedCount: number }>>('/api/v1/profiles/me', config)
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
        '/api/v1/uploads/profile-picture',
        formData,
        config
      )
    );
  }

  async deleteProfilePicture(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<void>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<void>>('/api/v1/uploads/profile-picture', config)
    );
  }

  // Auth endpoints (public - no auth required)
  async checkPhone(phone: string): Promise<AxiosResponse<ApiResponse<{ exists: boolean; phone: string }>>> {
    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ exists: boolean; phone: string }>>(
        '/api/v1/auth/check-phone',
        { phone }
      )
    );
  }

  async signup(signupData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>('/api/v1/auth/signup', signupData)
    );
  }

  async login(loginData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>('/api/v1/auth/login', loginData)
    );
  }

  async passwordReset(email: string, continueUrl?: string): Promise<AxiosResponse<ApiResponse<{ email: string; resetLink: string }>>> {
    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ email: string; resetLink: string }>>(
        '/api/v1/auth/password/reset',
        { email, continueUrl }
      )
    );
  }
}

export const userService = new UserService();

