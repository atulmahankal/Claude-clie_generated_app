import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { Logger } from '@jam/base-app';
import { AuthHandlers } from './handlers/auth.handler';
import { AuthController } from '../controllers/auth.controller';
import { DatabaseAdapter } from '@jam/database-engine';

/**
 * gRPC Server
 *
 * Sets up and starts the gRPC server for the auth service
 */

export class GrpcServer {
  private server: grpc.Server;
  private logger: Logger;
  private port: number;

  constructor(db: DatabaseAdapter, port: number = 50051) {
    this.server = new grpc.Server();
    this.logger = Logger.getInstance();
    this.port = port;

    this.loadServices(db);
  }

  /**
   * Load proto files and register services
   */
  private loadServices(db: DatabaseAdapter): void {
    try {
      // Load auth.proto
      const PROTO_PATH = path.join(__dirname, '../../../..', 'packages/grpc-protos/src/auth.proto');

      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
      const authProto = protoDescriptor.auth;

      // Create controller and handlers
      const authController = new AuthController(db);
      const authHandlers = new AuthHandlers(authController);

      // Register service
      this.server.addService(authProto.AuthService.service, {
        Login: authHandlers.login,
        Signup: authHandlers.signup,
        ValidateToken: authHandlers.validateToken,
        RefreshToken: authHandlers.refreshToken,
        Logout: authHandlers.logout,
        Enable2FA: authHandlers.enable2FA,
        Verify2FA: authHandlers.verify2FA,
        Disable2FA: authHandlers.disable2FA,
        GetSessions: authHandlers.getSessions,
        RevokeSession: authHandlers.revokeSession,
        GetProfile: authHandlers.getProfile,
        UpdateProfile: authHandlers.updateProfile,
        ResetPassword: authHandlers.resetPassword,
        ChangePassword: authHandlers.changePassword,
      });

      this.logger.info('gRPC services loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load gRPC services', error);
      throw error;
    }
  }

  /**
   * Start the gRPC server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        `0.0.0.0:${this.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            this.logger.error('Failed to start gRPC server', error);
            reject(error);
            return;
          }

          this.server.start();
          this.logger.info(`gRPC server started on port ${port}`);
          resolve();
        }
      );
    });
  }

  /**
   * Stop the gRPC server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        this.logger.info('gRPC server stopped');
        resolve();
      });
    });
  }

  /**
   * Force stop the gRPC server
   */
  forceStop(): void {
    this.server.forceShutdown();
    this.logger.warn('gRPC server force stopped');
  }
}
