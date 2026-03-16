import rateLimit from "express-rate-limit";

/**
 * Generic limiter (default)
 */
export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later."
  }
});

/**
 * QR specific limiter (stricter)
 */
export const qrLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // max 20 QR scans per IP
  message: {
    message: "QR scan limit exceeded. Please wait."
  }
});

/**
 * Order creation limiter (VERY IMPORTANT)
 */
export const orderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // only 5 orders per IP/session
  message: {
    message: "Too many order attempts. Please wait."
  }
});
