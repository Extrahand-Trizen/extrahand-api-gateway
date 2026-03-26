import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';

export class PaymentService extends BaseService {
  constructor() {
    const serviceURL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4003';
    super({
      serviceName: 'PaymentService',
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  async createOrder(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.post('/api/v1/payment/create-order', {
        amount,
        currency,
        metadata
      }, config)
    );
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.post('/api/v1/payment/verify-payment', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      }, config)
    );
  }

  async getOrderStatus(
    orderId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/payment/order-status/${orderId}`, config)
    );
  }

  async processRefund(
    paymentId: string,
    amount: number | undefined,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.post('/api/v1/payment/refund', {
        paymentId,
        amount
      }, config)
    );
  }

  // =====================================================
  // ESCROW METHODS
  // =====================================================

  async createEscrow(
    taskId: string,
    applicationId: string | undefined,
    posterUid: string,
    performerUid: string,
    amount: number,
    currency: string,
    autoReleaseAfterDays: number | undefined,
    metadata: Record<string, any> | undefined,
    userToken: UserToken | null,
    taskCategory?: string
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.post('/api/v1/escrow/create', {
        taskId,
        applicationId,
        posterUid,
        performerUid,
        amount,
        currency,
        autoReleaseAfterDays,
        metadata,
        taskCategory: taskCategory ?? undefined,
      }, config)
    );
  }

  async getEscrowStatus(
    escrowId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/escrow/status/${escrowId}`, config)
    );
  }

  async getEscrowByTaskId(
    taskId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/escrow/task/${taskId}`, config)
    );
  }

  async releaseEscrow(
    escrowId: string,
    releasedBy: string,
    metadata: Record<string, any> | undefined,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.post(`/api/v1/escrow/release/${escrowId}`, {
        releasedBy,
        metadata
      }, config)
    );
  }

  // =====================================================
  // REFUND METHODS
  // =====================================================

  async processRefundWithCancellation(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    reason: string | undefined,
    cancelledBy: 'poster' | 'performer',
    taskStartDate: string,
    cancelledAt: string,
    userId: string | undefined,
    amount: number | undefined,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.post('/api/v1/refunds/process', {
        razorpayOrderId,
        razorpayPaymentId,
        reason,
        cancelledBy,
        taskStartDate,
        cancelledAt,
        userId,
        amount,
      }, config)
    );
  }

  async getRefundStatus(
    refundId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/refunds/status/${refundId}`, config)
    );
  }

  async getRefundsByEscrowId(
    escrowId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/refunds/escrow/${escrowId}`, config)
    );
  }

  // =====================================================
  // PAYOUT METHODS
  // =====================================================

  async getPayoutStatus(
    payoutId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/payouts/status/${payoutId}`, config)
    );
  }

  async getPayoutsByEscrowId(
    escrowId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/payouts/escrow/${escrowId}`, config)
    );
  }

  // =====================================================
  // EARNINGS METHODS
  // =====================================================

  async getUserEarnings(
    userId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/earnings/${userId}`, config)
    );
  }

  async getEarningsByPeriod(
    userId: string,
    startDate: string | undefined,
    endDate: string | undefined,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.handleRequest(() =>
      this.client.get(`/api/v1/earnings/${userId}/period`, {
        ...config,
        params
      })
    );
  }

  async getEarningsStats(
    userId: string,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.get(`/api/v1/earnings/${userId}/stats`, config)
    );
  }

  // =====================================================
  // TRANSACTION HISTORY METHODS
  // =====================================================

  async getUserTransactions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      type?: string;
      status?: string;
      category?: 'earnings' | 'payments' | 'all';
    },
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    const params: Record<string, string | number> = {};
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.offset !== undefined) params.offset = options.offset;
    if (options.startDate) params.startDate = options.startDate;
    if (options.endDate) params.endDate = options.endDate;
    if (options.type) params.type = options.type;
    if (options.status) params.status = options.status;
    if (options.category) params.category = options.category;

    return this.handleRequest(() =>
      this.client.get(`/api/v1/transactions/${userId}`, {
        ...config,
        params
      })
    );
  }

  async upsertBankAccount(
    data: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName?: string;
      email?: string;
      phone?: string;
      setAsDefault?: boolean;
    },
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken || undefined));
    return this.handleRequest(() =>
      this.client.post('/api/v1/bank-accounts', data, config)
    );
  }

  async getMyBankAccounts(userToken: UserToken | null): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken || undefined));
    return this.handleRequest(() => this.client.get('/api/v1/bank-accounts/me', config));
  }

  async processTaskCompletionPayout(
    data: {
      taskId: string;
      performerUid: string;
      amount: number;
      taskTitle?: string;
      userId?: string;
    },
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken || undefined));
    return this.handleRequest(() =>
      this.client.post('/api/v1/payouts/task-completion', data, config)
    );
  }

  async getTransactionSummary(
    userId: string,
    startDate: string | undefined,
    endDate: string | undefined,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.handleRequest(() =>
      this.client.get(`/api/v1/transactions/${userId}/summary`, {
        ...config,
        params
      })
    );
  }

  /**
   * Get fee structure (percentages only) - public endpoint
   * No authentication required
   */
  async getFeeStructure(): Promise<AxiosResponse> {
    // Public endpoint - no auth required
    return this.handleRequest(() =>
      this.client.get('/api/v1/fees/structure')
    );
  }

  /**
   * Calculate fees for an amount - public endpoint.
   * Pass taskCategory for category-specific GST/fees (CategoryFeeConfig).
   */
  async calculateFees(amount: number, taskCategory?: string): Promise<AxiosResponse> {
    const params = new URLSearchParams({ amount: String(amount) });
    if (taskCategory?.trim()) params.set('taskCategory', taskCategory.trim());
    return this.handleRequest(() =>
      this.client.get(`/api/v1/fees/calculate?${params.toString()}`)
    );
  }
}

export const paymentService = new PaymentService();


