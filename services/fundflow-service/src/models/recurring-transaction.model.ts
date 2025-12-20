import { DatabaseAdapter } from '@jam/database-engine';
import { NotFoundError } from '@jam/base-app';

/**
 * Recurring Transaction Model
 *
 * Handles recurring transaction data operations
 */

export interface RecurringTransaction {
  id: string;
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  last_processed_date: string | null;
  next_occurrence_date: string;
  day_of_month: number | null;
  day_of_week: number | null;
  auto_create: boolean;
  reminder_days_before: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: any;
}

export interface CreateRecurringTransactionData {
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  auto_create?: boolean;
  reminder_days_before?: number;
}

export interface UpdateRecurringTransactionData {
  category_id?: string;
  type?: 'income' | 'expense';
  amount?: number;
  currency?: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  auto_create?: boolean;
  reminder_days_before?: number;
  is_active?: boolean;
}

export class RecurringTransactionModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'recurring_transactions';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new recurring transaction
   */
  async create(data: CreateRecurringTransactionData): Promise<RecurringTransaction> {
    const nextOccurrence = this.calculateNextOccurrence(
      data.start_date,
      data.frequency,
      data.day_of_month,
      data.day_of_week
    );

    const result = await this.db.table(this.tableName).insert({
      user_id: data.user_id,
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      frequency: data.frequency,
      start_date: data.start_date,
      end_date: data.end_date || null,
      last_processed_date: null,
      next_occurrence_date: nextOccurrence,
      day_of_month: data.day_of_month || null,
      day_of_week: data.day_of_week || null,
      auto_create: data.auto_create ?? true,
      reminder_days_before: data.reminder_days_before || 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.id) {
      return this.findById(result.id, data.user_id);
    }

    throw new Error('Failed to create recurring transaction');
  }

  /**
   * Find recurring transaction by ID
   */
  async findById(id: string, userId: string): Promise<RecurringTransaction | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .first<RecurringTransaction>();

    if (result) {
      // Load category details
      const category = await this.db
        .table('transaction_categories')
        .where('id', '=', result.category_id)
        .first();

      result.category = category;
    }

    return result;
  }

  /**
   * Find recurring transaction by ID or throw error
   */
  async findByIdOrFail(id: string, userId: string): Promise<RecurringTransaction> {
    const transaction = await this.findById(id, userId);
    if (!transaction) {
      throw new NotFoundError('Recurring transaction', id);
    }
    return transaction;
  }

  /**
   * Get all recurring transactions for a user
   */
  async findByUserId(
    userId: string,
    options?: {
      type?: 'income' | 'expense';
      activeOnly?: boolean;
    }
  ): Promise<RecurringTransaction[]> {
    let query = this.db
      .table(this.tableName)
      .where('user_id', '=', userId);

    if (options?.type) {
      query = query.where('type', '=', options.type);
    }

    if (options?.activeOnly) {
      query = query.where('is_active', '=', true);
    }

    const transactions = await query
      .orderBy('next_occurrence_date', 'ASC')
      .get<RecurringTransaction>();

    // Load category details
    for (const transaction of transactions) {
      const category = await this.db
        .table('transaction_categories')
        .where('id', '=', transaction.category_id)
        .first();

      transaction.category = category;
    }

    return transactions;
  }

  /**
   * Get recurring transactions due for processing
   */
  async findDueForProcessing(userId?: string): Promise<RecurringTransaction[]> {
    const now = new Date().toISOString();

    let query = this.db
      .table(this.tableName)
      .where('is_active', '=', true)
      .where('next_occurrence_date', '<=', now);

    if (userId) {
      query = query.where('user_id', '=', userId);
    }

    const transactions = await query.get<RecurringTransaction>();

    // Load category details
    for (const transaction of transactions) {
      const category = await this.db
        .table('transaction_categories')
        .where('id', '=', transaction.category_id)
        .first();

      transaction.category = category;
    }

    return transactions;
  }

  /**
   * Update recurring transaction
   */
  async update(
    id: string,
    userId: string,
    data: UpdateRecurringTransactionData
  ): Promise<RecurringTransaction> {
    const existing = await this.findByIdOrFail(id, userId);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.category_id !== undefined) {
      updateData.category_id = data.category_id;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }

    if (data.currency !== undefined) {
      updateData.currency = data.currency;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.frequency !== undefined) {
      updateData.frequency = data.frequency;
    }

    if (data.start_date !== undefined) {
      updateData.start_date = data.start_date;
    }

    if (data.end_date !== undefined) {
      updateData.end_date = data.end_date;
    }

    if (data.day_of_month !== undefined) {
      updateData.day_of_month = data.day_of_month;
    }

    if (data.day_of_week !== undefined) {
      updateData.day_of_week = data.day_of_week;
    }

    if (data.auto_create !== undefined) {
      updateData.auto_create = data.auto_create;
    }

    if (data.reminder_days_before !== undefined) {
      updateData.reminder_days_before = data.reminder_days_before;
    }

    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active;
    }

    // Recalculate next occurrence if frequency or date changed
    if (data.frequency || data.start_date || data.day_of_month || data.day_of_week) {
      const nextOccurrence = this.calculateNextOccurrence(
        data.start_date || existing.start_date,
        data.frequency || existing.frequency,
        data.day_of_month ?? existing.day_of_month,
        data.day_of_week ?? existing.day_of_week
      );
      updateData.next_occurrence_date = nextOccurrence;
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .update(updateData);

    return this.findByIdOrFail(id, userId);
  }

  /**
   * Delete recurring transaction
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .delete();
  }

  /**
   * Mark as processed and calculate next occurrence
   */
  async markAsProcessed(id: string): Promise<void> {
    const transaction = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .first<RecurringTransaction>();

    if (!transaction) {
      return;
    }

    const now = new Date().toISOString();
    const nextOccurrence = this.calculateNextOccurrence(
      now,
      transaction.frequency,
      transaction.day_of_month,
      transaction.day_of_week
    );

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        last_processed_date: now,
        next_occurrence_date: nextOccurrence,
        updated_at: now,
      });
  }

  /**
   * Calculate next occurrence date
   */
  private calculateNextOccurrence(
    fromDate: string,
    frequency: string,
    dayOfMonth: number | null,
    dayOfWeek: number | null
  ): string {
    const date = new Date(fromDate);

    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;

      case 'weekly':
        date.setDate(date.getDate() + 7);
        // Adjust to specific day of week if provided
        if (dayOfWeek !== null) {
          const currentDay = date.getDay();
          const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
          date.setDate(date.getDate() + daysToAdd);
        }
        break;

      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        // Adjust to specific day of month if provided
        if (dayOfMonth !== null) {
          date.setDate(dayOfMonth);
        }
        break;

      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date.toISOString();
  }
}
