import { BaseService } from "./baseService.js";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { UserToken } from "../types/service.js";
import { Task, ApiResponse } from "../types/api.js";
import FormData from "form-data";

export interface TaskFilters {
  category?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  city?: string;
  search?: string;
  suburb?: string;
  remotely?: string | boolean;
  sortBy?: string;
  excludeRequesterId?: string;
  limit?: number;
  page?: number;
  assigneeId?: string;
  posterUid?: string;
  requesterId?: string;
}

/** When LOCAL_TEST is on, task-service may skip SMS / use fixed OTP for start-work (opt-in upstream). */
function withLocalTestHeader(config: AxiosRequestConfig): AxiosRequestConfig {
  const allow =
    process.env.LOCAL_TEST === "true" || process.env.LOCAL_TEST === "1";
  if (!allow) return config;
  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Extrahand-Local-Test": "1",
    },
  };
}

export class TaskService extends BaseService {
  /** Image uploads (compress + storage) need longer than default API calls. */
  private readonly uploadTimeoutMs = 120_000;
  /** Recurring visit reads may merge schedule + payment state. */
  private readonly recurringReadTimeoutMs = 45_000;
  private readonly createTaskTimeoutMs = 60_000;

  constructor() {
    const serviceURL = process.env.TASK_SERVICE_URL || "http://localhost:4002";
    console.log(`🔧 [TaskService] Initializing with URL: ${serviceURL}`);
    super({
      serviceName: "TaskService",
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async getTasks(
    filters: TaskFilters,
    userToken?: UserToken | null
  ): Promise<AxiosResponse<ApiResponse<Task[]>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: filters,
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Task[]>>("/api/v1/tasks", config)
    );
  }

  async getMyTasks(
    filters: { status?: string; limit?: number; page?: number; type?: string; include?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ tasks: Task[]; pagination: any }>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: filters,
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<{ tasks: Task[]; pagination: any }>>(
        "/api/v1/tasks/my-tasks",
        config
      )
    );
  }

  async getTaskById(
    taskId: string,
    userToken?: UserToken | null
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, { timeout: this.recurringReadTimeoutMs }),
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
      this.forwardUserAuth(userToken, { timeout: this.createTaskTimeoutMs }),
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>("/api/v1/tasks", taskData, config)
    );
  }

  async updateTask(
    taskId: string,
    taskData: Partial<Task>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.put<ApiResponse<Task>>(
        `/api/v1/tasks/${taskId}`,
        taskData,
        config
      )
    );
  }

  async deleteTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<void>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<void>>(`/api/v1/tasks/${taskId}`, config)
    );
  }

  async getTaskApplications(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, { params: { taskId } })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any[]>>("/api/v1/applications", config)
    );
  }

  async getApplications(
    queryParams: Record<string, any>,
    userToken: UserToken | undefined
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: queryParams,
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>("/api/v1/applications", config)
    );
  }

  async submitApplication(
    applicationData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        "/api/v1/applications",
        applicationData,
        config
      )
    );
  }

  async getApplication(
    applicationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/applications/${applicationId}`,
        config
      )
    );
  }

  async updateApplication(
    applicationId: string,
    updateData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.put<ApiResponse<any>>(
        `/api/v1/applications/${applicationId}`,
        updateData,
        config
      )
    );
  }

  /** Tasker edits own pending application (PATCH — distinct from PUT status updates). */
  async editApplication(
    applicationId: string,
    body: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.patch<ApiResponse<any>>(
        `/api/v1/applications/${applicationId}`,
        body,
        config
      )
    );
  }

  async negotiateApplication(
    applicationId: string,
    negotiationData: any,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/applications/${applicationId}/negotiate`,
        negotiationData,
        config
      )
    );
  }

  async withdrawPendingApplication(
    applicationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<void>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<void>>(
        `/api/v1/applications/${applicationId}/withdraw-pending`,
        {},
        config
      )
    );
  }

  async withdrawAcceptedApplication(
    applicationId: string,
    reason: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<void>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    const body: any = {};
    if (reason) {
      body.reason = reason;
    }

    return this.handleRequest(() =>
      this.client.post<ApiResponse<void>>(
        `/api/v1/applications/${applicationId}/withdraw-accepted`,
        body,
        config
      )
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
        `/api/v1/uploads/task-image`,
        formData,
        { ...config, timeout: this.uploadTimeoutMs },
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
        { ...config, timeout: this.uploadTimeoutMs },
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
        { ...config, timeout: this.uploadTimeoutMs },
      )
    );
  }

  async getTaskQuestions(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any[]>>(
        `/api/v1/tasks/${taskId}/questions`,
        config
      )
    );
  }

  async askQuestion(
    taskId: string,
    questionData: { question: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${taskId}/questions`,
        questionData,
        config
      )
    );
  }

  async answerQuestion(
    taskId: string,
    questionId: string,
    answerData: { answer: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

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
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

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
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    const body: any = { status };
    if (cancellationReason) {
      body.cancellationReason = cancellationReason;
    }

    return this.handleRequest(() =>
      this.client.patch<ApiResponse<Task>>(
        `/api/v1/tasks/${taskId}/status`,
        body,
        config
      )
    );
  }

  async submitCompletionProof(
    taskId: string,
    data: { proofUrls?: string[]; notes?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(`/api/v1/tasks/${taskId}/submit-proof`, data, config)
    );
  }

  async sendStartOtp(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ expiresAt: string; sentTo: string }>>> {
    const config = withLocalTestHeader(
      this.addServiceAuth(this.forwardUserAuth(userToken)),
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ expiresAt: string; sentTo: string }>>(
        `/api/v1/tasks/${taskId}/start-otp/send`,
        {},
        config
      )
    );
  }

  async resendStartOtp(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<{ expiresAt: string; sentTo: string }>>> {
    const config = withLocalTestHeader(
      this.addServiceAuth(this.forwardUserAuth(userToken)),
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<{ expiresAt: string; sentTo: string }>>(
        `/api/v1/tasks/${taskId}/start-otp/resend`,
        {},
        config
      )
    );
  }

  async verifyStartOtp(
    taskId: string,
    otp: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = withLocalTestHeader(
      this.addServiceAuth(this.forwardUserAuth(userToken)),
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(
        `/api/v1/tasks/${taskId}/start-otp/verify`,
        { otp },
        config
      )
    );
  }

  async approveCompletion(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(
        `/api/v1/tasks/${taskId}/approve-completion`,
        {},
        config
      )
    );
  }

  async rejectCompletion(
    taskId: string,
    data: { reason?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(
        `/api/v1/tasks/${taskId}/reject-completion`,
        data,
        config
      )
    );
  }

  async requestChanges(
    taskId: string,
    data: { message?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(
        `/api/v1/tasks/${taskId}/request-changes`,
        data,
        config
      )
    );
  }

  // Reverted: additional quote / selfie-work-evidence tracking flow disabled in gateway.
  // async createAdditionalQuoteRequest(...) {}
  // async getAdditionalQuoteRequests(...) {}
  // async getActiveAdditionalQuoteRequest(...) {}
  // async acceptAdditionalQuoteRequest(...) {}
  // async rejectAdditionalQuoteRequest(...) {}
  // async withdrawAdditionalQuoteRequest(...) {}

  async followTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${taskId}/follow`,
        {},
        config
      )
    );
  }

  async unfollowTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.delete<ApiResponse<any>>(
        `/api/v1/tasks/${taskId}/follow`,
        config
      )
    );
  }

  async checkFollowStatus(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/tasks/${taskId}/follow`,
        config
      )
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
      this.client.get<ApiResponse<any>>("/api/v1/tasks/followed", config)
    );
  }

  async reportTask(
    taskId: string,
    reason: string,
    description: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    const body: any = { reason };
    if (description) {
      body.description = description;
    }

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${taskId}/report`,
        body,
        config
      )
    );
  }

  async getTaskReports(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/tasks/${taskId}/reports`,
        config
      )
    );
  }

  async getNearbyTasks(
    params: {
      lat: number;
      lng: number;
      radiusKm?: number;
      status?: string;
      limit?: number;
      page?: number;
      category?: string;
      city?: string;
      search?: string;
      minBudget?: number;
      maxBudget?: number;
      remotely?: string;
      sortBy?: string;
    },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task[]>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params,
      })
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<Task[]>>("/api/v1/tasks/nearby", config)
    );
  }

  // ── Global Budget Revision ─────────────────────────────────────────────────

  async reviseBudget(
    taskId: string,
    body: { newAmount: number; reason?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<Task>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<Task>>(
        `/api/v1/tasks/${taskId}/revise-budget`,
        body,
        config
      )
    );
  }

  async getRecurringVisits(
    taskId: string,
    userToken: UserToken,
    options?: { syncPayments?: boolean; scope?: 'work_details' | 'full' },
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, { timeout: this.recurringReadTimeoutMs }),
    );

    const params = new URLSearchParams();
    if (options?.syncPayments) params.set('sync', 'true');
    if (options?.scope === 'work_details') params.set('scope', 'work_details');
    const query = params.toString() ? `?${params.toString()}` : '';

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits${query}`,
        config
      )
    );
  }

  async confirmRecurringVisitPayment(
    taskId: string,
    visitId: string,
    escrowId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/confirm-payment`,
        { escrowId },
        config
      )
    );
  }

  async skipRecurringVisit(
    taskId: string,
    visitId: string,
    reason: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/skip`,
        reason ? { reason } : {},
        config
      )
    );
  }

  async cancelRecurringVisit(
    taskId: string,
    visitId: string,
    reason: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/cancel`,
        reason ? { reason } : {},
        config
      )
    );
  }

  async endRecurringPlan(
    taskId: string,
    reason: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/plan/end`,
        reason ? { reason } : {},
        config
      )
    );
  }

  async resumeRecurringPlan(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/plan/resume`,
        {},
        config
      )
    );
  }

  async openNextRecurringVisitPayment(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, { timeout: this.recurringReadTimeoutMs }),
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/plan/open-next-payment`,
        {},
        config
      )
    );
  }

  async rescheduleRecurringVisit(
    taskId: string,
    visitId: string,
    body: {
      newDate: string;
      scheduledTimeStart?: string;
      scheduledTimeEnd?: string;
      reason?: string;
    },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/reschedule`,
        body,
        config
      )
    );
  }

  async requestRecurringVisitReschedule(
    taskId: string,
    visitId: string,
    body: {
      newDate: string;
      scheduledTimeStart?: string;
      scheduledTimeEnd?: string;
      reason?: string;
    },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/reschedule/request`,
        body,
        config
      )
    );
  }

  async respondRecurringVisitReschedule(
    taskId: string,
    visitId: string,
    approved: boolean,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/reschedule/respond`,
        { approved },
        config
      )
    );
  }

  async requestRecurringVisitCancel(
    taskId: string,
    visitId: string,
    reason: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/cancel/request`,
        reason ? { reason } : {},
        config
      )
    );
  }

  async respondRecurringVisitCancel(
    taskId: string,
    visitId: string,
    approved: boolean,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/visits/${encodeURIComponent(visitId)}/cancel/respond`,
        { approved },
        config
      )
    );
  }

  async pauseRecurringPlan(
    taskId: string,
    reason: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/plan/pause`,
        reason ? { reason } : {},
        config
      )
    );
  }

  async leaveRecurringPlan(
    taskId: string,
    reason: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/tasks/${encodeURIComponent(taskId)}/recurring/plan/leave`,
        reason ? { reason } : {},
        config
      )
    );
  }

  async respondToRevision(
    applicationId: string,
    body: { action: "keep" | "revise" | "withdraw"; newAmount?: number },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/applications/${applicationId}/respond-to-revision`,
        body,
        config
      )
    );
  }

  // Book Now — catalog (task-service)
  async listCatalogCategories(
    userToken?: UserToken | null
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>("/api/v1/catalog/categories", config)
    );
  }

  async getCatalogCategory(
    slug: string,
    userToken?: UserToken | null
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/catalog/categories/${encodeURIComponent(slug)}`,
        config
      )
    );
  }

  async getCatalogSku(
    skuSlug: string,
    categorySlug: string | undefined,
    userToken?: UserToken | null
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: categorySlug ? { categorySlug } : undefined,
      })
    );
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/catalog/skus/${encodeURIComponent(skuSlug)}`,
        config
      )
    );
  }

  async checkCatalogPinCode(
    pinCode: string,
    city: string | undefined,
    userToken?: UserToken | null
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const uid =
      userToken?.uid != null && String(userToken.uid).trim() !== ''
        ? String(userToken.uid).trim()
        : undefined;

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: {
          pinCode,
          ...(city ? { city } : {}),
          ...(uid ? { firebaseUid: uid } : {}),
        },
      })
    );
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>("/api/v1/catalog/areas/check", config)
    );
  }

  // Book Now — bookings (task-service)
  async createBooking(
    body: Record<string, unknown>,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>("/api/v1/bookings", body, config)
    );
  }

  async getBookNowSlotAvailability(
    params: { date: string; city: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        params: {
          date: params.date,
          city: params.city,
        },
      })
    );
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>("/api/v1/bookings/slot-availability", config)
    );
  }

  async getBookingOrderIdForTask(
    taskId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/bookings/by-task/${encodeURIComponent(taskId)}`,
        config
      )
    );
  }

  async getBookingOrder(
    orderId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/bookings/${encodeURIComponent(orderId)}`,
        config
      )
    );
  }

  async listMyBookings(
    params: { limit?: number; page?: number },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, { params })
    );
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>("/api/v1/bookings/mine", config)
    );
  }

  async cancelBookingOrderItem(
    orderId: string,
    body: { taskId: string; reason?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/bookings/${encodeURIComponent(orderId)}/cancel-item`,
        body,
        config
      )
    );
  }

  async cancelBookingOrder(
    orderId: string,
    body: { reason?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/bookings/${encodeURIComponent(orderId)}/cancel`,
        body,
        config
      )
    );
  }

  async abandonUnpaidBookingOrder(
    orderId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/bookings/${encodeURIComponent(orderId)}/abandon`,
        {},
        config
      )
    );
  }

  async confirmBookingPayment(
    orderId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `/api/v1/bookings/${encodeURIComponent(orderId)}/confirm-payment`,
        {},
        config
      )
    );
  }
}

export const taskService = new TaskService();
