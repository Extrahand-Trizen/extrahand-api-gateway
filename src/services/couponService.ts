import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';

/**
 * Proxies admin coupon CRUD to extrahand-coupon-service.
 */
export class CouponService extends BaseService {
  constructor() {
    const serviceURL = process.env.COUPON_SERVICE_URL || 'http://localhost:4015';
    super({
      serviceName: 'CouponService',
      baseURL: serviceURL,
      timeout: 15000,
    });
  }

  private authConfig(userToken?: UserToken | null) {
    return this.addServiceAuth(this.forwardUserAuth(userToken || undefined));
  }

  async createCoupon(body: Record<string, unknown>, userToken: UserToken | null): Promise<AxiosResponse> {
    return this.handleRequest(() =>
      this.client.post('/api/v1/coupons/admin/coupons', body, this.authConfig(userToken))
    );
  }

  async listCoupons(query: Record<string, string>, userToken: UserToken | null): Promise<AxiosResponse> {
    const params = new URLSearchParams(query);
    return this.handleRequest(() =>
      this.client.get(`/api/v1/coupons/admin/coupons?${params.toString()}`, this.authConfig(userToken))
    );
  }

  async getCoupon(id: string, userToken: UserToken | null): Promise<AxiosResponse> {
    return this.handleRequest(() =>
      this.client.get(`/api/v1/coupons/admin/coupons/${encodeURIComponent(id)}`, this.authConfig(userToken))
    );
  }

  async updateCoupon(
    id: string,
    body: Record<string, unknown>,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    return this.handleRequest(() =>
      this.client.patch(
        `/api/v1/coupons/admin/coupons/${encodeURIComponent(id)}`,
        body,
        this.authConfig(userToken)
      )
    );
  }

  async setCouponStatus(
    id: string,
    isActive: boolean,
    userToken: UserToken | null
  ): Promise<AxiosResponse> {
    return this.handleRequest(() =>
      this.client.patch(
        `/api/v1/coupons/admin/coupons/${encodeURIComponent(id)}/status`,
        { isActive },
        this.authConfig(userToken)
      )
    );
  }

  async deleteCoupon(id: string, userToken: UserToken | null): Promise<AxiosResponse> {
    return this.handleRequest(() =>
      this.client.delete(
        `/api/v1/coupons/admin/coupons/${encodeURIComponent(id)}`,
        this.authConfig(userToken)
      )
    );
  }
}

export const couponService = new CouponService();
