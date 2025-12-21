import { DatabaseAdapter } from '@jam/database-engine';
import { Logger } from '@jam/base-app';
import { VerificationCodeUtil } from '../utils/verification-code.util';

/**
 * Password Reset Model
 *
 * Handles password reset code generation, validation, and lifecycle management.
 */

export interface PasswordResetCode {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  used: boolean;
  created_at: string;
}

export interface CreateResetCodeData {
  userId: string;
  code: string;
  expiresAt: Date;
}

export interface ValidateCodeResult {
  valid: boolean;
  resetCode?: PasswordResetCode;
  error?: string;
}

export class PasswordResetModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'password_reset_codes';
  private logger = Logger.getInstance();

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new password reset code
   *
   * @param userId - User ID
   * @param code - 6-digit verification code
   * @param expiresAt - Expiration date (optional, defaults to 15 minutes)
   * @returns Created PasswordResetCode
   */
  async create(
    userId: string,
    code: string,
    expiresAt?: Date
  ): Promise<PasswordResetCode> {
    try {
      // Invalidate any existing codes for this user first
      await this.invalidateAllForUser(userId);

      const expiration =
        expiresAt || VerificationCodeUtil.getCodeExpiration(15);

      const result = await this.db.table(this.tableName).insert({
        user_id: userId,
        code: code,
        expires_at: expiration.toISOString(),
        attempts: 0,
        max_attempts: 3,
        used: false,
        created_at: new Date().toISOString(),
      });

      this.logger.info('Password reset code created', {
        userId,
        codeId: result?.id,
      });

      // Fetch and return the created code
      if (result && result.id) {
        const created = await this.findById(result.id);
        if (created) return created;
      }

      // Fallback: find by user_id (most recent)
      const codes = await this.db
        .table(this.tableName)
        .where('user_id', '=', userId)
        .where('used', '=', false)
        .orderBy('created_at', 'DESC')
        .limit(1)
        .get<PasswordResetCode>();

      if (codes && codes[0]) {
        return codes[0];
      }

      throw new Error('Failed to create password reset code');
    } catch (error: any) {
      this.logger.error('Error creating password reset code', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find a password reset code by ID
   *
   * @param id - Reset code ID
   * @returns PasswordResetCode or null
   */
  async findById(id: string): Promise<PasswordResetCode | null> {
    try {
      const result = await this.db
        .table(this.tableName)
        .where('id', '=', id)
        .first();

      return result || null;
    } catch (error: any) {
      this.logger.error('Error finding password reset code by ID', {
        id,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Find a password reset code by code value
   *
   * @param code - 6-digit verification code
   * @returns PasswordResetCode or null
   */
  async findByCode(code: string): Promise<PasswordResetCode | null> {
    try {
      const result = await this.db
        .table(this.tableName)
        .where('code', '=', code)
        .where('used', '=', false)
        .orderBy('created_at', 'DESC')
        .first<PasswordResetCode>();

      return result || null;
    } catch (error: any) {
      this.logger.error('Error finding password reset code by code', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Find active (unused, not expired) reset code for a user
   *
   * @param userId - User ID
   * @returns PasswordResetCode or null
   */
  async findActiveByUserId(userId: string): Promise<PasswordResetCode | null> {
    try {
      const now = new Date().toISOString();

      const result = await this.db
        .table(this.tableName)
        .where('user_id', '=', userId)
        .where('used', '=', false)
        .where('expires_at', '>', now)
        .orderBy('created_at', 'DESC')
        .first<PasswordResetCode>();

      return result || null;
    } catch (error: any) {
      this.logger.error('Error finding active reset code for user', {
        userId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Validate a reset code
   *
   * @param code - 6-digit verification code
   * @param userId - User ID (optional, for extra validation)
   * @returns ValidateCodeResult
   */
  async validateCode(
    code: string,
    userId?: string
  ): Promise<ValidateCodeResult> {
    try {
      // Format validation
      if (!VerificationCodeUtil.isValidCodeFormat(code)) {
        return {
          valid: false,
          error: 'Invalid code format. Code must be 6 digits.',
        };
      }

      // Find the code
      const resetCode = await this.findByCode(code);

      if (!resetCode) {
        return {
          valid: false,
          error: 'Invalid or expired verification code.',
        };
      }

      // Check if already used
      if (resetCode.used) {
        return {
          valid: false,
          error: 'This verification code has already been used.',
        };
      }

      // Check expiration
      if (VerificationCodeUtil.isExpired(resetCode.expires_at)) {
        return {
          valid: false,
          error: 'This verification code has expired. Please request a new one.',
        };
      }

      // Check max attempts
      if (resetCode.attempts >= resetCode.max_attempts) {
        return {
          valid: false,
          error:
            'Maximum verification attempts exceeded. Please request a new code.',
        };
      }

      // Optional: Check user ID matches
      if (userId && resetCode.user_id !== userId) {
        this.logger.warn('Reset code user ID mismatch', {
          codeUserId: resetCode.user_id,
          providedUserId: userId,
        });
        return {
          valid: false,
          error: 'Invalid verification code.',
        };
      }

      return {
        valid: true,
        resetCode,
      };
    } catch (error: any) {
      this.logger.error('Error validating reset code', {
        error: error.message,
      });
      return {
        valid: false,
        error: 'An error occurred while validating the code.',
      };
    }
  }

  /**
   * Increment attempt count for a reset code
   *
   * @param id - Reset code ID
   */
  async incrementAttempts(id: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE ${this.tableName} SET attempts = attempts + 1 WHERE id = $1`,
        [id]
      );

      this.logger.info('Reset code attempt incremented', { id });
    } catch (error: any) {
      this.logger.error('Error incrementing reset code attempts', {
        id,
        error: error.message,
      });
    }
  }

  /**
   * Mark a reset code as used
   *
   * @param id - Reset code ID
   */
  async markAsUsed(id: string): Promise<void> {
    try {
      await this.db
        .table(this.tableName)
        .where('id', '=', id)
        .update({
          used: true,
        });

      this.logger.info('Reset code marked as used', { id });
    } catch (error: any) {
      this.logger.error('Error marking reset code as used', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Invalidate all reset codes for a user
   *
   * @param userId - User ID
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    try {
      await this.db.query(`SELECT invalidate_user_reset_codes($1)`, [userId]);

      this.logger.info('All reset codes invalidated for user', { userId });
    } catch (error: any) {
      this.logger.error('Error invalidating reset codes for user', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Clean up expired reset codes using the database function
   *
   * @returns Number of codes deleted
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await this.db.query(`SELECT cleanup_expired_reset_codes()`);

      // Extract the count from the result
      const count =
        result && result.rows && result.rows[0] ? result.rows[0].cleanup_expired_reset_codes : 0;

      this.logger.info('Expired reset codes cleaned up', { count });
      return count;
    } catch (error: any) {
      this.logger.error('Error cleaning up expired reset codes', {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get all reset codes for a user (for debugging/admin)
   *
   * @param userId - User ID
   * @returns Array of PasswordResetCode
   */
  async getAllForUser(userId: string): Promise<PasswordResetCode[]> {
    try {
      const results = await this.db
        .table(this.tableName)
        .where('user_id', '=', userId)
        .orderBy('created_at', 'DESC')
        .get<PasswordResetCode>();

      return results || [];
    } catch (error: any) {
      this.logger.error('Error fetching reset codes for user', {
        userId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Delete all reset codes for a user
   *
   * @param userId - User ID
   */
  async deleteAllForUser(userId: string): Promise<void> {
    try {
      await this.db.table(this.tableName).where('user_id', '=', userId).delete();

      this.logger.info('All reset codes deleted for user', { userId });
    } catch (error: any) {
      this.logger.error('Error deleting reset codes for user', {
        userId,
        error: error.message,
      });
    }
  }
}

export default PasswordResetModel;
