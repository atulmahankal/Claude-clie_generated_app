import { DatabaseAdapter } from '@jam/database-engine';
import {
  Logger,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  TwoFactorError,
  BadRequestError,
} from '@jam/base-app';
import { UserModel, CreateUserData } from '../models/user.model';
import { SessionModel } from '../models/session.model';
import { LoginHistoryModel } from '../models/login-history.model';
import { JWTUtil, TokenPair } from '../utils/jwt.util';
import { TwoFactorUtil, TwoFactorSetup } from '../utils/two-factor.util';

/**
 * Authentication Controller
 *
 * Handles all authentication business logic
 */

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
  deviceInfo?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  user?: any;
  error?: string;
}

export class AuthController {
  private userModel: UserModel;
  private sessionModel: SessionModel;
  private loginHistoryModel: LoginHistoryModel;
  private logger: Logger;

  constructor(db: DatabaseAdapter) {
    this.userModel = new UserModel(db);
    this.sessionModel = new SessionModel(db);
    this.loginHistoryModel = new LoginHistoryModel(db);
    this.logger = Logger.getInstance();
  }

  /**
   * User signup
   */
  async signup(request: SignupRequest): Promise<LoginResponse> {
    try {
      // Validate email format
      if (!this.isValidEmail(request.email)) {
        throw new ValidationError('Invalid email format');
      }

      // Validate password strength
      if (!this.isStrongPassword(request.password)) {
        throw new ValidationError(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }

      // Create user
      const user = await this.userModel.create({
        email: request.email,
        password: request.password,
        display_name: request.displayName,
      });

      // Generate tokens
      const tokens = JWTUtil.generateTokenPair(user.id, user.email);

      // Create session
      await this.sessionModel.create({
        user_id: user.id,
        token: tokens.token,
        refresh_token: tokens.refreshToken,
        device_info: request.deviceInfo,
        expires_at: tokens.expiresAt,
      });

      // Log successful signup
      this.logger.info('User signed up', { userId: user.id, email: user.email });

      const safeUser = this.userModel.toSafeUser(user);

      return {
        success: true,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        user: safeUser,
      };
    } catch (error: any) {
      this.logger.error('Signup failed', error, { email: request.email });

      return {
        success: false,
        error: error.message || 'Signup failed',
      };
    }
  }

  /**
   * User login
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Find user
      const user = await this.userModel.findByEmail(request.email);

      if (!user) {
        // Record failed attempt
        await this.recordLoginAttempt(
          'unknown',
          request,
          false,
          'User not found'
        );

        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await this.userModel.verifyPassword(
        request.password,
        user.password_hash
      );

      if (!isValidPassword) {
        // Record failed attempt
        await this.recordLoginAttempt(user.id, request, false, 'Invalid password');

        throw new AuthenticationError('Invalid email or password');
      }

      // Check if 2FA is enabled
      if (user.two_factor_enabled) {
        // Record partial success (needs 2FA)
        await this.recordLoginAttempt(user.id, request, true, 'Requires 2FA');

        return {
          success: false,
          requires2FA: true,
          error: 'Two-factor authentication required',
        };
      }

      // Generate tokens
      const tokens = JWTUtil.generateTokenPair(user.id, user.email);

      // Create session
      await this.sessionModel.create({
        user_id: user.id,
        token: tokens.token,
        refresh_token: tokens.refreshToken,
        device_info: request.deviceInfo,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        expires_at: tokens.expiresAt,
      });

      // Record successful login
      await this.recordLoginAttempt(user.id, request, true);

      this.logger.info('User logged in', { userId: user.id, email: user.email });

      const safeUser = this.userModel.toSafeUser(user);

      return {
        success: true,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        user: safeUser,
      };
    } catch (error: any) {
      this.logger.error('Login failed', error, { email: request.email });

      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  /**
   * Validate token
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Verify JWT
      const payload = JWTUtil.verifyAccessToken(token);

      // Check if session exists and is active
      const session = await this.sessionModel.findByToken(token);

      if (!session) {
        throw new AuthenticationError('Session not found or expired');
      }

      // Update last active
      await this.sessionModel.updateLastActive(session.id);

      return {
        valid: true,
        userId: payload.userId,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid token',
      };
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    error?: string;
  }> {
    try {
      // Verify refresh token
      const payload = JWTUtil.verifyRefreshToken(refreshToken);

      // Find session
      const session = await this.sessionModel.findByRefreshToken(refreshToken);

      if (!session) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new token pair
      const tokens = JWTUtil.generateTokenPair(payload.userId, payload.email);

      // Update session with new tokens
      await this.sessionModel.updateTokens(
        session.id,
        tokens.token,
        tokens.refreshToken,
        tokens.expiresAt
      );

      return {
        success: true,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      };
    } catch (error: any) {
      this.logger.error('Token refresh failed', error);

      return {
        success: false,
        error: error.message || 'Failed to refresh token',
      };
    }
  }

  /**
   * Logout
   */
  async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.sessionModel.revokeByToken(token);

      return { success: true };
    } catch (error: any) {
      this.logger.error('Logout failed', error);

      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }

  /**
   * Enable 2FA
   */
  async enable2FA(userId: string): Promise<{
    success: boolean;
    secret?: string;
    qrCode?: string;
    error?: string;
  }> {
    try {
      const user = await this.userModel.findByIdOrFail(userId);

      if (user.two_factor_enabled) {
        throw new BadRequestError('2FA is already enabled');
      }

      // Generate 2FA secret
      const setup = await TwoFactorUtil.generateSecret(user.email);

      // Don't save yet - wait for user to verify
      // Store temporarily (in real app, use cache like Redis)

      return {
        success: true,
        secret: setup.secret,
        qrCode: setup.qrCode,
      };
    } catch (error: any) {
      this.logger.error('Enable 2FA failed', error, { userId });

      return {
        success: false,
        error: error.message || 'Failed to enable 2FA',
      };
    }
  }

  /**
   * Verify and complete 2FA setup
   */
  async verify2FA(
    userId: string,
    token: string,
    secret: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.userModel.findByIdOrFail(userId);

      // Verify the token
      const isValid = TwoFactorUtil.verifyToken(secret, token);

      if (!isValid) {
        throw new TwoFactorError('Invalid 2FA token');
      }

      // Enable 2FA for the user
      await this.userModel.enable2FA(userId, secret);

      this.logger.info('2FA enabled', { userId });

      return { success: true };
    } catch (error: any) {
      this.logger.error('2FA verification failed', error, { userId });

      return {
        success: false,
        error: error.message || 'Failed to verify 2FA',
      };
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(
    userId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.userModel.findByIdOrFail(userId);

      // Verify password
      const isValid = await this.userModel.verifyPassword(password, user.password_hash);

      if (!isValid) {
        throw new AuthenticationError('Invalid password');
      }

      // Disable 2FA
      await this.userModel.disable2FA(userId);

      this.logger.info('2FA disabled', { userId });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Disable 2FA failed', error, { userId });

      return {
        success: false,
        error: error.message || 'Failed to disable 2FA',
      };
    }
  }

  /**
   * Get user sessions
   */
  async getSessions(userId: string): Promise<any[]> {
    const sessions = await this.sessionModel.findByUserId(userId);

    return sessions.map((session) => ({
      id: session.id,
      device_type: session.device_type,
      device_info: session.device_info,
      ip_address: session.ip_address,
      created_at: session.created_at,
      last_active: session.last_active,
      is_current: false, // Would need current token to determine this
    }));
  }

  /**
   * Revoke a session
   */
  async revokeSession(
    userId: string,
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.sessionModel.revoke(sessionId);

      this.logger.info('Session revoked', { userId, sessionId });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to revoke session',
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findByIdOrFail(userId);
    return this.userModel.toSafeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    displayName?: string,
    avatarUrl?: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await this.userModel.update(userId, {
        display_name: displayName,
        avatar_url: avatarUrl,
      });

      return {
        success: true,
        user: this.userModel.toSafeUser(user),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isStrongPassword(newPassword)) {
        throw new ValidationError(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }

      await this.userModel.updatePassword(userId, oldPassword, newPassword);

      // Revoke all sessions except current (security measure)
      // In a real implementation, you'd keep the current session

      this.logger.info('Password changed', { userId });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to change password',
      };
    }
  }

  // Helper methods

  private async recordLoginAttempt(
    userId: string,
    request: LoginRequest,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    await this.loginHistoryModel.create({
      user_id: userId,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      device_info: request.deviceInfo,
      success,
      failure_reason: failureReason,
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isStrongPassword(password: string): boolean {
    // At least 8 characters, with uppercase, lowercase, number, and special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }
}
