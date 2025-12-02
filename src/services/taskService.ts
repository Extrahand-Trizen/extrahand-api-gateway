import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { Task, ApiResponse } from '../types/api.js';

export interface TaskFilters {
  category?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  city?: string;
  limit?: number;
  skip?: number;
}

export class TaskService extends BaseService {
  constructor() {
    const serviceURL = process.env.TASK_SERVICE_URL || 'http://localhost:4002';
    console.log(`🔧 [TaskService] Initializing with URL: ${serviceURL}`);
    super({
      serviceName: 'TaskService',
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async getTasks(
    filters: TaskFilters,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task[]>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: filters,
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Task[]>>('/api/v1/tasks', config)
    );
  }

  async getTaskById(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Task>>(`/api/v1/tasks/${taskId}`, config)
    );
  }

  async createTask(
    taskData: Partial<Task>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>('/api/v1/tasks', taskData, config)
    );
  }

  async updateTask(
    taskId: string,
    taskData: Partial<Task>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.put<ApiResponse<Task>>(`/api/v1/tasks/${taskId}`, taskData, config)
    );
  }

  async deleteTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<void>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<void>>(`/api/v1/tasks/${taskId}`, config)
    );
  }

  async getTaskApplications(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any[]>>(`/api/v1/tasks/${taskId}/applications`, config)
    );
  }

  async getApplications(
    queryParams: Record<string, any>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: queryParams,
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>('/api/v1/applications', config)
    );
  }

  async submitApplication(
    applicationData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>('/api/v1/applications', applicationData, config)
    );
  }

  async getApplication(
    applicationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(`/api/v1/applications/${applicationId}`, config)
    );
  }

  async updateApplication(
    applicationId: string,
    updateData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.put<ApiResponse<any>>(`/api/v1/applications/${applicationId}`, updateData, config)
    );
  }

  async withdrawApplication(
    applicationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<void>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<void>>(`/api/v1/applications/${applicationId}`, config)
    );
  }
}

export const taskService = new TaskService();

