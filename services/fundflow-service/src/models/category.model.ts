import { DatabaseAdapter } from '@jam/database-engine';
import { NotFoundError, ConflictError } from '@jam/base-app';

/**
 * Transaction Category Model
 *
 * Handles category data operations
 */

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
  icon?: string;
}

export class CategoryModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'transaction_categories';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new category
   */
  async create(data: CreateCategoryData): Promise<Category> {
    // Check for duplicate name in same type
    const existing = await this.findByName(data.user_id, data.name, data.type);
    if (existing) {
      throw new ConflictError(`Category '${data.name}' already exists for ${data.type}`);
    }

    const result = await this.db.table(this.tableName).insert({
      user_id: data.user_id,
      name: data.name,
      type: data.type,
      color: data.color,
      icon: data.icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.id) {
      return this.findById(result.id, data.user_id);
    }

    // Fallback
    const category = await this.findByName(data.user_id, data.name, data.type);
    if (!category) {
      throw new Error('Failed to create category');
    }

    return category;
  }

  /**
   * Find category by ID
   */
  async findById(id: string, userId: string): Promise<Category | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .first<Category>();

    return result;
  }

  /**
   * Find category by ID or throw error
   */
  async findByIdOrFail(id: string, userId: string): Promise<Category> {
    const category = await this.findById(id, userId);
    if (!category) {
      throw new NotFoundError('Category', id);
    }
    return category;
  }

  /**
   * Find category by name
   */
  async findByName(
    userId: string,
    name: string,
    type: 'income' | 'expense'
  ): Promise<Category | null> {
    const result = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('name', '=', name)
      .where('type', '=', type)
      .first<Category>();

    return result;
  }

  /**
   * Get all categories for a user
   */
  async findByUserId(
    userId: string,
    type?: 'income' | 'expense'
  ): Promise<Category[]> {
    let query = this.db
      .table(this.tableName)
      .where('user_id', '=', userId);

    if (type) {
      query = query.where('type', '=', type);
    }

    const categories = await query
      .orderBy('name', 'ASC')
      .get<Category>();

    return categories;
  }

  /**
   * Update category
   */
  async update(
    id: string,
    userId: string,
    data: UpdateCategoryData
  ): Promise<Category> {
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

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .update(updateData);

    return this.findByIdOrFail(id, userId);
  }

  /**
   * Delete category
   */
  async delete(id: string, userId: string): Promise<void> {
    // Note: Check if category is in use before deleting
    const transactionCount = await this.getTransactionCount(id);
    if (transactionCount > 0) {
      throw new ConflictError(
        `Cannot delete category with ${transactionCount} transactions. Delete transactions first.`
      );
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .delete();
  }

  /**
   * Get transaction count for category
   */
  private async getTransactionCount(categoryId: string): Promise<number> {
    const result = await this.db
      .table('transactions')
      .where('category_id', '=', categoryId)
      .count();

    return result[0]?.count || 0;
  }

  /**
   * Get default categories for a new user
   */
  static getDefaultCategories(): Omit<CreateCategoryData, 'user_id'>[] {
    return [
      // Income categories
      { name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase' },
      { name: 'Freelance', type: 'income', color: '#14B8A6', icon: 'code' },
      { name: 'Investment', type: 'income', color: '#06B6D4', icon: 'trending-up' },
      { name: 'Other Income', type: 'income', color: '#8B5CF6', icon: 'plus' },

      // Expense categories
      { name: 'Food', type: 'expense', color: '#EF4444', icon: 'utensils' },
      { name: 'Transport', type: 'expense', color: '#F59E0B', icon: 'car' },
      { name: 'Shopping', type: 'expense', color: '#EC4899', icon: 'shopping-bag' },
      { name: 'Bills', type: 'expense', color: '#6366F1', icon: 'receipt' },
      { name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: 'film' },
      { name: 'Health', type: 'expense', color: '#10B981', icon: 'heart' },
      { name: 'Education', type: 'expense', color: '#3B82F6', icon: 'book' },
      { name: 'Other Expense', type: 'expense', color: '#6B7280', icon: 'minus' },
    ];
  }
}
