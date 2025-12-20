-- Fundflow Service Database Schema
-- Tables: transaction_categories, transactions, recurring_transactions, transaction_reminders

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transaction categories table
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(50) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50) NOT NULL DEFAULT 'dollar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name, type)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES transaction_categories(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description VARCHAR(500) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES transaction_categories(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description VARCHAR(500) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    last_processed_date TIMESTAMP WITH TIME ZONE,
    next_occurrence_date TIMESTAMP WITH TIME ZONE NOT NULL,
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    auto_create BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction reminders table
CREATE TABLE IF NOT EXISTS transaction_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    recurring_transaction_id UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON transaction_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON transaction_categories(user_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions(user_id, currency);

CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_occurrence ON recurring_transactions(next_occurrence_date) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON transaction_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_unread ON transaction_reminders(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON transaction_reminders(reminder_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON transaction_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_updated_at
    BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
    from_date TIMESTAMP WITH TIME ZONE,
    freq VARCHAR(20),
    day_month INTEGER,
    day_week INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_date TIMESTAMP WITH TIME ZONE;
BEGIN
    next_date := from_date;

    CASE freq
        WHEN 'daily' THEN
            next_date := next_date + INTERVAL '1 day';
        WHEN 'weekly' THEN
            next_date := next_date + INTERVAL '1 week';
            -- Adjust to specific day of week if provided
            IF day_week IS NOT NULL THEN
                next_date := next_date + ((day_week - EXTRACT(DOW FROM next_date)::INTEGER + 7) % 7) * INTERVAL '1 day';
            END IF;
        WHEN 'monthly' THEN
            next_date := next_date + INTERVAL '1 month';
            -- Adjust to specific day of month if provided
            IF day_month IS NOT NULL THEN
                next_date := date_trunc('month', next_date) + (day_month - 1) * INTERVAL '1 day';
            END IF;
        WHEN 'yearly' THEN
            next_date := next_date + INTERVAL '1 year';
    END CASE;

    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to process recurring transactions
CREATE OR REPLACE FUNCTION process_recurring_transactions_daily()
RETURNS TABLE (
    processed_count INTEGER,
    created_count INTEGER,
    reminder_count INTEGER
) AS $$
DECLARE
    rec RECORD;
    proc_count INTEGER := 0;
    create_count INTEGER := 0;
    remind_count INTEGER := 0;
    next_date TIMESTAMP WITH TIME ZONE;
    reminder_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Process all active recurring transactions that are due
    FOR rec IN
        SELECT * FROM recurring_transactions
        WHERE is_active = TRUE
        AND next_occurrence_date <= NOW()
        AND (end_date IS NULL OR end_date >= NOW())
    LOOP
        -- Create actual transaction if auto_create is enabled
        IF rec.auto_create THEN
            INSERT INTO transactions (
                user_id, category_id, type, amount, currency,
                description, transaction_date, notes
            ) VALUES (
                rec.user_id, rec.category_id, rec.type, rec.amount, rec.currency,
                rec.description || ' (Auto-created)', rec.next_occurrence_date, NULL
            );
            create_count := create_count + 1;
        END IF;

        -- Create reminder if configured
        IF NOT rec.auto_create OR rec.reminder_days_before > 0 THEN
            reminder_date := rec.next_occurrence_date - (rec.reminder_days_before || ' days')::INTERVAL;

            INSERT INTO transaction_reminders (
                user_id, recurring_transaction_id, reminder_date, message
            ) VALUES (
                rec.user_id, rec.id, reminder_date,
                'Upcoming ' || rec.type || ': ' || rec.description || ' - ' || rec.amount || ' ' || rec.currency
            );
            remind_count := remind_count + 1;
        END IF;

        -- Calculate next occurrence
        next_date := calculate_next_occurrence(
            NOW(), rec.frequency, rec.day_of_month, rec.day_of_week
        );

        -- Update recurring transaction
        UPDATE recurring_transactions
        SET last_processed_date = NOW(),
            next_occurrence_date = next_date,
            updated_at = NOW()
        WHERE id = rec.id;

        proc_count := proc_count + 1;
    END LOOP;

    processed_count := proc_count;
    created_count := create_count;
    reminder_count := remind_count;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own categories
CREATE POLICY categories_select_own ON transaction_categories
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY categories_insert_own ON transaction_categories
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY categories_update_own ON transaction_categories
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY categories_delete_own ON transaction_categories
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Policy: Users can only access their own transactions
CREATE POLICY transactions_select_own ON transactions
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY transactions_insert_own ON transactions
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY transactions_update_own ON transactions
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY transactions_delete_own ON transactions
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Policy: Users can only access their own recurring transactions
CREATE POLICY recurring_select_own ON recurring_transactions
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY recurring_insert_own ON recurring_transactions
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY recurring_update_own ON recurring_transactions
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY recurring_delete_own ON recurring_transactions
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Policy: Users can only access their own reminders
CREATE POLICY reminders_select_own ON transaction_reminders
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY reminders_insert_own ON transaction_reminders
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY reminders_update_own ON transaction_reminders
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY reminders_delete_own ON transaction_reminders
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Comments for documentation
COMMENT ON TABLE transaction_categories IS 'User-defined categories for income and expenses';
COMMENT ON TABLE transactions IS 'Individual financial transactions';
COMMENT ON TABLE recurring_transactions IS 'Recurring transaction templates';
COMMENT ON TABLE transaction_reminders IS 'Reminders for upcoming recurring transactions';

COMMENT ON COLUMN recurring_transactions.frequency IS 'How often the transaction recurs: daily, weekly, monthly, yearly';
COMMENT ON COLUMN recurring_transactions.day_of_month IS 'Day of month for monthly recurrence (1-31)';
COMMENT ON COLUMN recurring_transactions.day_of_week IS 'Day of week for weekly recurrence (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN recurring_transactions.auto_create IS 'Whether to automatically create transactions or just remind';
COMMENT ON COLUMN recurring_transactions.next_occurrence_date IS 'Next scheduled date for this recurring transaction';
