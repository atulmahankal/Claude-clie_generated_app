/**
 * Fundflow Hooks
 *
 * React Query hooks for fundflow (financial tracking) management
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as fundflowApi from '../api/fundflow';

const CATEGORIES_QUERY_KEY = ['fundflow', 'categories'];
const TRANSACTIONS_QUERY_KEY = ['fundflow', 'transactions'];
const RECURRING_QUERY_KEY = ['fundflow', 'recurring'];

// ============= Categories Hooks =============

/**
 * Get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fundflowApi.getCategories,
  });
}

/**
 * Create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fundflowApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
}

/**
 * Update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: fundflowApi.UpdateCategoryData }) =>
      fundflowApi.updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
}

/**
 * Delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fundflowApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}

// ============= Transactions Hooks =============

/**
 * Get transactions with optional filters
 */
export function useTransactions(filters?: fundflowApi.TransactionFilters) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, filters],
    queryFn: () => fundflowApi.getTransactions(filters),
  });
}

/**
 * Create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fundflowApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      toast.success('Transaction created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create transaction');
    },
  });
}

/**
 * Update a transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      data,
    }: {
      transactionId: string;
      data: fundflowApi.UpdateTransactionData;
    }) => fundflowApi.updateTransaction(transactionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      toast.success('Transaction updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update transaction');
    },
  });
}

/**
 * Delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fundflowApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      toast.success('Transaction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete transaction');
    },
  });
}

// ============= Recurring Transactions Hooks =============

/**
 * Get recurring transactions
 */
export function useRecurringTransactions(activeOnly?: boolean) {
  return useQuery({
    queryKey: [...RECURRING_QUERY_KEY, { activeOnly }],
    queryFn: () => fundflowApi.getRecurringTransactions(activeOnly),
  });
}

/**
 * Create a new recurring transaction
 */
export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fundflowApi.createRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      toast.success('Recurring transaction created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create recurring transaction');
    },
  });
}

/**
 * Update a recurring transaction
 */
export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recurringId,
      data,
    }: {
      recurringId: string;
      data: fundflowApi.UpdateRecurringTransactionData;
    }) => fundflowApi.updateRecurringTransaction(recurringId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      toast.success('Recurring transaction updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update recurring transaction');
    },
  });
}

/**
 * Delete a recurring transaction
 */
export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fundflowApi.deleteRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      toast.success('Recurring transaction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete recurring transaction');
    },
  });
}
