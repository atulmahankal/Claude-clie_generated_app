import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { Logger } from '@jam/base-app';
import { TodosHandlers } from './handlers/todos.handler';
import { TodosController } from '../controllers/todos.controller';
import { DatabaseAdapter } from '@jam/database-engine';

/**
 * gRPC Server
 *
 * Sets up and starts the gRPC server for the todos service
 */

export class GrpcServer {
  private server: grpc.Server;
  private logger: Logger;
  private port: number;

  constructor(db: DatabaseAdapter, port: number = 50052) {
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
      // Load todos.proto
      const PROTO_PATH = path.join(__dirname, '../../../..', 'packages/grpc-protos/src/todos.proto');

      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
      const todosProto = protoDescriptor.todos;

      // Create controller and handlers
      const todosController = new TodosController(db);
      const todosHandlers = new TodosHandlers(todosController);

      // Register service
      this.server.addService(todosProto.TodosService.service, {
        CreateList: todosHandlers.createList,
        GetLists: todosHandlers.getLists,
        GetList: todosHandlers.getList,
        UpdateList: todosHandlers.updateList,
        DeleteList: todosHandlers.deleteList,
        CreateTodo: todosHandlers.createTodo,
        GetTodos: todosHandlers.getTodos,
        GetTodo: todosHandlers.getTodo,
        UpdateTodo: todosHandlers.updateTodo,
        DeleteTodo: todosHandlers.deleteTodo,
        ToggleTodo: todosHandlers.toggleTodo,
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
