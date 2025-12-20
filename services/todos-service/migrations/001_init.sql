-- Todos Service Database Schema
-- Tables: todo_lists, todos

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Todo lists table
CREATE TABLE IF NOT EXISTS todo_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50) NOT NULL DEFAULT 'list',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id ON todo_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_lists_sort_order ON todo_lists(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_todos_list_id ON todos(list_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_todo_lists_updated_at
    BEFORE UPDATE ON todo_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own todo lists
CREATE POLICY todo_lists_select_own ON todo_lists
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY todo_lists_insert_own ON todo_lists
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY todo_lists_update_own ON todo_lists
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY todo_lists_delete_own ON todo_lists
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Policy: Users can only access their own todos
CREATE POLICY todos_select_own ON todos
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY todos_insert_own ON todos
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY todos_update_own ON todos
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY todos_delete_own ON todos
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Comments for documentation
COMMENT ON TABLE todo_lists IS 'User todo lists with customization options';
COMMENT ON TABLE todos IS 'Individual todo items within lists';

COMMENT ON COLUMN todo_lists.color IS 'Hex color code for list display';
COMMENT ON COLUMN todo_lists.icon IS 'Icon identifier for list display';
COMMENT ON COLUMN todo_lists.sort_order IS 'Display order for lists (0-based)';
COMMENT ON COLUMN todos.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN todos.due_date IS 'Optional deadline for the todo';
COMMENT ON COLUMN todos.completed_at IS 'Timestamp when todo was marked as completed';
