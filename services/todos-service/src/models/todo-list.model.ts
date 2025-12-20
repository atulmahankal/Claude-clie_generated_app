import { DatabaseAdapter } from '@jam/database-engine';
import { NotFoundError, ConflictError } from '@jam/base-app';

/**
 * Todo List Model
 *
 * Handles todo list data operations
 */

export interface TodoList {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  todo_count?: number;
  completed_count?: number;
}

export interface CreateTodoListData {
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order?: number;
}

export interface UpdateTodoListData {
  name?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

export class TodoListModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'todo_lists';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new todo list
   */
  async create(data: CreateTodoListData): Promise<TodoList> {
    // Get max sort order for user
    const maxSortOrder = await this.getMaxSortOrder(data.user_id);

    const result = await this.db.table(this.tableName).insert({
      user_id: data.user_id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      sort_order: data.sort_order ?? maxSortOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.id) {
      return this.findById(result.id, data.user_id);
    }

    // Fallback: query by user_id and name
    const lists = await this.findByUserId(data.user_id);
    const list = lists.find((l) => l.name === data.name);
    if (!list) {
      throw new Error('Failed to create todo list');
    }

    return list;
  }

  /**
   * Find todo list by ID
   */
  async findById(id: string, userId: string): Promise<TodoList | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .first<TodoList>();

    if (result) {
      // Get counts
      const counts = await this.getTodoCounts(id);
      result.todo_count = counts.total;
      result.completed_count = counts.completed;
    }

    return result;
  }

  /**
   * Find todo list by ID or throw error
   */
  async findByIdOrFail(id: string, userId: string): Promise<TodoList> {
    const list = await this.findById(id, userId);
    if (!list) {
      throw new NotFoundError('Todo list', id);
    }
    return list;
  }

  /**
   * Get all todo lists for a user
   */
  async findByUserId(userId: string): Promise<TodoList[]> {
    const lists = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .orderBy('sort_order', 'ASC')
      .get<TodoList>();

    // Get counts for each list
    for (const list of lists) {
      const counts = await this.getTodoCounts(list.id);
      list.todo_count = counts.total;
      list.completed_count = counts.completed;
    }

    return lists;
  }

  /**
   * Update todo list
   */
  async update(id: string, userId: string, data: UpdateTodoListData): Promise<TodoList> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.color !== undefined) {
      updateData.color = data.color;
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    if (data.sort_order !== undefined) {
      updateData.sort_order = data.sort_order;
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .update(updateData);

    return this.findByIdOrFail(id, userId);
  }

  /**
   * Delete todo list
   */
  async delete(id: string, userId: string): Promise<void> {
    // First delete all todos in the list
    await this.db
      .table('todos')
      .where('list_id', '=', id)
      .where('user_id', '=', userId)
      .delete();

    // Then delete the list
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .delete();
  }

  /**
   * Get todo counts for a list
   */
  private async getTodoCounts(listId: string): Promise<{
    total: number;
    completed: number;
  }> {
    const totalResult = await this.db
      .table('todos')
      .where('list_id', '=', listId)
      .count();

    const completedResult = await this.db
      .table('todos')
      .where('list_id', '=', listId)
      .where('completed', '=', true)
      .count();

    return {
      total: totalResult[0]?.count || 0,
      completed: completedResult[0]?.count || 0,
    };
  }

  /**
   * Get max sort order for user
   */
  private async getMaxSortOrder(userId: string): Promise<number> {
    const result = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .max('sort_order');

    return result[0]?.max || 0;
  }

  /**
   * Reorder lists
   */
  async reorder(userId: string, listIds: string[]): Promise<void> {
    // Update sort order for each list
    for (let i = 0; i < listIds.length; i++) {
      await this.db
        .table(this.tableName)
        .where('id', '=', listIds[i])
        .where('user_id', '=', userId)
        .update({
          sort_order: i,
          updated_at: new Date().toISOString(),
        });
    }
  }
}
