import jwt from 'jsonwebtoken';
import { TokenError } from '@jam/base-app';

/**
 * JWT Utility
 *
 * Handles JWT token generation and validation
 */

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh' | 'reset';
}

export interface TokenPair {
  token: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: Date;
}

export class JWTUtil {
  private static readonly SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

  /**
   * Generate access and refresh token pair
   */
  static generateTokenPair(userId: string, email: string): TokenPair {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = this.generateRefreshToken(userId, email);

    // Calculate expiry time (15 minutes)
    const expiresIn = 15 * 60; // seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      token: accessToken,
      refreshToken,
      expiresIn,
      expiresAt,
    };
  }

  /**
   * Generate access token
   */
  static generateAccessToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'access',
    };

    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'jam-auth-service',
      audience: 'jam-app',
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'refresh',
    };

    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'jam-auth-service',
      audience: 'jam-app',
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.SECRET, {
        issuer: 'jam-auth-service',
        audience: 'jam-app',
      }) as TokenPayload;

      if (payload.type !== 'access') {
        throw new TokenError('Invalid token type');
      }

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenError('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new TokenError('Invalid token');
      } else {
        throw new TokenError(error.message);
      }
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.REFRESH_SECRET, {
        issuer: 'jam-auth-service',
        audience: 'jam-app',
      }) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new TokenError('Invalid token type');
      }

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenError('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new TokenError('Invalid refresh token');
      } else {
        throw new TokenError(error.message);
      }
    }
  }

  /**
   * Generate reset token (short-lived for password resets)
   */
  static generateResetToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'reset',
    };

    return jwt.sign(payload, this.SECRET, {
      expiresIn: '15m', // 15 minutes
      issuer: 'jam-auth-service',
      audience: 'jam-app',
    });
  }

  /**
   * Verify reset token
   */
  static verifyResetToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.SECRET, {
        issuer: 'jam-auth-service',
        audience: 'jam-app',
      }) as TokenPayload;

      if (payload.type !== 'reset') {
        throw new TokenError('Invalid token type');
      }

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenError('Reset token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new TokenError('Invalid reset token');
      } else {
        throw new TokenError(error.message);
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decode(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiry time
   */
  static getTokenExpiry(token: string): Date | null {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  static isExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) {
      return true;
    }

    return expiry < new Date();
  }
}
