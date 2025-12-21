import { DatabaseAdapter } from '@jam/database-engine';
import { Logger } from '@jam/base-app';

/**
 * Rate Limit Model
 *
 * Handles rate limiting for sensitive operations like password reset
 * and email verification to prevent abuse.
 */

export interface RateLimit {
  id: string;
  identifier: string; // email or IP address
  action: string; // 'password_reset', 'email_verification'
  attempt_count: number;
  window_start: string;
  expires_at: string;
  created_at: string;
}

export interface CheckRateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

export class RateLimitModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'rate_limits';
  private logger = Logger.getInstance();

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Check if an action is rate limited
   *
   * @param identifier - Email or IP address
   * @param action - Type of action (e.g., 'password_reset')
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMinutes - Time window in minutes
   * @returns CheckRateLimitResult
   */
  async checkRateLimit(
    identifier: string,
    action: string,
    maxAttempts: number = 3,
    windowMinutes: number = 15
  ): Promise<CheckRateLimitResult> {
    try {
      // Find existing rate limit record
      const existing = await this.findByIdentifierAndAction(identifier, action);

      // No existing record - allow
      if (!existing) {
        return {
          allowed: true,
          remainingAttempts: maxAttempts - 1,
        };
      }

      // Check if window has expired
      const now = new Date();
      const expiresAt = new Date(existing.expires_at);

      if (now > expiresAt) {
        // Window expired - reset and allow
        await this.resetRateLimit(identifier, action);
        return {
          allowed: true,
          remainingAttempts: maxAttempts - 1,
        };
      }

      // Check if max attempts reached
      if (existing.attempt_count >= maxAttempts) {
        const retryAfterSeconds = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / 1000
        );
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfterSeconds,
        };
      }

      // Still within limits
      return {
        allowed: true,
        remainingAttempts: maxAttempts - existing.attempt_count - 1,
      };
    } catch (error: any) {
      this.logger.error('Error checking rate limit', {
        identifier,
        action,
        error: error.message,
      });
      // On error, allow the action (fail open for better UX)
      return {
        allowed: true,
        remainingAttempts: maxAttempts,
      };
    }
  }

  /**
   * Record an attempt for rate limiting
   *
   * @param identifier - Email or IP address
   * @param action - Type of action
   * @param windowMinutes - Time window in minutes
   */
  async recordAttempt(
    identifier: string,
    action: string,
    windowMinutes: number = 15
  ): Promise<void> {
    try {
      const existing = await this.findByIdentifierAndAction(identifier, action);

      if (existing) {
        // Check if window expired
        const now = new Date();
        const expiresAt = new Date(existing.expires_at);

        if (now > expiresAt) {
          // Window expired - reset with new attempt
          await this.resetRateLimit(identifier, action);
          await this.createNewLimit(identifier, action, windowMinutes);
        } else {
          // Increment attempt count
          await this.db
            .table(this.tableName)
            .where('id', '=', existing.id)
            .update({
              attempt_count: existing.attempt_count + 1,
            });
        }
      } else {
        // Create new rate limit record
        await this.createNewLimit(identifier, action, windowMinutes);
      }

      this.logger.info('Rate limit attempt recorded', { identifier, action });
    } catch (error: any) {
      this.logger.error('Error recording rate limit attempt', {
        identifier,
        action,
        error: error.message,
      });
      // Don't throw - rate limiting should not break core functionality
    }
  }

  /**
   * Reset rate limit for an identifier and action
   *
   * @param identifier - Email or IP address
   * @param action - Type of action
   */
  async resetRateLimit(identifier: string, action: string): Promise<void> {
    try {
      await this.db
        .table(this.tableName)
        .where('identifier', '=', identifier)
        .where('action', '=', action)
        .delete();

      this.logger.info('Rate limit reset', { identifier, action });
    } catch (error: any) {
      this.logger.error('Error resetting rate limit', {
        identifier,
        action,
        error: error.message,
      });
    }
  }

  /**
   * Find rate limit by identifier and action
   *
   * @param identifier - Email or IP address
   * @param action - Type of action
   * @returns RateLimit or null
   */
  private async findByIdentifierAndAction(
    identifier: string,
    action: string
  ): Promise<RateLimit | null> {
    const result = await this.db
      .table(this.tableName)
      .where('identifier', '=', identifier)
      .where('action', '=', action)
      .first();

    return result || null;
  }

  /**
   * Create a new rate limit record
   *
   * @param identifier - Email or IP address
   * @param action - Type of action
   * @param windowMinutes - Time window in minutes
   */
  private async createNewLimit(
    identifier: string,
    action: string,
    windowMinutes: number
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMinutes * 60 * 1000);

    await this.db.table(this.tableName).insert({
      identifier,
      action,
      attempt_count: 1,
      window_start: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    });
  }

  /**
   * Clean up expired rate limit records
   *
   * @returns Number of records deleted
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await this.db.query(`SELECT cleanup_expired_rate_limits()`);

      // Extract the count from the result
      const count = result && result.rows && result.rows[0] ? result.rows[0].cleanup_expired_rate_limits : 0;

      this.logger.info('Expired rate limits cleaned up', { count });
      return count;
    } catch (error: any) {
      this.logger.error('Error cleaning up expired rate limits', {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get all rate limits for an identifier (for debugging/admin)
   *
   * @param identifier - Email or IP address
   * @returns Array of RateLimit records
   */
  async getAllForIdentifier(identifier: string): Promise<RateLimit[]> {
    try {
      const results = await this.db
        .table(this.tableName)
        .where('identifier', '=', identifier)
        .orderBy('created_at', 'DESC')
        .get<RateLimit>();

      return results || [];
    } catch (error: any) {
      this.logger.error('Error fetching rate limits for identifier', {
        identifier,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Delete all rate limits for an identifier
   *
   * @param identifier - Email or IP address
   */
  async deleteAllForIdentifier(identifier: string): Promise<void> {
    try {
      await this.db
        .table(this.tableName)
        .where('identifier', '=', identifier)
        .delete();

      this.logger.info('All rate limits deleted for identifier', { identifier });
    } catch (error: any) {
      this.logger.error('Error deleting rate limits for identifier', {
        identifier,
        error: error.message,
      });
    }
  }
}

export default RateLimitModel;
