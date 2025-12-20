import { DatabaseAdapter } from '@jam/database-engine';
import { NotFoundError } from '@jam/base-app';

/**
 * Todo Model
 *
 * Handles todo item data operations
 */

export interface Todo {
  id: string;
  list_id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoData {
  list_id: string;
  user_id: string;
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: string;
}

export class TodoModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'todos';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new todo
   */
  async create(data: CreateTodoData): Promise<Todo> {
    const result = await this.db.table(this.tableName).insert({
      list_id: data.list_id,
      user_id: data.user_id,
      title: data.title,
      description: data.description || null,
      completed: false,
      priority: data.priority || 'medium',
      due_date: data.due_date || null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.id) {
      return this.findById(result.id, data.user_id);
    }

    // Fallback: query by user_id and title
    const todos = await this.findByListId(data.list_id, data.user_id);
    const todo = todos.find((t) => t.title === data.title);
    if (!todo) {
      throw new Error('Failed to create todo');
    }

    return todo;
  }

  /**
   * Find todo by ID
   */
  async findById(id: string, userId: string): Promise<Todo | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .first<Todo>();

    return result;
  }

  /**
   * Find todo by ID or throw error
   */
  async findByIdOrFail(id: string, userId: string): Promise<Todo> {
    const todo = await this.findById(id, userId);
    if (!todo) {
      throw new NotFoundError('Todo', id);
    }
    return todo;
  }

  /**
   * Get all todos for a list
   */
  async findByListId(
    listId: string,
    userId: string,
    options?: {
      completedOnly?: boolean;
      activeOnly?: boolean;
    }
  ): Promise<Todo[]> {
    let query = this.db
      .table(this.tableName)
      .where('list_id', '=', listId)
      .where('user_id', '=', userId);

    if (options?.completedOnly) {
      query = query.where('completed', '=', true);
    }

    if (options?.activeOnly) {
      query = query.where('completed', '=', false);
    }

    const todos = await query
      .orderBy('created_at', 'DESC')
      .get<Todo>();

    return todos;
  }

  /**
   * Get all todos for a user (across all lists)
   */
  async findByUserId(
    userId: string,
    options?: {
      completedOnly?: boolean;
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Todo[]> {
    let query = this.db
      .table(this.tableName)
      .where('user_id', '=', userId);

    if (options?.completedOnly) {
      query = query.where('completed', '=', true);
    }

    if (options?.activeOnly) {
      query = query.where('completed', '=', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const todos = await query
      .orderBy('created_at', 'DESC')
      .get<Todo>();

    return todos;
  }

  /**
   * Update todo
   */
  async update(id: string, userId: string, data: UpdateTodoData): Promise<Todo> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date;
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .update(updateData);

    return this.findByIdOrFail(id, userId);
  }

  /**
   * Toggle todo completion status
   */
  async toggle(id: string, userId: string): Promise<Todo> {
    const todo = await this.findByIdOrFail(id, userId);

    const updateData: any = {
      completed: !todo.completed,
      updated_at: new Date().toISOString(),
    };

    if (!todo.completed) {
      // Marking as completed
      updateData.completed_at = new Date().toISOString();
    } else {
      // Marking as incomplete
      updateData.completed_at = null;
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .update(updateData);

    return this.findByIdOrFail(id, userId);
  }

  /**
   * Delete todo
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .delete();
  }

  /**
   * Get todos by priority
   */
  async findByPriority(
    userId: string,
    priority: string
  ): Promise<Todo[]> {
    const todos = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('priority', '=', priority)
      .where('completed', '=', false)
      .orderBy('created_at', 'DESC')
      .get<Todo>();

    return todos;
  }

  /**
   * Get overdue todos
   */
  async findOverdue(userId: string): Promise<Todo[]> {
    const now = new Date().toISOString();

    const todos = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('completed', '=', false)
      .whereNotNull('due_date')
      .where('due_date', '<', now)
      .orderBy('due_date', 'ASC')
      .get<Todo>();

    return todos;
  }

  /**
   * Get todos due today
   */
  async findDueToday(userId: string): Promise<Todo[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todos = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('completed', '=', false)
      .whereNotNull('due_date')
      .where('due_date', '>=', today.toISOString())
      .where('due_date', '<', tomorrow.toISOString())
      .orderBy('due_date', 'ASC')
      .get<Todo>();

    return todos;
  }

  /**
   * Get completion statistics for a user
   */
  async getStats(userId: string): Promise<{
    total: number;
    completed: number;
    active: number;
    overdue: number;
  }> {
    const totalResult = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .count();

    const completedResult = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('completed', '=', true)
      .count();

    const activeResult = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('completed', '=', false)
      .count();

    const now = new Date().toISOString();
    const overdueResult = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('completed', '=', false)
      .whereNotNull('due_date')
      .where('due_date', '<', now)
      .count();

    return {
      total: totalResult[0]?.count || 0,
      completed: completedResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      overdue: overdueResult[0]?.count || 0,
    };
  }
}
