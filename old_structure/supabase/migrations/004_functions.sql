-- Database Functions Migration
-- Creates functions for recurring transactions and reminders

-- =====================================================
-- FUNCTION: Calculate Next Occurrence Date
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  current_date DATE,
  frequency TEXT
)
RETURNS DATE AS $$
BEGIN
  CASE frequency
    WHEN 'daily' THEN
      RETURN current_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN current_date + INTERVAL '1 week';
    WHEN 'biweekly' THEN
      RETURN current_date + INTERVAL '2 weeks';
    WHEN 'monthly' THEN
      RETURN current_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN current_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      RETURN current_date + INTERVAL '1 year';
    ELSE
      RETURN current_date;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Process Recurring Transactions
-- This function should be called daily via cron
-- =====================================================
CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS TABLE (
  processed_count INTEGER,
  transaction_ids UUID[]
) AS $$
DECLARE
  rec RECORD;
  new_transaction_id UUID;
  transaction_ids_array UUID[] := ARRAY[]::UUID[];
  count INTEGER := 0;
BEGIN
  -- Find all active recurring transactions due today or earlier
  FOR rec IN
    SELECT *
    FROM recurring_transactions
    WHERE is_active = TRUE
      AND next_occurrence <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    -- Create a new transaction from the recurring template
    INSERT INTO transactions (
      user_id,
      category_id,
      type,
      amount,
      description,
      transaction_date,
      recurring_transaction_id
    )
    VALUES (
      rec.user_id,
      rec.category_id,
      rec.type,
      rec.amount,
      rec.description,
      rec.next_occurrence,
      rec.id
    )
    RETURNING id INTO new_transaction_id;

    -- Add to array
    transaction_ids_array := array_append(transaction_ids_array, new_transaction_id);
    count := count + 1;

    -- Update next_occurrence
    UPDATE recurring_transactions
    SET next_occurrence = calculate_next_occurrence(next_occurrence, frequency),
        updated_at = NOW()
    WHERE id = rec.id;

    -- Deactivate if past end_date
    IF rec.end_date IS NOT NULL AND rec.next_occurrence > rec.end_date THEN
      UPDATE recurring_transactions
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;

  RETURN QUERY SELECT count, transaction_ids_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Generate Reminders
-- This function should be called daily via cron
-- =====================================================
CREATE OR REPLACE FUNCTION generate_reminders()
RETURNS TABLE (
  generated_count INTEGER,
  reminder_ids UUID[]
) AS $$
DECLARE
  rec RECORD;
  new_reminder_id UUID;
  reminder_ids_array UUID[] := ARRAY[]::UUID[];
  count INTEGER := 0;
  reminder_date DATE;
BEGIN
  -- Find all active recurring transactions that need reminders
  FOR rec IN
    SELECT *
    FROM recurring_transactions
    WHERE is_active = TRUE
      AND remind_days_before > 0
      AND next_occurrence > CURRENT_DATE
  LOOP
    -- Calculate reminder date
    reminder_date := rec.next_occurrence - (rec.remind_days_before || ' days')::INTERVAL;

    -- Only create reminder if it's due today or earlier and doesn't already exist
    IF reminder_date <= CURRENT_DATE AND NOT EXISTS (
      SELECT 1
      FROM transaction_reminders
      WHERE recurring_transaction_id = rec.id
        AND reminder_date = reminder_date
    ) THEN
      INSERT INTO transaction_reminders (
        user_id,
        recurring_transaction_id,
        reminder_date
      )
      VALUES (
        rec.user_id,
        rec.id,
        reminder_date
      )
      RETURNING id INTO new_reminder_id;

      -- Add to array
      reminder_ids_array := array_append(reminder_ids_array, new_reminder_id);
      count := count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT count, reminder_ids_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get Active Reminders for User
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_reminders(p_user_id UUID)
RETURNS TABLE (
  reminder_id UUID,
  recurring_transaction_id UUID,
  transaction_type TEXT,
  transaction_amount DECIMAL,
  transaction_description TEXT,
  category_name TEXT,
  reminder_date DATE,
  next_occurrence DATE,
  frequency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.id AS reminder_id,
    rt.id AS recurring_transaction_id,
    rt.type AS transaction_type,
    rt.amount AS transaction_amount,
    rt.description AS transaction_description,
    tc.name AS category_name,
    tr.reminder_date,
    rt.next_occurrence,
    rt.frequency
  FROM transaction_reminders tr
  JOIN recurring_transactions rt ON tr.recurring_transaction_id = rt.id
  LEFT JOIN transaction_categories tc ON rt.category_id = tc.id
  WHERE tr.user_id = p_user_id
    AND tr.sent = FALSE
    AND tr.dismissed = FALSE
    AND rt.is_active = TRUE
  ORDER BY tr.reminder_date ASC, rt.next_occurrence ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get Transaction Statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_transaction_stats(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_income DECIMAL,
  total_expense DECIMAL,
  balance DECIMAL,
  transaction_count INTEGER,
  income_count INTEGER,
  expense_count INTEGER
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Default to current month if dates not provided
  v_start_date := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::DATE);
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance,
    COUNT(*)::INTEGER AS transaction_count,
    COUNT(CASE WHEN type = 'income' THEN 1 END)::INTEGER AS income_count,
    COUNT(CASE WHEN type = 'expense' THEN 1 END)::INTEGER AS expense_count
  FROM transactions
  WHERE user_id = p_user_id
    AND transaction_date BETWEEN v_start_date AND v_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get Category Breakdown
-- =====================================================
CREATE OR REPLACE FUNCTION get_category_breakdown(
  p_user_id UUID,
  p_type TEXT DEFAULT 'expense',
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_color TEXT,
  total_amount DECIMAL,
  transaction_count INTEGER,
  percentage DECIMAL
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_total DECIMAL;
BEGIN
  -- Default to current month if dates not provided
  v_start_date := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::DATE);
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  -- Calculate total for percentage
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM transactions
  WHERE user_id = p_user_id
    AND type = p_type
    AND transaction_date BETWEEN v_start_date AND v_end_date;

  RETURN QUERY
  SELECT
    COALESCE(t.category_id, '00000000-0000-0000-0000-000000000000'::UUID) AS category_id,
    COALESCE(tc.name, 'Uncategorized') AS category_name,
    COALESCE(tc.color, '#6B7280') AS category_color,
    SUM(t.amount) AS total_amount,
    COUNT(*)::INTEGER AS transaction_count,
    CASE
      WHEN v_total > 0 THEN ROUND((SUM(t.amount) / v_total * 100)::NUMERIC, 2)
      ELSE 0
    END AS percentage
  FROM transactions t
  LEFT JOIN transaction_categories tc ON t.category_id = tc.id
  WHERE t.user_id = p_user_id
    AND t.type = p_type
    AND t.transaction_date BETWEEN v_start_date AND v_end_date
  GROUP BY t.category_id, tc.name, tc.color
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
