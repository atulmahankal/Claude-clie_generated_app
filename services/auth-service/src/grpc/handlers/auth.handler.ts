import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { Logger, ErrorHandler } from '@jam/base-app';
import { AuthController } from '../../controllers/auth.controller';

/**
 * gRPC Auth Service Handlers
 *
 * Implements all RPC methods defined in auth.proto
 */

export class AuthHandlers {
  private controller: AuthController;
  private logger: Logger;

  constructor(controller: AuthController) {
    this.controller = controller;
    this.logger = Logger.getInstance();
  }

  /**
   * Login
   */
  login = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { email, password, device_info, ip_address } = call.request;

      const result = await this.controller.login({
        email,
        password,
        deviceInfo: device_info,
        ipAddress: ip_address,
      });

      callback(null, {
        success: result.success,
        token: result.token || '',
        refresh_token: result.refreshToken || '',
        requires_2fa: result.requires2FA || false,
        error: result.error || '',
        user: result.user || null,
      });
    } catch (error: any) {
      this.logger.error('gRPC Login error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Signup
   */
  signup = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { email, password, display_name, device_info } = call.request;

      const result = await this.controller.signup({
        email,
        password,
        displayName: display_name,
        deviceInfo: device_info,
      });

      callback(null, {
        success: result.success,
        token: result.token || '',
        error: result.error || '',
        user: result.user || null,
      });
    } catch (error: any) {
      this.logger.error('gRPC Signup error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Validate Token
   */
  validateToken = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { token } = call.request;

      const result = await this.controller.validateToken(token);

      callback(null, {
        valid: result.valid,
        user_id: result.userId || '',
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC ValidateToken error', error);
      callback(null, {
        valid: false,
        user_id: '',
        error: error.message || 'Token validation failed',
      });
    }
  };

  /**
   * Refresh Token
   */
  refreshToken = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { refresh_token } = call.request;

      const result = await this.controller.refreshToken(refresh_token);

      callback(null, {
        success: result.success,
        token: result.token || '',
        refresh_token: result.refreshToken || '',
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC RefreshToken error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Logout
   */
  logout = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { session_token } = call.request;

      const result = await this.controller.logout(session_token);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC Logout error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Enable 2FA
   */
  enable2FA = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id } = call.request;

      const result = await this.controller.enable2FA(user_id);

      callback(null, {
        success: result.success,
        secret: result.secret || '',
        qr_code: result.qrCode || '',
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC Enable2FA error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Verify 2FA
   */
  verify2FA = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, token } = call.request;

      // Note: In a real implementation, you'd retrieve the secret from a temporary store
      // For now, we'll need to pass it as part of the request or store it differently
      const result = await this.controller.verify2FA(user_id, token, '');

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC Verify2FA error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Disable 2FA
   */
  disable2FA = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, password } = call.request;

      const result = await this.controller.disable2FA(user_id, password);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC Disable2FA error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Get Sessions
   */
  getSessions = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id } = call.request;

      const sessions = await this.controller.getSessions(user_id);

      callback(null, {
        sessions,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetSessions error', error);
      callback(null, {
        sessions: [],
        error: error.message || 'Failed to get sessions',
      });
    }
  };

  /**
   * Revoke Session
   */
  revokeSession = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, session_id } = call.request;

      const result = await this.controller.revokeSession(user_id, session_id);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC RevokeSession error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Get Profile
   */
  getProfile = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id } = call.request;

      const user = await this.controller.getProfile(user_id);

      callback(null, {
        user,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetProfile error', error);
      callback(null, {
        user: null,
        error: error.message || 'Failed to get profile',
      });
    }
  };

  /**
   * Update Profile
   */
  updateProfile = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, display_name, avatar_url } = call.request;

      const result = await this.controller.updateProfile(
        user_id,
        display_name,
        avatar_url
      );

      callback(null, {
        success: result.success,
        user: result.user || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC UpdateProfile error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Reset Password (placeholder - would send email)
   */
  resetPassword = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { email } = call.request;

      // TODO: Implement password reset email logic
      this.logger.info('Password reset requested', { email });

      callback(null, {
        success: true,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC ResetPassword error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Change Password
   */
  changePassword = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, old_password, new_password } = call.request;

      const result = await this.controller.changePassword(
        user_id,
        old_password,
        new_password
      );

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC ChangePassword error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };
}
