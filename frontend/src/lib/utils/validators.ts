/**
 * Validation Schemas
 *
 * Zod schemas for form validation throughout the application
 */

import { z } from 'zod'

// =====================================================
// AUTH SCHEMAS
// =====================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

// =====================================================
// TODO SCHEMAS
// =====================================================

export const todoListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().optional(),
})

export const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  listId: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
  dueDate: z.string().or(z.date()).optional().nullable(),
})

// =====================================================
// TRANSACTION SCHEMAS
// =====================================================

export const transactionCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().optional(),
})

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999, 'Amount is too large')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  categoryId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
  transactionDate: z.string().or(z.date()),
})

export const recurringTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999, 'Amount is too large')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  categoryId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  remindDaysBefore: z.number().int().min(0).max(30).optional(),
})

// =====================================================
// TYPE EXPORTS
// =====================================================

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type NewPasswordInput = z.infer<typeof newPasswordSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type TodoListInput = z.infer<typeof todoListSchema>
export type TodoInput = z.infer<typeof todoSchema>
export type TransactionCategoryInput = z.infer<typeof transactionCategorySchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type RecurringTransactionInput = z.infer<typeof recurringTransactionSchema>
