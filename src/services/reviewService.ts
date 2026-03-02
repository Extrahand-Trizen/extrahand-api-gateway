import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { ApiResponse } from '../types/api.js';

export class ReviewService extends BaseService {
  constructor() {
    const serviceURL = process.env.TASK_SERVICE_URL || 'http://localhost:4002';
    super({
      serviceName: 'task-service',
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async getUserReviews(
    userId: string,
    filters: {
      limit?: number;
      skip?: number;
      rating?: number;
    }
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth({
      params: filters,
    });

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(`/api/v1/reviews/user/${userId}`, config)
    );
  }

  async createReview(
    reviewData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>('/api/v1/reviews', reviewData, config)
    );
  }

  async getTaskReview(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(`/api/v1/reviews/task/${taskId}`, config)
    );
  }

  async voteHelpful(
    reviewId: string,
    helpful: boolean,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(`/api/v1/reviews/${reviewId}/vote`, { helpful }, config)
    );
  }
}

export const reviewService = new ReviewService();

