import { BaseService } from "./baseService.js";
import { ServiceConfig, UserToken } from "../types/service.js";
import { AxiosResponse } from "axios";
import FormData from "form-data";

export class AdminService extends BaseService {
  constructor() {
    const config: ServiceConfig = {
      serviceName: "admin-service",
      baseURL: process.env.ADMIN_SERVICE_URL || "http://localhost:4006",
      timeout: 300000, // 5 minutes for bulk uploads
    };
    super(config);
  }

  async bulkUploadUsers(
    fileBuffer: Buffer,
    fileName: string,
    adminToken: UserToken,
    primaryCategory?: string,
    secondaryCategory?: string
  ): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: fileName,
      contentType: "application/octet-stream",
    });

    if (primaryCategory) {
      formData.append("primaryCategory", primaryCategory);
    }
    if (secondaryCategory) {
      formData.append("secondaryCategory", secondaryCategory);
    }

    const config = this.addServiceAuth(this.forwardUserAuth(adminToken));

    return this.handleRequest(() =>
      this.client.post("/api/v1/internal/bulk-upload/upload", formData, {
        ...config,
        headers: {
          ...config.headers,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    );
  }

  async getBulkUploadTemplate(adminToken: UserToken): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(adminToken));

    return this.handleRequest(() =>
      this.client.get("/api/v1/internal/bulk-upload/template", {
        ...config,
        responseType: "arraybuffer",
      })
    );
  }

  async getImportHistory(
    filters: any,
    adminToken: UserToken
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(adminToken));

    return this.handleRequest(() =>
      this.client.get("/api/v1/internal/bulk-upload/history", {
        ...config,
        params: filters,
      })
    );
  }

  async getImportDetails(
    importId: string,
    adminToken: UserToken
  ): Promise<AxiosResponse> {
    const config = this.addServiceAuth(this.forwardUserAuth(adminToken));

    return this.handleRequest(() =>
      this.client.get(`/api/v1/internal/bulk-upload/${importId}`, config)
    );
  }
}

export const adminService = new AdminService();
