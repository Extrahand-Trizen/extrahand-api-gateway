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

  async cancelPayment(
    data: {
      razorpayOrderId?: string;
      escrowId?: string;
      taskId?: string;
      reason?: string;
      userId?: string;
      cancelledBy?: 'poster' | 'performer';
      taskStartDate?: string;
      assignedAt?: string;
      feeBaseAmount?: number;
      taskTitle?: string;
    },
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    return this.handleRequest(() =>
      this.client.post('/api/v1/payment/cancel', data, config)
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
    taskCategory?: string,
    taskAmount?: number
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
        taskAmount,
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
    userToken: UserToken | null,
    visitId?: string
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined, {
        params: visitId?.trim() ? { visitId: visitId.trim() } : undefined,
      })
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
    userToken: UserToken | null,
    linkedUserIds?: string
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    const params: Record<string, string> = {};
    if (linkedUserIds?.trim()) {
      params.linkedUserIds = linkedUserIds.trim();
    }

    return this.handleRequest(() =>
      this.client.get(`/api/v1/earnings/${userId}`, {
        ...config,
        params,
      })
    );
  }

  async getPendingCancellationPenalties(
    userId: string,
    userToken: UserToken | null,
    linkedUserIds?: string
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    const params: Record<string, string> = {};
    if (linkedUserIds?.trim()) {
      params.linkedUserIds = linkedUserIds.trim();
    }

    return this.handleRequest(() =>
      this.client.get(`/api/v1/earnings/${userId}/pending-cancellation-penalties`, {
        ...config,
        params,
      })
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
      linkedUserIds?: string;
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
    if (options.linkedUserIds) params.linkedUserIds = options.linkedUserIds;

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

  async deleteBankAccount(bankAccountId: string, userToken: UserToken | null): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken || undefined));
    return this.handleRequest(() => this.client.delete(`/api/v1/bank-accounts/${bankAccountId}`, config));
  }

  async setDefaultBankAccount(bankAccountId: string, userToken: UserToken | null): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken || undefined));
    return this.handleRequest(() => this.client.put(`/api/v1/bank-accounts/${bankAccountId}/default`, {}, config));
  }

  async processTaskCompletionPayout(
    data: {
      taskId: string;
      performerUid: string;
      amount: number;
      taskTitle?: string;
      userId?: string;
      useExtraCoins?: boolean;
      requestedCoinRedeemRupees?: number;
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
    userToken: UserToken | null,
    linkedUserIds?: string
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (linkedUserIds?.trim()) params.linkedUserIds = linkedUserIds.trim();

    return this.handleRequest(() =>
      this.client.get(`/api/v1/transactions/${userId}/summary`, {
        ...config,
        params
      })
    );
  }

  async getExtraCoinsWallet(
    userId: string,
    userToken: UserToken | null,
    linkedUserIds?: string,
    walletRole?: 'poster' | 'tasker'
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken || undefined)
    );

    const params: Record<string, string> = {};
    if (linkedUserIds?.trim()) params.linkedUserIds = linkedUserIds.trim();
    if (walletRole) params.walletRole = walletRole;

    return this.handleRequest(() =>
      this.client.get(`/api/v1/transactions/${userId}/wallet`, {
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
   * Razorpay publishable Key ID for client checkout (same payload as web /api/razorpay-key).
   * Public on payment service — no service or user auth.
   */
  async getRazorpayKeyId(): Promise<AxiosResponse<{ keyId: string }>> {
    return this.handleRequest(() =>
      this.client.get('/api/v1/payment/razorpay-key')
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

  async calculateBookNowTotals(
    items: Array<{ categorySlug: string; lineTotal: number }>,
  ): Promise<AxiosResponse> {
    return this.handleRequest(() =>
      this.client.post('/api/v1/fees/book-now/calculate', { items })
    );
  }
}

export const paymentService = new PaymentService();


