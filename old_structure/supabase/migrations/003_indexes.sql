-- Database Indexes Migration
-- Creates indexes for improved query performance

-- =====================================================
-- LOGIN HISTORY INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_login_history_user_id
  ON login_history(user_id);

CREATE INDEX IF NOT EXISTS idx_login_history_login_at
  ON login_history(login_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_user_login_at
  ON login_history(user_id, login_at DESC);

-- =====================================================
-- ACTIVE SESSIONS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id
  ON active_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at
  ON active_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_active_sessions_session_token
  ON active_sessions(session_token);

-- =====================================================
-- TODO LISTS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id
  ON todo_lists(user_id);

CREATE INDEX IF NOT EXISTS idx_todo_lists_sort_order
  ON todo_lists(user_id, sort_order);

-- =====================================================
-- TODOS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_todos_user_id
  ON todos(user_id);

CREATE INDEX IF NOT EXISTS idx_todos_list_id
  ON todos(list_id);

CREATE INDEX IF NOT EXISTS idx_todos_due_date
  ON todos(due_date);

CREATE INDEX IF NOT EXISTS idx_todos_completed
  ON todos(completed);

CREATE INDEX IF NOT EXISTS idx_todos_user_completed
  ON todos(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_todos_user_due_date
  ON todos(user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_todos_priority
  ON todos(priority);

-- =====================================================
-- TRANSACTION CATEGORIES INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_transaction_categories_user_id
  ON transaction_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_categories_type
  ON transaction_categories(user_id, type);

-- =====================================================
-- TRANSACTIONS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type
  ON transactions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category_date
  ON transactions(user_id, category_id, transaction_date DESC);

-- =====================================================
-- RECURRING TRANSACTIONS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id
  ON recurring_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence
  ON recurring_transactions(next_occurrence);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active
  ON recurring_transactions(is_active);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_active
  ON recurring_transactions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active_next
  ON recurring_transactions(is_active, next_occurrence);

-- =====================================================
-- TRANSACTION REMINDERS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_transaction_reminders_user_id
  ON transaction_reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_reminders_recurring_id
  ON transaction_reminders(recurring_transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_reminders_date
  ON transaction_reminders(reminder_date);

CREATE INDEX IF NOT EXISTS idx_transaction_reminders_sent
  ON transaction_reminders(sent);

CREATE INDEX IF NOT EXISTS idx_transaction_reminders_user_dismissed
  ON transaction_reminders(user_id, dismissed);
