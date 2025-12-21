-- Password Reset and Profile Enhancements Migration
-- Version: 002
-- Date: 2025-12-21
-- Features: Password reset with 6-digit codes, rate limiting, enhanced profile fields

-- ==========================================
-- 1. PASSWORD RESET CODES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for password reset codes
CREATE INDEX IF NOT EXISTS idx_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_codes_code ON password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_reset_codes_expires_at ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_codes_created_at ON password_reset_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_reset_codes_used ON password_reset_codes(used);

-- ==========================================
-- 2. RATE LIMITING TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL,  -- email or IP address
    action VARCHAR(50) NOT NULL,       -- 'password_reset', 'email_verification'
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint to ensure one rate limit per identifier+action combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_action
    ON rate_limits(identifier, action);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

-- ==========================================
-- 3. ENHANCE PROFILES TABLE
-- ==========================================
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS pending_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for pending email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pending_email ON profiles(pending_email);

-- ==========================================
-- 4. SESSION METADATA ENHANCEMENT
-- ==========================================
-- Add columns to track session revocation
ALTER TABLE active_sessions
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS revoke_reason VARCHAR(255);

-- Index for revoked sessions
CREATE INDEX IF NOT EXISTS idx_active_sessions_revoked_at ON active_sessions(revoked_at);

-- ==========================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ==========================================
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own reset codes
CREATE POLICY reset_codes_select_own ON password_reset_codes
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- ==========================================
-- 6. CLEANUP FUNCTIONS
-- ==========================================

-- Function to auto-delete expired reset codes
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_codes
    WHERE expires_at < NOW()
       OR (used = TRUE AND created_at < NOW() - INTERVAL '7 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-delete expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate all reset codes for a user
CREATE OR REPLACE FUNCTION invalidate_user_reset_codes(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE password_reset_codes
    SET used = TRUE
    WHERE user_id = p_user_id
      AND used = FALSE
      AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ==========================================
COMMENT ON TABLE password_reset_codes IS 'Stores 6-digit password reset verification codes with expiration and attempt tracking';
COMMENT ON TABLE rate_limits IS 'Rate limiting for sensitive operations like password reset and email verification';

COMMENT ON COLUMN password_reset_codes.code IS '6-digit verification code sent via email';
COMMENT ON COLUMN password_reset_codes.attempts IS 'Number of failed verification attempts';
COMMENT ON COLUMN password_reset_codes.max_attempts IS 'Maximum allowed verification attempts (default: 3)';
COMMENT ON COLUMN password_reset_codes.used IS 'Whether the code has been successfully used';

COMMENT ON COLUMN profiles.phone_number IS 'Optional user phone number';
COMMENT ON COLUMN profiles.bio IS 'User biography or description';
COMMENT ON COLUMN profiles.pending_email IS 'New email address awaiting verification';
COMMENT ON COLUMN profiles.email_verification_code IS '6-digit code for verifying email changes';
COMMENT ON COLUMN profiles.email_verification_expires_at IS 'Expiration time for email verification code';

COMMENT ON COLUMN active_sessions.revoked_at IS 'Timestamp when session was revoked';
COMMENT ON COLUMN active_sessions.revoke_reason IS 'Reason for session revocation (password_change, password_reset, manual_logout)';

COMMENT ON COLUMN rate_limits.identifier IS 'Email address or IP address being rate limited';
COMMENT ON COLUMN rate_limits.action IS 'Type of action being rate limited (password_reset, email_verification)';
COMMENT ON COLUMN rate_limits.attempt_count IS 'Number of attempts in the current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start of the current rate limit window';

-- ==========================================
-- 8. INITIAL DATA / CONFIGURATION
-- ==========================================
-- No initial data needed for these tables
