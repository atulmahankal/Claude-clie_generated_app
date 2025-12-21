-- Base App Database Initialization
-- Service configuration and user roles

-- Service configuration table
CREATE TABLE IF NOT EXISTS service_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    path VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    service_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_configs_enabled ON service_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_service_configs_sort_order ON service_configs(sort_order);
CREATE INDEX IF NOT EXISTS idx_service_configs_service_name ON service_configs(service_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Seed initial services
INSERT INTO service_configs (service_name, display_name, description, path, color, enabled, sort_order, icon_url) VALUES
    ('auth', 'Authentication', 'User authentication and security settings', '/auth', '#3B82F6', true, 1, '/icons/auth.svg'),
    ('todos', 'Todo Lists', 'Manage your tasks and todo lists', '/todos', '#10B981', true, 2, '/icons/todos.svg'),
    ('fundflow', 'FundFlow', 'Track your finances and transactions', '/fundflow', '#F59E0B', true, 3, '/icons/fundflow.svg')
ON CONFLICT (service_name) DO NOTHING;
