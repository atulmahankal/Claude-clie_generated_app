-- Supabase Initialization Script
-- Creates necessary roles, extensions, and schemas for Supabase services

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Create Supabase internal roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOLOGIN NOINHERIT CREATEROLE;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin NOLOGIN NOINHERIT CREATEROLE;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin NOLOGIN NOINHERIT CREATEDB CREATEROLE REPLICATION;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgres';
  END IF;
END
$$;

-- Grant role memberships
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO postgres;
GRANT supabase_storage_admin TO postgres;
GRANT supabase_admin TO postgres;

-- Set password for admin roles (using same password as postgres for development)
ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_storage_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_admin WITH LOGIN PASSWORD 'postgres';

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;

-- Create realtime schema
CREATE SCHEMA IF NOT EXISTS realtime;

-- Grant schema usage
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Create auth.users table (simplified version for GoTrue)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token TEXT,
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new TEXT,
  email_change TEXT,
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT,
  phone_confirmed_at TIMESTAMPTZ,
  phone_change TEXT,
  phone_change_token TEXT,
  phone_change_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current TEXT,
  email_change_confirm_status SMALLINT,
  banned_until TIMESTAMPTZ,
  reauthentication_token TEXT,
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Grant permissions on auth.users
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT ALL ON auth.users TO supabase_auth_admin;

-- Create auth helper tables
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON auth.refresh_tokens TO supabase_auth_admin;
GRANT SELECT ON auth.refresh_tokens TO authenticated;

-- Create auth.audit_log_entries table
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON auth.audit_log_entries TO supabase_auth_admin;

-- Create storage.buckets table
CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  owner UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  public BOOLEAN DEFAULT FALSE
);

GRANT ALL ON storage.buckets TO supabase_storage_admin;
GRANT SELECT ON storage.buckets TO anon, authenticated;

-- Create storage.objects table
CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT NOT NULL,
  owner UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  metadata JSONB
);

GRANT ALL ON storage.objects TO supabase_storage_admin;
GRANT SELECT ON storage.objects TO anon, authenticated;

-- Grant all permissions to postgres superuser
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres WITH GRANT OPTION;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres WITH GRANT OPTION;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres WITH GRANT OPTION;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres WITH GRANT OPTION;
