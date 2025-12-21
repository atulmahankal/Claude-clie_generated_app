import { randomInt } from 'crypto';

/**
 * Verification Code Utility
 *
 * Provides secure generation and validation of 6-digit verification codes
 * for password resets and email verification.
 *
 * Security Notes:
 * - Uses cryptographically secure randomInt from Node.js crypto module
 * - Codes are 6 digits (100000-999999) for balance between security and usability
 * - Always use with expiration times (typically 15 minutes)
 * - Always limit verification attempts (typically 3 attempts)
 */
export class VerificationCodeUtil {
  /**
   * Generate a cryptographically secure 6-digit verification code
   *
   * @returns {string} A 6-digit numeric string (e.g., "123456")
   *
   * @example
   * const code = VerificationCodeUtil.generateSixDigitCode();
   * console.log(code); // "847291"
   */
  static generateSixDigitCode(): string {
    // Generate random integer between 100000 and 999999 (inclusive)
    const code = randomInt(100000, 1000000);
    return code.toString();
  }

  /**
   * Validate that a code matches the expected 6-digit format
   *
   * @param {string} code - The code to validate
   * @returns {boolean} True if code is exactly 6 digits, false otherwise
   *
   * @example
   * VerificationCodeUtil.isValidCodeFormat("123456"); // true
   * VerificationCodeUtil.isValidCodeFormat("12345");  // false
   * VerificationCodeUtil.isValidCodeFormat("abc123"); // false
   */
  static isValidCodeFormat(code: string): boolean {
    // Check if code is exactly 6 digits
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }

  /**
   * Calculate expiration timestamp for a verification code
   *
   * @param {number} minutes - Number of minutes until expiration (default: 15)
   * @returns {Date} Expiration timestamp
   *
   * @example
   * const expiresAt = VerificationCodeUtil.getCodeExpiration(15);
   * // Returns Date 15 minutes from now
   */
  static getCodeExpiration(minutes: number = 15): Date {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);
    return expiresAt;
  }

  /**
   * Check if a code has expired
   *
   * @param {Date | string} expiresAt - Expiration timestamp
   * @returns {boolean} True if code has expired, false otherwise
   *
   * @example
   * const expiresAt = new Date('2025-12-21T10:00:00Z');
   * VerificationCodeUtil.isExpired(expiresAt); // true if current time > expiresAt
   */
  static isExpired(expiresAt: Date | string): boolean {
    const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return new Date() > expiration;
  }

  /**
   * Format a code for display (adds space in the middle for better readability)
   *
   * @param {string} code - The 6-digit code
   * @returns {string} Formatted code with space (e.g., "123 456")
   *
   * @example
   * VerificationCodeUtil.formatForDisplay("123456"); // "123 456"
   */
  static formatForDisplay(code: string): string {
    if (!this.isValidCodeFormat(code)) {
      return code;
    }
    return `${code.substring(0, 3)} ${code.substring(3)}`;
  }

  /**
   * Remove formatting from a code (removes spaces and other non-digits)
   *
   * @param {string} code - The code to sanitize
   * @returns {string} Code with only digits
   *
   * @example
   * VerificationCodeUtil.sanitizeCode("123 456"); // "123456"
   * VerificationCodeUtil.sanitizeCode("  12-34-56  "); // "123456"
   */
  static sanitizeCode(code: string): string {
    return code.replace(/\D/g, '');
  }
}

export default VerificationCodeUtil;
