import { DatabaseAdapter } from '@jam/database-engine';

/**
 * Transaction Reminder Model
 *
 * Handles reminder data operations for recurring transactions
 */

export interface Reminder {
  id: string;
  user_id: string;
  recurring_transaction_id: string;
  reminder_date: string;
  message: string;
  is_read: boolean;
  created_at: string;
  recurring_transaction?: any;
}

export interface CreateReminderData {
  user_id: string;
  recurring_transaction_id: string;
  reminder_date: string;
  message: string;
}

export class ReminderModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'transaction_reminders';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new reminder
   */
  async create(data: CreateReminderData): Promise<Reminder> {
    // Check if reminder already exists for this date
    const existing = await this.findByRecurringTransaction(
      data.recurring_transaction_id,
      data.reminder_date
    );

    if (existing) {
      return existing; // Don't create duplicate
    }

    const result = await this.db.table(this.tableName).insert({
      user_id: data.user_id,
      recurring_transaction_id: data.recurring_transaction_id,
      reminder_date: data.reminder_date,
      message: data.message,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (result.id) {
      return this.findById(result.id);
    }

    throw new Error('Failed to create reminder');
  }

  /**
   * Find reminder by ID
   */
  async findById(id: string): Promise<Reminder | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .first<Reminder>();

    if (result) {
      // Load recurring transaction details
      const recurringTransaction = await this.db
        .table('recurring_transactions')
        .where('id', '=', result.recurring_transaction_id)
        .first();

      result.recurring_transaction = recurringTransaction;
    }

    return result;
  }

  /**
   * Find reminder by recurring transaction and date
   */
  async findByRecurringTransaction(
    recurringTransactionId: string,
    reminderDate: string
  ): Promise<Reminder | null> {
    const result = await this.db
      .table(this.tableName)
      .where('recurring_transaction_id', '=', recurringTransactionId)
      .where('reminder_date', '=', reminderDate)
      .first<Reminder>();

    return result;
  }

  /**
   * Get all reminders for a user
   */
  async findByUserId(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Reminder[]> {
    let query = this.db
      .table(this.tableName)
      .where('user_id', '=', userId);

    if (unreadOnly) {
      query = query.where('is_read', '=', false);
    }

    const reminders = await query
      .orderBy('reminder_date', 'ASC')
      .get<Reminder>();

    // Load recurring transaction details
    for (const reminder of reminders) {
      const recurringTransaction = await this.db
        .table('recurring_transactions')
        .where('id', '=', reminder.recurring_transaction_id)
        .first();

      reminder.recurring_transaction = recurringTransaction;
    }

    return reminders;
  }

  /**
   * Mark reminder as read
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .update({
        is_read: true,
      });
  }

  /**
   * Delete reminder
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .delete();
  }

  /**
   * Delete old read reminders
   */
  async deleteOldReminders(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.db
      .table(this.tableName)
      .where('is_read', '=', true)
      .where('created_at', '<', cutoffDate.toISOString())
      .delete();

    return result;
  }

  /**
   * Get unread reminder count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('is_read', '=', false)
      .count();

    return result[0]?.count || 0;
  }
}
