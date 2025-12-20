import { DatabaseAdapter } from '@jam/database-engine';
import { Logger, ValidationError, NotFoundError } from '@jam/base-app';
import { TodoListModel, CreateTodoListData, UpdateTodoListData } from '../models/todo-list.model';
import { TodoModel, CreateTodoData, UpdateTodoData } from '../models/todo.model';

/**
 * Todos Controller
 *
 * Handles all todo and todo list business logic
 */

export class TodosController {
  private todoListModel: TodoListModel;
  private todoModel: TodoModel;
  private logger: Logger;

  constructor(db: DatabaseAdapter) {
    this.todoListModel = new TodoListModel(db);
    this.todoModel = new TodoModel(db);
    this.logger = Logger.getInstance();
  }

  // ===== LIST OPERATIONS =====

  /**
   * Create a new todo list
   */
  async createList(data: CreateTodoListData): Promise<{
    success: boolean;
    list?: any;
    error?: string;
  }> {
    try {
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('List name is required');
      }

      const list = await this.todoListModel.create(data);

      this.logger.info('Todo list created', { listId: list.id, userId: data.user_id });

      return { success: true, list };
    } catch (error: any) {
      this.logger.error('Create list failed', error, { userId: data.user_id });

      return {
        success: false,
        error: error.message || 'Failed to create list',
      };
    }
  }

  /**
   * Get all lists for a user
   */
  async getLists(userId: string): Promise<any[]> {
    return this.todoListModel.findByUserId(userId);
  }

  /**
   * Get a single list
   */
  async getList(listId: string, userId: string): Promise<{
    success: boolean;
    list?: any;
    error?: string;
  }> {
    try {
      const list = await this.todoListModel.findByIdOrFail(listId, userId);

      return { success: true, list };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'List not found',
      };
    }
  }

  /**
   * Update a list
   */
  async updateList(
    listId: string,
    userId: string,
    data: UpdateTodoListData
  ): Promise<{
    success: boolean;
    list?: any;
    error?: string;
  }> {
    try {
      const list = await this.todoListModel.update(listId, userId, data);

      this.logger.info('Todo list updated', { listId, userId });

      return { success: true, list };
    } catch (error: any) {
      this.logger.error('Update list failed', error, { listId, userId });

      return {
        success: false,
        error: error.message || 'Failed to update list',
      };
    }
  }

  /**
   * Delete a list
   */
  async deleteList(listId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.todoListModel.delete(listId, userId);

      this.logger.info('Todo list deleted', { listId, userId });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Delete list failed', error, { listId, userId });

      return {
        success: false,
        error: error.message || 'Failed to delete list',
      };
    }
  }

  // ===== TODO OPERATIONS =====

  /**
   * Create a new todo
   */
  async createTodo(data: CreateTodoData): Promise<{
    success: boolean;
    todo?: any;
    error?: string;
  }> {
    try {
      if (!data.title || data.title.trim().length === 0) {
        throw new ValidationError('Todo title is required');
      }

      // Verify list exists and belongs to user
      await this.todoListModel.findByIdOrFail(data.list_id, data.user_id);

      const todo = await this.todoModel.create(data);

      this.logger.info('Todo created', { todoId: todo.id, userId: data.user_id });

      return { success: true, todo };
    } catch (error: any) {
      this.logger.error('Create todo failed', error, { userId: data.user_id });

      return {
        success: false,
        error: error.message || 'Failed to create todo',
      };
    }
  }

  /**
   * Get todos for a list
   */
  async getTodos(
    listId: string,
    userId: string,
    completedOnly?: boolean,
    activeOnly?: boolean
  ): Promise<any[]> {
    return this.todoModel.findByListId(listId, userId, {
      completedOnly,
      activeOnly,
    });
  }

  /**
   * Get a single todo
   */
  async getTodo(todoId: string, userId: string): Promise<{
    success: boolean;
    todo?: any;
    error?: string;
  }> {
    try {
      const todo = await this.todoModel.findByIdOrFail(todoId, userId);

      return { success: true, todo };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Todo not found',
      };
    }
  }

  /**
   * Update a todo
   */
  async updateTodo(
    todoId: string,
    userId: string,
    data: UpdateTodoData
  ): Promise<{
    success: boolean;
    todo?: any;
    error?: string;
  }> {
    try {
      const todo = await this.todoModel.update(todoId, userId, data);

      this.logger.info('Todo updated', { todoId, userId });

      return { success: true, todo };
    } catch (error: any) {
      this.logger.error('Update todo failed', error, { todoId, userId });

      return {
        success: false,
        error: error.message || 'Failed to update todo',
      };
    }
  }

  /**
   * Delete a todo
   */
  async deleteTodo(todoId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.todoModel.delete(todoId, userId);

      this.logger.info('Todo deleted', { todoId, userId });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Delete todo failed', error, { todoId, userId });

      return {
        success: false,
        error: error.message || 'Failed to delete todo',
      };
    }
  }

  /**
   * Toggle todo completion status
   */
  async toggleTodo(todoId: string, userId: string): Promise<{
    success: boolean;
    todo?: any;
    error?: string;
  }> {
    try {
      const todo = await this.todoModel.toggle(todoId, userId);

      this.logger.info('Todo toggled', {
        todoId,
        userId,
        completed: todo.completed,
      });

      return { success: true, todo };
    } catch (error: any) {
      this.logger.error('Toggle todo failed', error, { todoId, userId });

      return {
        success: false,
        error: error.message || 'Failed to toggle todo',
      };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    completed: number;
    active: number;
    overdue: number;
  }> {
    return this.todoModel.getStats(userId);
  }

  /**
   * Get overdue todos
   */
  async getOverdueTodos(userId: string): Promise<any[]> {
    return this.todoModel.findOverdue(userId);
  }

  /**
   * Get todos due today
   */
  async getTodosDueToday(userId: string): Promise<any[]> {
    return this.todoModel.findDueToday(userId);
  }
}
