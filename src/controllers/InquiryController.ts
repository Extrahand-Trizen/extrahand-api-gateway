import { NextFunction, Request, Response } from 'express';
import mongoose, { InferSchemaType, Schema } from 'mongoose';
import { z } from 'zod';
import logger from '../config/logger.js';
import { connectMongo } from '../config/database.js';

const createInquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  subject: z.string().trim().min(2).max(160),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  message: z.string().trim().min(5).max(5000),
  source: z.string().trim().max(40).optional(),
});

const inquirySchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    message: { type: String, required: true, trim: true },
    source: { type: String, trim: true, default: 'android' },
    userUid: { type: String, trim: true },
    profileId: { type: String, trim: true },
  },
  {
    collection: 'inquiries',
    timestamps: true,
    versionKey: false,
  },
);

type InquiryDocument = InferSchemaType<typeof inquirySchema>;

const Inquiry =
  (mongoose.models.Inquiry as mongoose.Model<InquiryDocument>) ||
  mongoose.model<InquiryDocument>('Inquiry', inquirySchema);

export class InquiryController {
  async createInquiry(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const parsed = createInquirySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
        return;
      }

      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        logger.error('❌ [Inquiries] MONGODB_URI not configured');
        res.status(500).json({
          success: false,
          error: 'Inquiry service unavailable',
        });
        return;
      }

      await connectMongo(mongoUri);

      const payload = {
        ...parsed.data,
        source: parsed.data.source || 'android',
        userUid: req.user?.uid,
        profileId: req.user?.profileId,
      };

      const created = await Inquiry.create(payload);
      logger.info('✅ [Inquiries] Inquiry saved', {
        id: String(created._id),
        userUid: created.userUid || null,
        source: created.source,
      });

      res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully',
        data: {
          id: String(created._id),
          createdAt: created.createdAt,
        },
      });
    } catch (error: any) {
      logger.error('❌ [Inquiries] Failed to save inquiry', {
        message: error?.message || 'Unknown error',
        name: error?.name,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to submit inquiry',
      });
    }
  }
}

export const inquiryController = new InquiryController();

