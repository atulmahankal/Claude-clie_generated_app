import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { TwoFactorError } from '@jam/base-app';

/**
 * Two-Factor Authentication Utility
 *
 * Handles TOTP-based 2FA
 */

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes?: string[];
}

export class TwoFactorUtil {
  private static readonly APP_NAME = 'JAM Stack App';

  /**
   * Generate a new 2FA secret and QR code
   */
  static async generateSecret(userEmail: string): Promise<TwoFactorSetup> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${userEmail})`,
      issuer: this.APP_NAME,
      length: 32,
    });

    if (!secret.otpauth_url) {
      throw new Error('Failed to generate OTP auth URL');
    }

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    // Generate backup codes (optional)
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify a TOTP token
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps before/after for clock drift
      });

      return verified;
    } catch (error) {
      throw new TwoFactorError('Failed to verify 2FA token');
    }
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = this.generateRandomCode(8);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate a random alphanumeric code
   */
  private static generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];

      // Add hyphen after every 4 characters for readability
      if ((i + 1) % 4 === 0 && i + 1 < length) {
        code += '-';
      }
    }

    return code;
  }

  /**
   * Get current TOTP token (for testing)
   */
  static getCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  }

  /**
   * Validate token format
   */
  static isValidTokenFormat(token: string): boolean {
    // TOTP tokens are 6 digits
    return /^\d{6}$/.test(token);
  }

  /**
   * Hash backup code for storage
   */
  static async hashBackupCode(code: string): Promise<string> {
    // In production, use bcrypt or similar
    // For now, simple hash
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(code: string, hashedCode: string): Promise<boolean> {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    return hash === hashedCode;
  }
}
