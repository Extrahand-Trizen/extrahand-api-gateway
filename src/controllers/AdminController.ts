import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/adminService.js";
import { userService } from "../services/userService.js";
// import multer from "multer";

// const upload = multer({ storage: multer.memoryStorage() });

export class AdminController {
  static async bulkUploadUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File required" });
        return;
      }

      const adminToken = (req as any).adminToken;
      const response = await adminService.bulkUploadUsers(
        req.file.buffer,
        req.file.originalname,
        adminToken,
        req.body.primaryCategory,
        req.body.secondaryCategory
      );

      res.json(response.data);
    } catch (error: any) {
      next(error);
    }
  }

  static async getBulkUploadTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminToken = (req as any).adminToken;
      const response = await adminService.getBulkUploadTemplate(adminToken);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=tasker-upload-template.csv"
      );
      res.send(response.data);
    } catch (error: any) {
      next(error);
    }
  }

  static async getImportHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminToken = (req as any).adminToken;
      const response = await adminService.getImportHistory(
        req.query,
        adminToken
      );
      res.json(response.data);
    } catch (error: any) {
      next(error);
    }
  }

  static async getImportDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminToken = (req as any).adminToken;
      const { importId } = req.params;
      const response = await adminService.getImportDetails(
        importId,
        adminToken
      );
      res.json(response.data);
    } catch (error: any) {
      next(error);
    }
  }

  static async sendPromotionalWhatsAppCampaign(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminToken = (req as any).adminToken;
      const response = await userService.sendPromotionalWhatsAppCampaign(
        req.body || {},
        adminToken
      );
      res.json(response.data);
    } catch (error: any) {
      next(error);
    }
  }
}
