import { DatabaseAdapter } from '@jam/database-engine';
import { NotFoundError } from '@jam/base-app';

/**
 * Transaction Model
 *
 * Handles transaction data operations
 */

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: any; // Category details
}

export interface CreateTransactionData {
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  transaction_date: string;
  notes?: string;
}

export interface UpdateTransactionData {
  category_id?: string;
  type?: 'income' | 'expense';
  amount?: number;
  currency?: string;
  description?: string;
  transaction_date?: string;
  notes?: string;
}

export class TransactionModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'transactions';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new transaction
   */
  async create(data: CreateTransactionData): Promise<Transaction> {
    const result = await this.db.table(this.tableName).insert({
      user_id: data.user_id,
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      transaction_date: data.transaction_date,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.id) {
      return this.findById(result.id, data.user_id);
    }

    throw new Error('Failed to create transaction');
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string, userId: string): Promise<Transaction | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .first<Transaction>();

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
   * Find transaction by ID or throw error
   */
  async findByIdOrFail(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.findById(id, userId);
    if (!transaction) {
      throw new NotFoundError('Transaction', id);
    }
    return transaction;
  }

  /**
   * Get transactions with filters
   */
  async findByUserId(
    userId: string,
    options?: {
      categoryId?: string;
      type?: 'income' | 'expense';
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Transaction[]> {
    let query = this.db
      .table(this.tableName)
      .where('user_id', '=', userId);

    if (options?.categoryId) {
      query = query.where('category_id', '=', options.categoryId);
    }

    if (options?.type) {
      query = query.where('type', '=', options.type);
    }

    if (options?.startDate) {
      query = query.where('transaction_date', '>=', options.startDate);
    }

    if (options?.endDate) {
      query = query.where('transaction_date', '<=', options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const transactions = await query
      .orderBy('transaction_date', 'DESC')
      .get<Transaction>();

    // Load category details for each transaction
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
   * Update transaction
   */
  async update(
    id: string,
    userId: string,
    data: UpdateTransactionData
  ): Promise<Transaction> {
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

    if (data.transaction_date !== undefined) {
      updateData.transaction_date = data.transaction_date;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .update(updateData);

    return this.findByIdOrFail(id, userId);
  }

  /**
   * Delete transaction
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .delete();
  }

  /**
   * Get statistics for a date range
   */
  async getStatistics(
    userId: string,
    startDate: string,
    endDate: string,
    currency: string = 'USD'
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    transactionCount: number;
    averageTransaction: number;
  }> {
    // Get income total
    const incomeResult = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('type', '=', 'income')
      .where('currency', '=', currency)
      .where('transaction_date', '>=', startDate)
      .where('transaction_date', '<=', endDate)
      .sum('amount');

    const totalIncome = incomeResult[0]?.sum || 0;

    // Get expense total
    const expenseResult = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('type', '=', 'expense')
      .where('currency', '=', currency)
      .where('transaction_date', '>=', startDate)
      .where('transaction_date', '<=', endDate)
      .sum('amount');

    const totalExpenses = expenseResult[0]?.sum || 0;

    // Get transaction count
    const countResult = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('currency', '=', currency)
      .where('transaction_date', '>=', startDate)
      .where('transaction_date', '<=', endDate)
      .count();

    const transactionCount = countResult[0]?.count || 0;

    const netBalance = totalIncome - totalExpenses;
    const averageTransaction = transactionCount > 0
      ? (totalIncome + totalExpenses) / transactionCount
      : 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount,
      averageTransaction,
    };
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(
    userId: string,
    type: 'income' | 'expense',
    startDate: string,
    endDate: string,
    currency: string = 'USD'
  ): Promise<Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>> {
    // This would ideally use GROUP BY, but for database abstraction compatibility,
    // we'll fetch and process in application code
    const transactions = await this.findByUserId(userId, {
      type,
      startDate,
      endDate,
    });

    const filteredTransactions = transactions.filter(t => t.currency === currency);

    // Group by category
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      amount: number;
      transactionCount: number;
    }>();

    let totalAmount = 0;

    for (const transaction of filteredTransactions) {
      const categoryId = transaction.category_id;
      const categoryName = transaction.category?.name || 'Unknown';

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          amount: 0,
          transactionCount: 0,
        });
      }

      const category = categoryMap.get(categoryId)!;
      category.amount += transaction.amount;
      category.transactionCount += 1;
      totalAmount += transaction.amount;
    }

    // Calculate percentages
    const breakdown = Array.from(categoryMap.values()).map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    }));

    // Sort by amount descending
    breakdown.sort((a, b) => b.amount - a.amount);

    return breakdown;
  }
}
