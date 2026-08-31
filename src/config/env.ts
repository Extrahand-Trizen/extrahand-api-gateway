import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
   NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
   PORT: z.string().default("4000"),
   // No MONGODB_URI in gateway - profileId resolved via user-service only
   USER_SERVICE_URL: z.string().url(),
   TASK_SERVICE_URL: z.string().url(),
   CHAT_SERVICE_URL: z.string().url(),
   VERIFICATION_SERVICE_URL: z.string().url(),
  PAYMENT_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  COUPON_SERVICE_URL: z.string().url().optional().default('http://localhost:4015'),
  QUICK_COMMERCE_SERVICE_URL: z.string().url().optional().default('http://localhost:4010'),
   OLD_BACKEND_URL: z.string().url().optional(), // Optional - only needed for task-image uploads
   SERVICE_AUTH_TOKEN: z.string().min(1),
   ACCESS_TOKEN_SECRET: z
      .string()
      .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),
   TOKEN_ISSUER: z.string().default("extrahand-user-service"),
   TOKEN_AUDIENCE: z.string().default("extrahand-clients"),
   CORS_ORIGIN: z.string(),
   RATE_LIMIT_WINDOW_MS: z.string().default("900000"),
   RATE_LIMIT_MAX_REQUESTS: z.string().default("100"),
   /** Default axios timeout for verification service (ms) */
   VERIFICATION_SERVICE_TIMEOUT_MS: z.string().default("30000"),
   /** OCR multipart front/back proxy timeout (ms) */
   VERIFICATION_SERVICE_OCR_UPLOAD_TIMEOUT_MS: z.string().default("120000"),
   FIREBASE_PROJECT_ID: z.string(),
   FIREBASE_PRIVATE_KEY: z.string(),
   FIREBASE_CLIENT_EMAIL: z.string().email(),
   FIREBASE_MOBILE_PROJECT_ID: z.string().optional(),
   FIREBASE_MOBILE_CLIENT_EMAIL: z.string().email().optional(),
   FIREBASE_MOBILE_PRIVATE_KEY: z.string().optional(),
   FIREBASE_MOBILE_SERVICE_ACCOUNT_PATH: z.string().optional(),
});

export function validateEnv() {
   try {
      return envSchema.parse(process.env);
   } catch (error) {
      if (error instanceof z.ZodError) {
         console.error("❌ Environment validation failed:");
         error.errors.forEach((err) => {
            console.error(`  - ${err.path.join(".")}: ${err.message}`);
         });
         process.exit(1);
      }
      throw error;
   }
}

export function getCorsConfig(env: ReturnType<typeof validateEnv>) {
   const origins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

   // 🔍 Debug: Log allowed origins on startup
   console.log("🌍 [CORS] Allowed origins configured:", origins);
   console.log("🌍 [CORS] Total allowed origins:", origins.length);

   return {
      origin: (
         origin: string | undefined,
         callback: (err: Error | null, allow?: boolean) => void
      ) => {
         // 🔍 Debug: Log every CORS check
         console.log("🔍 [CORS CHECK] Incoming origin:", origin || "undefined");
         
         // Allow requests with no origin (mobile apps, server-to-server, Postman)
         if (!origin) {
            callback(null, true);
            return;
         }
         
         // Check if origin is in allowed list
         if (origins.includes(origin)) {
            console.log("✅ [CORS] Origin allowed:", origin || "no-origin");
            console.log('✅ CORS: Allowed origin:', origin);
            callback(null, true);
         } else {
            console.log("❌ [CORS] Origin BLOCKED:", origin);
            console.log("❌ [CORS] Allowed origins are:", origins);
            callback(new Error("Not allowed by CORS"));
         }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
         "Content-Type",
         "Authorization",
         "X-User-Id",
         "X-Service-Auth",
         "X-Service-Name",
         "X-Refresh-Token",
      ],
      exposedHeaders: ["X-Request-Id", "X-Gateway", "X-Gateway-Version"],
   };
}
