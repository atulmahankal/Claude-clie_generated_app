import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { Logger } from '@jam/base-app';
import { FundflowHandlers } from './handlers/fundflow.handler';
import { FundflowController } from '../controllers/fundflow.controller';
import { DatabaseAdapter } from '@jam/database-engine';

/**
 * gRPC Server
 *
 * Sets up and starts the gRPC server for the fundflow service
 */

export class GrpcServer {
  private server: grpc.Server;
  private logger: Logger;
  private port: number;

  constructor(db: DatabaseAdapter, port: number = 50053) {
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
      // Load fundflow.proto
      const PROTO_PATH = path.join(__dirname, '../../../..', 'packages/grpc-protos/src/fundflow.proto');

      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
      const fundflowProto = protoDescriptor.fundflow;

      // Create controller and handlers
      const fundflowController = new FundflowController(db);
      const fundflowHandlers = new FundflowHandlers(fundflowController);

      // Register service
      this.server.addService(fundflowProto.FundflowService.service, {
        CreateTransaction: fundflowHandlers.createTransaction,
        GetTransactions: fundflowHandlers.getTransactions,
        GetTransaction: fundflowHandlers.getTransaction,
        UpdateTransaction: fundflowHandlers.updateTransaction,
        DeleteTransaction: fundflowHandlers.deleteTransaction,
        CreateCategory: fundflowHandlers.createCategory,
        GetCategories: fundflowHandlers.getCategories,
        UpdateCategory: fundflowHandlers.updateCategory,
        DeleteCategory: fundflowHandlers.deleteCategory,
        CreateRecurringTransaction: fundflowHandlers.createRecurringTransaction,
        GetRecurringTransactions: fundflowHandlers.getRecurringTransactions,
        GetRecurringTransaction: fundflowHandlers.getRecurringTransaction,
        UpdateRecurringTransaction: fundflowHandlers.updateRecurringTransaction,
        DeleteRecurringTransaction: fundflowHandlers.deleteRecurringTransaction,
        ProcessRecurringTransactions: fundflowHandlers.processRecurringTransactions,
        GetStatistics: fundflowHandlers.getStatistics,
        GetCategoryBreakdown: fundflowHandlers.getCategoryBreakdown,
        GetMonthlyTrends: fundflowHandlers.getMonthlyTrends,
        GetReminders: fundflowHandlers.getReminders,
        DismissReminder: fundflowHandlers.dismissReminder,
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
