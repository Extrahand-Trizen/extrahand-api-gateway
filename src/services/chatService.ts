import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { ApiResponse } from '../types/api.js';

export class ChatService extends BaseService {
  constructor() {
    const serviceURL = process.env.CHAT_SERVICE_URL || 'http://localhost:4003';
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
    // Use service-to-service authentication
    const config = {
      headers: {
        'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN,
        'X-Service-Name': 'api-gateway',
        Authorization: `Bearer ${JSON.stringify(userToken)}`,
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
        'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN,
        'X-Service-Name': 'api-gateway',
        Authorization: `Bearer ${JSON.stringify(userToken)}`,
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
        'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN,
        'X-Service-Name': 'api-gateway',
        Authorization: `Bearer ${JSON.stringify(userToken)}`,
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
        'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN,
        'X-Service-Name': 'api-gateway',
        Authorization: `Bearer ${JSON.stringify(userToken)}`,
      },
      params: queryParams,
    };

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any[]>>('/api/v1/chats', config)
    );
  }

  async getChatDetails(
    chatId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = {
      headers: {
        'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN,
        'X-Service-Name': 'api-gateway',
        Authorization: `Bearer ${JSON.stringify(userToken)}`,
      },
    };

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(`/api/v1/chats/${chatId}`, config)
    );
  }

  /**
   * Start a chat for a specific task (with permission validation)
   */
  async startChatForTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = {
      headers: {
        'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN,
        'X-Service-Name': 'api-gateway',
        Authorization: `Bearer ${JSON.stringify(userToken)}`,
      },
    };

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(`/api/v1/chats/task/${taskId}/start`, {}, config)
    );
  }

  /**
   * Mark chat as read
   */
  async markChatAsRead(
    chatId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = {
      headers: {
        'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN,
        'X-Service-Name': 'api-gateway',
        Authorization: `Bearer ${JSON.stringify(userToken)}`,
      },
    };

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(`/api/v1/chats/${chatId}/read`, {}, config)
    );
  }
}

export const chatService = new ChatService();


