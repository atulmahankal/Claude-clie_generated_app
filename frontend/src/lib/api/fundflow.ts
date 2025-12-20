/**
 * Fundflow API Client
 *
 * Wrapper functions for fundflow (financial tracking) API endpoints
 */

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  is_active: boolean;
  reminder_enabled: boolean;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateTransactionData {
  category_id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string;
}

export interface UpdateTransactionData {
  category_id?: string;
  amount?: number;
  description?: string;
  date?: string;
}

export interface CreateRecurringTransactionData {
  category_id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  reminder_enabled?: boolean;
  reminder_days_before?: number;
}

export interface UpdateRecurringTransactionData {
  category_id?: string;
  amount?: number;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  reminder_enabled?: boolean;
  reminder_days_before?: number;
}

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  type?: 'income' | 'expense';
}

// ============= Categories =============

export async function getCategories(): Promise<Category[]> {
  const response = await fetch('/api/fundflow/categories', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  return data.categories || [];
}

export async function createCategory(data: CreateCategoryData): Promise<Category> {
  const response = await fetch('/api/fundflow/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create category');
  }

  const result = await response.json();
  return result.category;
}

export async function updateCategory(categoryId: string, data: UpdateCategoryData): Promise<Category> {
  const response = await fetch(`/api/fundflow/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update category');
  }

  const result = await response.json();
  return result.category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const response = await fetch(`/api/fundflow/categories/${categoryId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
}

// ============= Transactions =============

export async function getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const params = new URLSearchParams();

  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.type) params.append('type', filters.type);

  const url = `/api/fundflow/transactions${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  const data = await response.json();
  return data.transactions || [];
}

export async function createTransaction(data: CreateTransactionData): Promise<Transaction> {
  const response = await fetch('/api/fundflow/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create transaction');
  }

  const result = await response.json();
  return result.transaction;
}

export async function updateTransaction(
  transactionId: string,
  data: UpdateTransactionData
): Promise<Transaction> {
  const response = await fetch(`/api/fundflow/transactions/${transactionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update transaction');
  }

  const result = await response.json();
  return result.transaction;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const response = await fetch(`/api/fundflow/transactions/${transactionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete transaction');
  }
}

// ============= Recurring Transactions =============

export async function getRecurringTransactions(activeOnly?: boolean): Promise<RecurringTransaction[]> {
  const params = new URLSearchParams();
  if (activeOnly !== undefined) params.append('active_only', String(activeOnly));

  const url = `/api/fundflow/recurring${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recurring transactions');
  }

  const data = await response.json();
  return data.recurring_transactions || [];
}

export async function createRecurringTransaction(
  data: CreateRecurringTransactionData
): Promise<RecurringTransaction> {
  const response = await fetch('/api/fundflow/recurring', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create recurring transaction');
  }

  const result = await response.json();
  return result.recurring_transaction;
}

export async function updateRecurringTransaction(
  recurringId: string,
  data: UpdateRecurringTransactionData
): Promise<RecurringTransaction> {
  const response = await fetch(`/api/fundflow/recurring/${recurringId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update recurring transaction');
  }

  const result = await response.json();
  return result.recurring_transaction;
}

export async function deleteRecurringTransaction(recurringId: string): Promise<void> {
  const response = await fetch(`/api/fundflow/recurring/${recurringId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete recurring transaction');
  }
}
