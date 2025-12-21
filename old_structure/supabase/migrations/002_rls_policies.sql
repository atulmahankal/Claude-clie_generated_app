-- Row Level Security (RLS) Policies Migration
-- Implements security policies to ensure users can only access their own data

-- =====================================================
-- PROFILES TABLE RLS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- LOGIN HISTORY TABLE RLS
-- =====================================================
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login history"
  ON login_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Users should not be able to update or delete login history
-- This maintains an audit trail

-- =====================================================
-- ACTIVE SESSIONS TABLE RLS
-- =====================================================
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON active_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON active_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TODO LISTS TABLE RLS
-- =====================================================
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todo lists"
  ON todo_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todo lists"
  ON todo_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todo lists"
  ON todo_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todo lists"
  ON todo_lists FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TODOS TABLE RLS
-- =====================================================
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTION CATEGORIES TABLE RLS
-- =====================================================
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction categories"
  ON transaction_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction categories"
  ON transaction_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction categories"
  ON transaction_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction categories"
  ON transaction_categories FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTIONS TABLE RLS
-- =====================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RECURRING TRANSACTIONS TABLE RLS
-- =====================================================
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring transactions"
  ON recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTION REMINDERS TABLE RLS
-- =====================================================
ALTER TABLE transaction_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction reminders"
  ON transaction_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction reminders"
  ON transaction_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction reminders"
  ON transaction_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction reminders"
  ON transaction_reminders FOR DELETE
  USING (auth.uid() = user_id);
