import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { Logger, ErrorHandler } from '@jam/base-app';
import { TodosController } from '../../controllers/todos.controller';

/**
 * gRPC Todos Service Handlers
 *
 * Implements all RPC methods defined in todos.proto
 */

export class TodosHandlers {
  private controller: TodosController;
  private logger: Logger;

  constructor(controller: TodosController) {
    this.controller = controller;
    this.logger = Logger.getInstance();
  }

  // ===== LIST HANDLERS =====

  /**
   * Create List
   */
  createList = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, name, color, icon } = call.request;

      const result = await this.controller.createList({
        user_id,
        name,
        color,
        icon,
      });

      callback(null, {
        success: result.success,
        list: result.list || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC CreateList error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Get Lists
   */
  getLists = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id } = call.request;

      const lists = await this.controller.getLists(user_id);

      callback(null, {
        lists,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetLists error', error);
      callback(null, {
        lists: [],
        error: error.message || 'Failed to get lists',
      });
    }
  };

  /**
   * Get List
   */
  getList = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { list_id, user_id } = call.request;

      const result = await this.controller.getList(list_id, user_id);

      callback(null, {
        success: result.success,
        list: result.list || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetList error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Update List
   */
  updateList = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { list_id, user_id, name, color, icon, sort_order } = call.request;

      const result = await this.controller.updateList(list_id, user_id, {
        name,
        color,
        icon,
        sort_order,
      });

      callback(null, {
        success: result.success,
        list: result.list || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC UpdateList error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Delete List
   */
  deleteList = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { list_id, user_id } = call.request;

      const result = await this.controller.deleteList(list_id, user_id);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC DeleteList error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  // ===== TODO HANDLERS =====

  /**
   * Create Todo
   */
  createTodo = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { list_id, user_id, title, description, priority, due_date } = call.request;

      const result = await this.controller.createTodo({
        list_id,
        user_id,
        title,
        description,
        priority,
        due_date,
      });

      callback(null, {
        success: result.success,
        todo: result.todo || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC CreateTodo error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Get Todos
   */
  getTodos = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { list_id, user_id, completed_only, active_only } = call.request;

      const todos = await this.controller.getTodos(
        list_id,
        user_id,
        completed_only,
        active_only
      );

      callback(null, {
        todos,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetTodos error', error);
      callback(null, {
        todos: [],
        error: error.message || 'Failed to get todos',
      });
    }
  };

  /**
   * Get Todo
   */
  getTodo = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { todo_id, user_id } = call.request;

      const result = await this.controller.getTodo(todo_id, user_id);

      callback(null, {
        success: result.success,
        todo: result.todo || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetTodo error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Update Todo
   */
  updateTodo = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { todo_id, user_id, title, description, priority, due_date } = call.request;

      const result = await this.controller.updateTodo(todo_id, user_id, {
        title,
        description,
        priority,
        due_date,
      });

      callback(null, {
        success: result.success,
        todo: result.todo || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC UpdateTodo error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Delete Todo
   */
  deleteTodo = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { todo_id, user_id } = call.request;

      const result = await this.controller.deleteTodo(todo_id, user_id);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC DeleteTodo error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  /**
   * Toggle Todo
   */
  toggleTodo = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { todo_id, user_id } = call.request;

      const result = await this.controller.toggleTodo(todo_id, user_id);

      callback(null, {
        success: result.success,
        todo: result.todo || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC ToggleTodo error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };
}
