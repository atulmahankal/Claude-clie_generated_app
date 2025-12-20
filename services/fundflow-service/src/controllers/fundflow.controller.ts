import { DatabaseAdapter } from '@jam/database-engine';
import { Logger, ValidationError } from '@jam/base-app';
import { CategoryModel, CreateCategoryData, UpdateCategoryData } from '../models/category.model';
import { TransactionModel, CreateTransactionData, UpdateTransactionData } from '../models/transaction.model';
import { RecurringTransactionModel, CreateRecurringTransactionData, UpdateRecurringTransactionData } from '../models/recurring-transaction.model';
import { ReminderModel, CreateReminderData } from '../models/reminder.model';

/**
 * Fundflow Controller
 *
 * Handles all financial tracking business logic
 */

export class FundflowController {
  private categoryModel: CategoryModel;
  private transactionModel: TransactionModel;
  private recurringTransactionModel: RecurringTransactionModel;
  private reminderModel: ReminderModel;
  private logger: Logger;

  constructor(db: DatabaseAdapter) {
    this.categoryModel = new CategoryModel(db);
    this.transactionModel = new TransactionModel(db);
    this.recurringTransactionModel = new RecurringTransactionModel(db);
    this.reminderModel = new ReminderModel(db);
    this.logger = Logger.getInstance();
  }

  // ===== CATEGORY OPERATIONS =====

  async createCategory(data: CreateCategoryData): Promise<{
    success: boolean;
    category?: any;
    error?: string;
  }> {
    try {
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Category name is required');
      }

      const category = await this.categoryModel.create(data);

      this.logger.info('Category created', { categoryId: category.id, userId: data.user_id });

      return { success: true, category };
    } catch (error: any) {
      this.logger.error('Create category failed', error, { userId: data.user_id });
      return {
        success: false,
        error: error.message || 'Failed to create category',
      };
    }
  }

  async getCategories(userId: string, type?: 'income' | 'expense'): Promise<any[]> {
    return this.categoryModel.findByUserId(userId, type);
  }

  async updateCategory(
    categoryId: string,
    userId: string,
    data: UpdateCategoryData
  ): Promise<{
    success: boolean;
    category?: any;
    error?: string;
  }> {
    try {
      const category = await this.categoryModel.update(categoryId, userId, data);

      this.logger.info('Category updated', { categoryId, userId });

      return { success: true, category };
    } catch (error: any) {
      this.logger.error('Update category failed', error, { categoryId, userId });
      return {
        success: false,
        error: error.message || 'Failed to update category',
      };
    }
  }

  async deleteCategory(categoryId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.categoryModel.delete(categoryId, userId);

      this.logger.info('Category deleted', { categoryId, userId });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Delete category failed', error, { categoryId, userId });
      return {
        success: false,
        error: error.message || 'Failed to delete category',
      };
    }
  }

  // ===== TRANSACTION OPERATIONS =====

  async createTransaction(data: CreateTransactionData): Promise<{
    success: boolean;
    transaction?: any;
    error?: string;
  }> {
    try {
      if (!data.description || data.description.trim().length === 0) {
        throw new ValidationError('Transaction description is required');
      }

      if (data.amount <= 0) {
        throw new ValidationError('Amount must be greater than 0');
      }

      const transaction = await this.transactionModel.create(data);

      this.logger.info('Transaction created', {
        transactionId: transaction.id,
        userId: data.user_id,
        amount: data.amount,
        type: data.type,
      });

      return { success: true, transaction };
    } catch (error: any) {
      this.logger.error('Create transaction failed', error, { userId: data.user_id });
      return {
        success: false,
        error: error.message || 'Failed to create transaction',
      };
    }
  }

  async getTransactions(
    userId: string,
    categoryId?: string,
    type?: 'income' | 'expense',
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number
  ): Promise<any[]> {
    return this.transactionModel.findByUserId(userId, {
      categoryId,
      type,
      startDate,
      endDate,
      limit,
      offset,
    });
  }

  async getTransaction(transactionId: string, userId: string): Promise<{
    success: boolean;
    transaction?: any;
    error?: string;
  }> {
    try {
      const transaction = await this.transactionModel.findByIdOrFail(transactionId, userId);

      return { success: true, transaction };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction not found',
      };
    }
  }

  async updateTransaction(
    transactionId: string,
    userId: string,
    data: UpdateTransactionData
  ): Promise<{
    success: boolean;
    transaction?: any;
    error?: string;
  }> {
    try {
      const transaction = await this.transactionModel.update(transactionId, userId, data);

      this.logger.info('Transaction updated', { transactionId, userId });

      return { success: true, transaction };
    } catch (error: any) {
      this.logger.error('Update transaction failed', error, { transactionId, userId });
      return {
        success: false,
        error: error.message || 'Failed to update transaction',
      };
    }
  }

  async deleteTransaction(transactionId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.transactionModel.delete(transactionId, userId);

      this.logger.info('Transaction deleted', { transactionId, userId });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Delete transaction failed', error, { transactionId, userId });
      return {
        success: false,
        error: error.message || 'Failed to delete transaction',
      };
    }
  }

  // ===== RECURRING TRANSACTION OPERATIONS =====

  async createRecurringTransaction(data: CreateRecurringTransactionData): Promise<{
    success: boolean;
    recurringTransaction?: any;
    error?: string;
  }> {
    try {
      const transaction = await this.recurringTransactionModel.create(data);

      this.logger.info('Recurring transaction created', {
        recurringId: transaction.id,
        userId: data.user_id,
      });

      return { success: true, recurringTransaction: transaction };
    } catch (error: any) {
      this.logger.error('Create recurring transaction failed', error, { userId: data.user_id });
      return {
        success: false,
        error: error.message || 'Failed to create recurring transaction',
      };
    }
  }

  async getRecurringTransactions(
    userId: string,
    type?: 'income' | 'expense',
    activeOnly?: boolean
  ): Promise<any[]> {
    return this.recurringTransactionModel.findByUserId(userId, {
      type,
      activeOnly,
    });
  }

  async getRecurringTransaction(recurringId: string, userId: string): Promise<{
    success: boolean;
    recurringTransaction?: any;
    error?: string;
  }> {
    try {
      const transaction = await this.recurringTransactionModel.findByIdOrFail(recurringId, userId);

      return { success: true, recurringTransaction: transaction };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Recurring transaction not found',
      };
    }
  }

  async updateRecurringTransaction(
    recurringId: string,
    userId: string,
    data: UpdateRecurringTransactionData
  ): Promise<{
    success: boolean;
    recurringTransaction?: any;
    error?: string;
  }> {
    try {
      const transaction = await this.recurringTransactionModel.update(recurringId, userId, data);

      this.logger.info('Recurring transaction updated', { recurringId, userId });

      return { success: true, recurringTransaction: transaction };
    } catch (error: any) {
      this.logger.error('Update recurring transaction failed', error, { recurringId, userId });
      return {
        success: false,
        error: error.message || 'Failed to update recurring transaction',
      };
    }
  }

  async deleteRecurringTransaction(recurringId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.recurringTransactionModel.delete(recurringId, userId);

      this.logger.info('Recurring transaction deleted', { recurringId, userId });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Delete recurring transaction failed', error, { recurringId, userId });
      return {
        success: false,
        error: error.message || 'Failed to delete recurring transaction',
      };
    }
  }

  /**
   * Process recurring transactions (creates actual transactions from recurring templates)
   */
  async processRecurringTransactions(userId?: string): Promise<{
    success: boolean;
    processedCount?: number;
    createdCount?: number;
    reminderCount?: number;
    error?: string;
  }> {
    try {
      const dueTransactions = await this.recurringTransactionModel.findDueForProcessing(userId);

      let processedCount = 0;
      let createdCount = 0;
      let reminderCount = 0;

      for (const recurring of dueTransactions) {
        // Create actual transaction if auto_create is enabled
        if (recurring.auto_create) {
          await this.transactionModel.create({
            user_id: recurring.user_id,
            category_id: recurring.category_id,
            type: recurring.type,
            amount: recurring.amount,
            currency: recurring.currency,
            description: `${recurring.description} (Auto-created)`,
            transaction_date: recurring.next_occurrence_date,
          });

          createdCount++;
        }

        // Create reminder if not auto-creating
        if (!recurring.auto_create || recurring.reminder_days_before > 0) {
          const reminderDate = new Date(recurring.next_occurrence_date);
          reminderDate.setDate(reminderDate.getDate() - recurring.reminder_days_before);

          await this.reminderModel.create({
            user_id: recurring.user_id,
            recurring_transaction_id: recurring.id,
            reminder_date: reminderDate.toISOString(),
            message: `Upcoming ${recurring.type}: ${recurring.description} - ${recurring.amount} ${recurring.currency}`,
          });

          reminderCount++;
        }

        // Mark as processed and calculate next occurrence
        await this.recurringTransactionModel.markAsProcessed(recurring.id);
        processedCount++;
      }

      this.logger.info('Recurring transactions processed', {
        processedCount,
        createdCount,
        reminderCount,
      });

      return {
        success: true,
        processedCount,
        createdCount,
        reminderCount,
      };
    } catch (error: any) {
      this.logger.error('Process recurring transactions failed', error);
      return {
        success: false,
        error: error.message || 'Failed to process recurring transactions',
      };
    }
  }

  // ===== ANALYTICS OPERATIONS =====

  async getStatistics(
    userId: string,
    startDate: string,
    endDate: string,
    currency: string = 'USD'
  ): Promise<{
    success: boolean;
    statistics?: any;
    error?: string;
  }> {
    try {
      const stats = await this.transactionModel.getStatistics(
        userId,
        startDate,
        endDate,
        currency
      );

      return {
        success: true,
        statistics: {
          ...stats,
          currency,
          period_start: startDate,
          period_end: endDate,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get statistics',
      };
    }
  }

  async getCategoryBreakdown(
    userId: string,
    type: 'income' | 'expense',
    startDate: string,
    endDate: string,
    currency: string = 'USD'
  ): Promise<{
    success: boolean;
    breakdown?: any[];
    totalAmount?: number;
    error?: string;
  }> {
    try {
      const breakdown = await this.transactionModel.getCategoryBreakdown(
        userId,
        type,
        startDate,
        endDate,
        currency
      );

      const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

      return {
        success: true,
        breakdown,
        totalAmount,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get category breakdown',
      };
    }
  }

  // ===== REMINDER OPERATIONS =====

  async getReminders(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    return this.reminderModel.findByUserId(userId, unreadOnly);
  }

  async dismissReminder(reminderId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.reminderModel.markAsRead(reminderId, userId);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to dismiss reminder',
      };
    }
  }
}
