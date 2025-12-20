import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { Logger, ErrorHandler } from '@jam/base-app';
import { FundflowController } from '../../controllers/fundflow.controller';

/**
 * gRPC Fundflow Service Handlers
 *
 * Implements all RPC methods defined in fundflow.proto
 */

export class FundflowHandlers {
  private controller: FundflowController;
  private logger: Logger;

  constructor(controller: FundflowController) {
    this.controller = controller;
    this.logger = Logger.getInstance();
  }

  // ===== TRANSACTION HANDLERS =====

  createTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, category_id, type, amount, currency, description, transaction_date, notes } = call.request;

      const result = await this.controller.createTransaction({
        user_id,
        category_id,
        type,
        amount,
        currency,
        description,
        transaction_date,
        notes,
      });

      callback(null, {
        success: result.success,
        transaction: result.transaction || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC CreateTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  getTransactions = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, category_id, type, start_date, end_date, limit, offset } = call.request;

      const transactions = await this.controller.getTransactions(
        user_id,
        category_id,
        type,
        start_date,
        end_date,
        limit,
        offset
      );

      callback(null, {
        transactions,
        total_count: transactions.length,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetTransactions error', error);
      callback(null, {
        transactions: [],
        total_count: 0,
        error: error.message || 'Failed to get transactions',
      });
    }
  };

  getTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { transaction_id, user_id } = call.request;

      const result = await this.controller.getTransaction(transaction_id, user_id);

      callback(null, {
        success: result.success,
        transaction: result.transaction || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  updateTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { transaction_id, user_id, category_id, type, amount, currency, description, transaction_date, notes } = call.request;

      const result = await this.controller.updateTransaction(transaction_id, user_id, {
        category_id,
        type,
        amount,
        currency,
        description,
        transaction_date,
        notes,
      });

      callback(null, {
        success: result.success,
        transaction: result.transaction || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC UpdateTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  deleteTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { transaction_id, user_id } = call.request;

      const result = await this.controller.deleteTransaction(transaction_id, user_id);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC DeleteTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  // ===== CATEGORY HANDLERS =====

  createCategory = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, name, type, color, icon } = call.request;

      const result = await this.controller.createCategory({
        user_id,
        name,
        type,
        color,
        icon,
      });

      callback(null, {
        success: result.success,
        category: result.category || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC CreateCategory error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  getCategories = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, type } = call.request;

      const categories = await this.controller.getCategories(user_id, type);

      callback(null, {
        categories,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetCategories error', error);
      callback(null, {
        categories: [],
        error: error.message || 'Failed to get categories',
      });
    }
  };

  updateCategory = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { category_id, user_id, name, color, icon } = call.request;

      const result = await this.controller.updateCategory(category_id, user_id, {
        name,
        color,
        icon,
      });

      callback(null, {
        success: result.success,
        category: result.category || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC UpdateCategory error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  deleteCategory = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { category_id, user_id } = call.request;

      const result = await this.controller.deleteCategory(category_id, user_id);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC DeleteCategory error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  // ===== RECURRING TRANSACTION HANDLERS =====

  createRecurringTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const {
        user_id, category_id, type, amount, currency, description,
        frequency, start_date, end_date, day_of_month, day_of_week,
        auto_create, reminder_days_before
      } = call.request;

      const result = await this.controller.createRecurringTransaction({
        user_id,
        category_id,
        type,
        amount,
        currency,
        description,
        frequency,
        start_date,
        end_date,
        day_of_month,
        day_of_week,
        auto_create,
        reminder_days_before,
      });

      callback(null, {
        success: result.success,
        recurring_transaction: result.recurringTransaction || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC CreateRecurringTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  getRecurringTransactions = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, type, active_only } = call.request;

      const transactions = await this.controller.getRecurringTransactions(
        user_id,
        type,
        active_only
      );

      callback(null, {
        recurring_transactions: transactions,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetRecurringTransactions error', error);
      callback(null, {
        recurring_transactions: [],
        error: error.message || 'Failed to get recurring transactions',
      });
    }
  };

  getRecurringTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { recurring_id, user_id } = call.request;

      const result = await this.controller.getRecurringTransaction(recurring_id, user_id);

      callback(null, {
        success: result.success,
        recurring_transaction: result.recurringTransaction || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetRecurringTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  updateRecurringTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const {
        recurring_id, user_id, category_id, type, amount, currency,
        description, frequency, start_date, end_date, day_of_month,
        day_of_week, auto_create, reminder_days_before, is_active
      } = call.request;

      const result = await this.controller.updateRecurringTransaction(recurring_id, user_id, {
        category_id,
        type,
        amount,
        currency,
        description,
        frequency,
        start_date,
        end_date,
        day_of_month,
        day_of_week,
        auto_create,
        reminder_days_before,
        is_active,
      });

      callback(null, {
        success: result.success,
        recurring_transaction: result.recurringTransaction || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC UpdateRecurringTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  deleteRecurringTransaction = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { recurring_id, user_id } = call.request;

      const result = await this.controller.deleteRecurringTransaction(recurring_id, user_id);

      callback(null, {
        success: result.success,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC DeleteRecurringTransaction error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  processRecurringTransactions = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id } = call.request;

      const result = await this.controller.processRecurringTransactions(user_id);

      callback(null, {
        success: result.success,
        processed_count: result.processedCount || 0,
        created_count: result.createdCount || 0,
        reminder_count: result.reminderCount || 0,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC ProcessRecurringTransactions error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  // ===== ANALYTICS HANDLERS =====

  getStatistics = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, start_date, end_date, currency } = call.request;

      const result = await this.controller.getStatistics(
        user_id,
        start_date,
        end_date,
        currency
      );

      callback(null, {
        success: result.success,
        statistics: result.statistics || null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetStatistics error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  getCategoryBreakdown = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, type, start_date, end_date, currency } = call.request;

      const result = await this.controller.getCategoryBreakdown(
        user_id,
        type,
        start_date,
        end_date,
        currency
      );

      callback(null, {
        success: result.success,
        breakdown: result.breakdown || [],
        total_amount: result.totalAmount || 0,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetCategoryBreakdown error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  getMonthlyTrends = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      // TODO: Implement monthly trends calculation
      callback(null, {
        success: true,
        trends: [],
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetMonthlyTrends error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };

  // ===== REMINDER HANDLERS =====

  getReminders = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { user_id, unread_only } = call.request;

      const reminders = await this.controller.getReminders(user_id, unread_only);

      callback(null, {
        reminders,
        error: '',
      });
    } catch (error: any) {
      this.logger.error('gRPC GetReminders error', error);
      callback(null, {
        reminders: [],
        error: error.message || 'Failed to get reminders',
      });
    }
  };

  dismissReminder = async (
    call: ServerUnaryCall<any, any>,
    callback: sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { reminder_id, user_id } = call.request;

      const result = await this.controller.dismissReminder(reminder_id, user_id);

      callback(null, {
        success: result.success,
        reminder: null,
        error: result.error || '',
      });
    } catch (error: any) {
      this.logger.error('gRPC DismissReminder error', error);
      callback(null, ErrorHandler.handleGrpcError(error));
    }
  };
}
