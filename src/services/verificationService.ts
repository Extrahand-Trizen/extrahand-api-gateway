import { BaseService } from './baseService.js';
import { AxiosResponse } from 'axios';
import { UserToken } from '../types/service.js';
import { ApiResponse } from '../types/api.js';

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
  constructor() {
    const serviceURL = process.env.VERIFICATION_SERVICE_URL || 'http://localhost:4004';
    super({
      serviceName: 'VerificationService',
      baseURL: serviceURL,
      timeout: 30000, // Longer timeout for verification
    });
  }

  async initiateAadhaarVerification(
    aadhaarNumber: string,
    consent: any, // Consent from frontend
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<AadhaarVerificationResponse>>> {
    // Use consent from frontend if provided, otherwise create default
    const consentData = consent || {
      given: true,
      givenAt: new Date().toISOString(),
      consentVersion: 'v1.0',
      consentText: 'I consent to verify my Aadhaar for identity verification on ExtraHand platform.',
    };

    // Verification service expects both consentGiven (boolean) and consent (object)
    const requestData: any = {
      aadhaarNumber,
      consentGiven: consentData.given || true, // Required top-level boolean field
      consent: {
        given: consentData.given || true,
        text: consentData.consentText || consentData.text || 'I consent to verify my Aadhaar for identity verification on ExtraHand platform.',
        version: consentData.consentVersion || consentData.version || 'v1.0'
      },
    };

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<AadhaarVerificationResponse>>(
        '/api/v1/verification/aadhaar/initiate',
        requestData,
        config
      )
    );
  }

  async verifyAadhaarOTP(
    refId: string,
    otp: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<VerificationStatus>>> {
    const requestData: OTPVerificationRequest = {
      refId,
      otp,
    };

    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<VerificationStatus>>(
        '/api/v1/verification/aadhaar/verify',
        requestData,
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
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/email/initiate',
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
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/email/verify',
        { otp, verificationId },
        config
      )
    );
  }

  async resendEmailOTP(
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.post<ApiResponse<any>>(
        '/api/v1/verification/email/resend',
        {},
        config
      )
    );
  }

  async getEmailVerificationStatus(
    userId: string,
    userToken: UserToken
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    const config = this.addServiceAuth(
      this.forwardUserAuth(userToken)
    );

    return this.handleRequest(() =>
      this.client.get<ApiResponse<any>>(
        `/api/v1/verification/email/status/${userId}`,
        config
      )
    );
  }
}

export const verificationService = new VerificationService();

