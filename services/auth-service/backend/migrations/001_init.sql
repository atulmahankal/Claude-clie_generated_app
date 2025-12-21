-- Authentication Service Database Schema
-- Tables: profiles, active_sessions, login_history

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    device_type VARCHAR(100),
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login history table
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_refresh_token ON active_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own profile
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT
    USING (id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', TRUE)::UUID);

-- Policy: Users can only read/delete their own sessions
CREATE POLICY sessions_select_own ON active_sessions
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

CREATE POLICY sessions_delete_own ON active_sessions
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Policy: Users can only read their own login history
CREATE POLICY login_history_select_own ON login_history
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with authentication credentials';
COMMENT ON TABLE active_sessions IS 'Active user sessions with JWT tokens';
COMMENT ON TABLE login_history IS 'Audit log of login attempts';

COMMENT ON COLUMN profiles.two_factor_secret IS 'Base32 encoded TOTP secret for 2FA';
COMMENT ON COLUMN active_sessions.expires_at IS 'Token expiration time';
COMMENT ON COLUMN login_history.success IS 'Whether the login attempt was successful';
