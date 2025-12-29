import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { Task, ApiResponse } from '../types/api.js';
import FormData from 'form-data';

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

  async uploadTaskImage(
    formData: FormData,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ url: string; key: string }>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ url: string; key: string }>>(
        '/api/v1/uploads/task-image',
        formData,
        config
      )
    );
  }

  async uploadCompletionProof(
    taskId: string,
    formData: FormData,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ url: string; key: string }>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ url: string; key: string }>>(
        `/api/v1/uploads/completion-proof/${taskId}`,
        formData,
        config
      )
    );
  }

  async uploadMultipleCompletionProofs(
    taskId: string,
    formData: FormData,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ urls: string[] }>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ urls: string[] }>>(
        `/api/v1/uploads/completion-proof/${taskId}/multiple`,
        formData,
        config
      )
    );
  }

  async getTaskQuestions(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any[]>>(`/api/v1/tasks/${taskId}/questions`, config)
    );
  }

  async askQuestion(
    taskId: string,
    questionData: { question: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(`/api/v1/tasks/${taskId}/questions`, questionData, config)
    );
  }

  async answerQuestion(
    taskId: string,
    questionId: string,
    answerData: { answer: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${taskId}/questions/${questionId}/answer`,
        answerData,
        config
      )
    );
  }

  async deleteQuestion(
    taskId: string,
    questionId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<void>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<void>>(
        `/api/v1/tasks/${taskId}/questions/${questionId}`,
        config
      )
    );
  }

  async updateTaskStatus(
    taskId: string,
    status: string,
    userToken: UserToken,
    cancellationReason?: string
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    const body: any = { status };
    if (cancellationReason) {
      body.cancellationReason = cancellationReason;
    }

    return this.handleRequest(() =>
      this.client.patch<ApiResponse<Task>>(`/api/v1/tasks/${taskId}/status`, body, config)
    );
  }

  async submitCompletionProof(
    taskId: string,
    data: { proofUrls?: string[]; notes?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(`/api/v1/tasks/${taskId}/submit-proof`, data, config)
    );
  }

  async approveCompletion(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(`/api/v1/tasks/${taskId}/approve-completion`, {}, config)
    );
  }

  async rejectCompletion(
    taskId: string,
    data: { reason?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(`/api/v1/tasks/${taskId}/reject-completion`, data, config)
    );
  }

  async followTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(`/api/v1/tasks/${taskId}/follow`, {}, config)
    );
  }

  async unfollowTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<any>>(`/api/v1/tasks/${taskId}/follow`, config)
    );
  }

  async checkFollowStatus(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(`/api/v1/tasks/${taskId}/follow`, config)
    );
  }

  async getFollowedTasks(
    page: number,
    limit: number,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: { page, limit },
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>('/api/v1/tasks/followed', config)
    );
  }

  async reportTask(
    taskId: string,
    reason: string,
    description: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    const body: any = { reason };
    if (description) {
      body.description = description;
    }

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(`/api/v1/tasks/${taskId}/report`, body, config)
    );
  }

  async getTaskReports(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(`/api/v1/tasks/${taskId}/reports`, config)
    );
  }
}

export const taskService = new TaskService();

