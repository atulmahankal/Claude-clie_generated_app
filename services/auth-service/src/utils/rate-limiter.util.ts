import { DatabaseAdapter } from '@jam/database-engine';
import { RateLimitModel, CheckRateLimitResult } from '../models/rate-limit.model';

/**
 * Rate Limiter Utility
 *
 * Provides convenient rate limiting for sensitive operations.
 * Uses database-backed storage for multi-instance support.
 *
 * Typical Usage:
 * ```typescript
 * const limiter = new RateLimiter(db);
 * const result = await limiter.checkAndRecordPasswordReset(email);
 * if (!result.allowed) {
 *   throw new Error(`Rate limit exceeded. Retry after ${result.retryAfterSeconds}s`);
 * }
 * ```
 */
export class RateLimiter {
  private model: RateLimitModel;

  constructor(db: DatabaseAdapter) {
    this.model = new RateLimitModel(db);
  }

  /**
   * Check rate limit for password reset requests
   *
   * Default: 3 attempts per 15 minutes per email
   *
   * @param email - User's email address
   * @param maxAttempts - Maximum attempts (default: 3)
   * @param windowMinutes - Time window in minutes (default: 15)
   * @returns CheckRateLimitResult
   */
  async checkPasswordReset(
    email: string,
    maxAttempts: number = 3,
    windowMinutes: number = 15
  ): Promise<CheckRateLimitResult> {
    return this.model.checkRateLimit(
      email.toLowerCase(),
      'password_reset',
      maxAttempts,
      windowMinutes
    );
  }

  /**
   * Record a password reset attempt
   *
   * @param email - User's email address
   * @param windowMinutes - Time window in minutes (default: 15)
   */
  async recordPasswordResetAttempt(
    email: string,
    windowMinutes: number = 15
  ): Promise<void> {
    await this.model.recordAttempt(
      email.toLowerCase(),
      'password_reset',
      windowMinutes
    );
  }

  /**
   * Check and record password reset in one call
   *
   * This is a convenience method that checks the limit and,
   * if allowed, records the attempt automatically.
   *
   * @param email - User's email address
   * @param maxAttempts - Maximum attempts (default: 3)
   * @param windowMinutes - Time window in minutes (default: 15)
   * @returns CheckRateLimitResult
   */
  async checkAndRecordPasswordReset(
    email: string,
    maxAttempts: number = 3,
    windowMinutes: number = 15
  ): Promise<CheckRateLimitResult> {
    const result = await this.checkPasswordReset(email, maxAttempts, windowMinutes);

    if (result.allowed) {
      await this.recordPasswordResetAttempt(email, windowMinutes);
    }

    return result;
  }

  /**
   * Check rate limit for email verification requests
   *
   * Default: 5 attempts per 15 minutes per email
   *
   * @param email - Email address to verify
   * @param maxAttempts - Maximum attempts (default: 5)
   * @param windowMinutes - Time window in minutes (default: 15)
   * @returns CheckRateLimitResult
   */
  async checkEmailVerification(
    email: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<CheckRateLimitResult> {
    return this.model.checkRateLimit(
      email.toLowerCase(),
      'email_verification',
      maxAttempts,
      windowMinutes
    );
  }

  /**
   * Record an email verification attempt
   *
   * @param email - Email address to verify
   * @param windowMinutes - Time window in minutes (default: 15)
   */
  async recordEmailVerificationAttempt(
    email: string,
    windowMinutes: number = 15
  ): Promise<void> {
    await this.model.recordAttempt(
      email.toLowerCase(),
      'email_verification',
      windowMinutes
    );
  }

  /**
   * Check and record email verification in one call
   *
   * @param email - Email address to verify
   * @param maxAttempts - Maximum attempts (default: 5)
   * @param windowMinutes - Time window in minutes (default: 15)
   * @returns CheckRateLimitResult
   */
  async checkAndRecordEmailVerification(
    email: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<CheckRateLimitResult> {
    const result = await this.checkEmailVerification(email, maxAttempts, windowMinutes);

    if (result.allowed) {
      await this.recordEmailVerificationAttempt(email, windowMinutes);
    }

    return result;
  }

  /**
   * Generic rate limit check for custom actions
   *
   * @param identifier - Email, IP, or other identifier
   * @param action - Action type (e.g., 'login_attempt', 'api_call')
   * @param maxAttempts - Maximum attempts
   * @param windowMinutes - Time window in minutes
   * @returns CheckRateLimitResult
   */
  async check(
    identifier: string,
    action: string,
    maxAttempts: number,
    windowMinutes: number
  ): Promise<CheckRateLimitResult> {
    return this.model.checkRateLimit(identifier, action, maxAttempts, windowMinutes);
  }

  /**
   * Generic rate limit recording for custom actions
   *
   * @param identifier - Email, IP, or other identifier
   * @param action - Action type
   * @param windowMinutes - Time window in minutes
   */
  async record(
    identifier: string,
    action: string,
    windowMinutes: number
  ): Promise<void> {
    await this.model.recordAttempt(identifier, action, windowMinutes);
  }

  /**
   * Reset rate limit for a specific identifier and action
   *
   * Useful for admin actions or after successful verification
   *
   * @param identifier - Email, IP, or other identifier
   * @param action - Action type
   */
  async reset(identifier: string, action: string): Promise<void> {
    await this.model.resetRateLimit(identifier, action);
  }

  /**
   * Reset all password reset rate limits for an email
   *
   * @param email - User's email address
   */
  async resetPasswordReset(email: string): Promise<void> {
    await this.model.resetRateLimit(email.toLowerCase(), 'password_reset');
  }

  /**
   * Reset all email verification rate limits for an email
   *
   * @param email - Email address
   */
  async resetEmailVerification(email: string): Promise<void> {
    await this.model.resetRateLimit(email.toLowerCase(), 'email_verification');
  }

  /**
   * Clean up expired rate limit records
   *
   * Should be called periodically (e.g., via cron job)
   *
   * @returns Number of records deleted
   */
  async cleanupExpired(): Promise<number> {
    return this.model.cleanupExpired();
  }

  /**
   * Get all rate limits for an identifier (for debugging/admin)
   *
   * @param identifier - Email, IP, or other identifier
   * @returns Array of rate limit records
   */
  async getAllForIdentifier(identifier: string) {
    return this.model.getAllForIdentifier(identifier);
  }

  /**
   * Delete all rate limits for an identifier (for admin/testing)
   *
   * @param identifier - Email, IP, or other identifier
   */
  async deleteAllForIdentifier(identifier: string): Promise<void> {
    await this.model.deleteAllForIdentifier(identifier);
  }
}

export default RateLimiter;
