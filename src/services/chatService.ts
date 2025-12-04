import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { ApiResponse } from '../types/api.js';

export class ChatService extends BaseService {
  constructor() {
    const serviceURL = process.env.OLD_BACKEND_URL || 'http://localhost:4000';
    console.log(`🔧 [ChatService] Initializing with URL: ${serviceURL}`);
    super({
      serviceName: 'ChatService',
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async startChat(
    chatData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    // For old backend, we forward the user token directly
    const config = {
      headers: {
        Authorization: `Bearer ${userToken.token}`,
        'X-User-Id': userToken.uid,
      },
    };

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>('/api/v1/chats/start', chatData, config)
    );
  }

  async getMessages(
    chatId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const config = {
      headers: {
        Authorization: `Bearer ${userToken.token}`,
        'X-User-Id': userToken.uid,
      },
    };

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any[]>>(`/api/v1/chats/${chatId}/messages`, config)
    );
  }

  async sendMessage(
    chatId: string,
    messageData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = {
      headers: {
        Authorization: `Bearer ${userToken.token}`,
        'X-User-Id': userToken.uid,
      },
    };

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(`/api/v1/chats/${chatId}/messages`, messageData, config)
    );
  }

  async getUserChats(
    queryParams: Record<string, any>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const config = {
      headers: {
        Authorization: `Bearer ${userToken.token}`,
        'X-User-Id': userToken.uid,
      },
      params: queryParams,
    };

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any[]>>('/api/v1/chats', config)
    );
  }
}

export const chatService = new ChatService();


