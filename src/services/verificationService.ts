import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { UserToken } from '../types/service.js';
import { ApiResponse } from '../types/api.js';

function parseTimeoutMs(value: string | undefined, fallback: number): number {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface AadhaarVerificationRequest {
  aadhaarNumber: string;
  consent: {
    given: boolean;
    givenAt: string;
    consentVersion: string;
    consentText: string;
  };
}

export interface AadhaarVerificationResponse {
  refId: string;
  message: string;
}

export interface OTPVerificationRequest {
  refId: string;
  otp: string;
}

export interface VerificationStatus {
  isAadhaarVerified: boolean;
  verifiedAt?: string;
  maskedAadhaar?: string;
}

export class VerificationService extends BaseService {
  private readonly ocrUploadTimeoutMs: number;

  constructor() {
    const serviceURL = process.env.VERIFICATION_SERVICE_URL || 'http://localhost:4004';
    const defaultTimeoutMs = parseTimeoutMs(
      process.env.VERIFICATION_SERVICE_TIMEOUT_MS,
      30_000,
    );
    const ocrUploadTimeoutMs = parseTimeoutMs(
      process.env.VERIFICATION_SERVICE_OCR_UPLOAD_TIMEOUT_MS,
      120_000,
    );
    super({
      serviceName: 'VerificationService',
      baseURL: serviceURL,
      timeout: defaultTimeoutMs,
    });
    this.ocrUploadTimeoutMs = ocrUploadTimeoutMs;
  }

  async initiateDigilockerVerification(
    params: { mobileNumber?: string; aadhaarNumber?: string; consentGiven?: boolean; redirectUrl?: string },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const requestData: Record<string, unknown> = {
      mobileNumber: params.mobileNumber,
      aadhaarNumber: params.aadhaarNumber,
      consentGiven: params.consentGiven ?? true,
    };
    if (params.redirectUrl != null && typeof params.redirectUrl === 'string' && params.redirectUrl.trim()) {
      requestData.redirectUrl = params.redirectUrl.trim();
    }

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/aadhaar/digilocker/initiate',
        requestData,
        config
      )
    );
  }

  async getDigilockerStatus(
    verificationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/verification/aadhaar/digilocker/status?verification_id=${encodeURIComponent(verificationId)}`,
        config
      )
    );
  }

  // ============ Aadhaar Smart OCR (proxy only) ============

  async initiateAadhaarOcr(
    params: { consentGiven?: boolean },
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/aadhaar/ocr/initiate',
        { consentGiven: params.consentGiven ?? true },
        config
      )
    );
  }

  async uploadAadhaarOcrSide(
    side: 'front' | 'back',
    formData: FormData,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken, {
        headers: { ...formData.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );
    const path =
      side === 'back'
        ? '/api/v1/verification/aadhaar/ocr/back'
        : '/api/v1/verification/aadhaar/ocr/front';
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(path, formData, {
        ...config,
        timeout: this.ocrUploadTimeoutMs,
      })
    );
  }

  async getAadhaarOcrStatus(
    verificationId: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    const qs = verificationId
      ? `?verification_id=${encodeURIComponent(verificationId)}`
      : '';
    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/verification/aadhaar/ocr/status${qs}`,
        config
      )
    );
  }

  async cancelAadhaarOcr(
    verificationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/aadhaar/ocr/cancel',
        { verification_id: verificationId },
        config
      )
    );
  }

  async reportAadhaarOcrUploadFailure(
    verificationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(this.forwardUserAuth(userToken));
    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/aadhaar/ocr/report-upload-failure',
        { verification_id: verificationId },
        config
      )
    );
  }

  async completeDigilockerVerification(
    verificationId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/aadhaar/digilocker/complete',
        { verification_id: verificationId },
        config
      )
    );
  }

  async verifyPAN(
    panNumber: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const consent = {
      given: true,
      givenAt: new Date().toISOString(),
      consentVersion: 'v1.0',
      consentText: 'I consent to verify my PAN for identity verification on ExtraHand platform.',
    };

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/pan/verify',
        { panNumber, consent },
        config
      )
    );
  }

  async verifyBankAccount(
    accountNumber: string,
    ifsc: string,
    accountHolderName: string,
    userToken: UserToken,
    consent?: any // ✨ Forward consent from frontend
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    // ✨ Include consent in request body if provided
    const requestBody: any = { accountNumber, ifsc, accountHolderName };
    if (consent) {
      requestBody.consent = consent;
    }

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/bank/verify',
        requestBody,
        config
      )
    );
  }

  async getVerificationStatus(
    userId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<VerificationStatus>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<VerificationStatus>>(
        `/api/v1/verification/status/${userId}`,
        config
      )
    );
  }

  // ============ Email Verification ============

  async initiateEmailVerification(
    email: string,
    consentGiven: boolean,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    // Email verification is handled by user-service, not verification-service
    const userServiceURL = process.env.USER_SERVICE_URL || 'http://localhost:4001';

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `${userServiceURL}/api/v1/verification/email/initiate`,
        { email, consentGiven },
        config
      )
    );
  }

  async verifyEmailOTP(
    otp: string,
    verificationId: string | undefined,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    // Email verification is handled by user-service, not verification-service
    const userServiceURL = process.env.USER_SERVICE_URL || 'http://localhost:4001';

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `${userServiceURL}/api/v1/verification/email/verify`,
        { otp, verificationId },
        config
      )
    );
  }

  async resendEmailOTP(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    // Email verification is handled by user-service, not verification-service
    const userServiceURL = process.env.USER_SERVICE_URL || 'http://localhost:4001';

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        `${userServiceURL}/api/v1/verification/email/resend`,
        {},
        config
      )
    );
  }

  async getEmailVerificationStatus(
    userId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    // Email verification is handled by user-service, not verification-service
    const userServiceURL = process.env.USER_SERVICE_URL || 'http://localhost:4001';

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `${userServiceURL}/api/v1/verification/email/status?userId=${encodeURIComponent(userId)}`,
        config
      )
    );
  }
}

export const verificationService = new VerificationService();

