# Docker Compose Migration Guide

This document explains the migration from multiple docker-compose files to a unified configuration.

## What Changed

### Before (Old Structure)
- `docker-compose.yml` - Basic Next.js app
- `docker-compose.prod.yml` - Production setup
- `docker-compose.local.yml` - Supabase stack (unused)
- `docker/docker-compose.local.yml` - Microservices (active)
- `services/*/docker-compose.yml` - Individual service files

**Problems:**
- Port conflicts between files
- Confusing which file to use
- No easy way to run specific services
- Duplicated configuration

### After (New Structure)
- **Single `docker-compose.yml`** at project root
- Uses Docker Compose **profiles** for selective service activation
- All ports configurable via `.env` file
- Consistent configuration across dev/prod

## Migration Steps

If you were using the old setup, follow these steps:

### 1. Stop Old Services

```bash
# Stop any running containers from old compose files
docker compose -f docker/docker-compose.local.yml down
docker compose -f docker-compose.local.yml down
docker compose down
```

### 2. Update Environment Variables

```bash
# Create .env from template
cp .env.example .env

# Edit .env to customize ports if needed
# Default ports should work for most cases
```

### 3. Start With New Setup

```bash
# Development mode (all services)
npm run dev

# Or specific services
npm run service:auth
npm run service:frontend
```

## Profile System

The new `docker-compose.yml` uses profiles to activate services:

| Profile | Services Included | Use Case |
|---------|------------------|----------|
| `dev` | All services + Mailpit | Development |
| `prod` | All services (no Mailpit) | Production |
| `auth` | auth-service + auth-db | Test auth only |
| `todos` | todos-service + shared-db | Test todos only |
| `fundflow` | fundflow-service + fundflow-db | Test fundflow only |
| `frontend` | frontend (requires services) | Frontend development |
| `gateway` | Kong API gateway | Gateway testing |
| `mail` | Mailpit | Email testing |

## Command Changes

### Old Commands → New Commands

| Old | New | Notes |
|-----|-----|-------|
| `docker compose -f docker/docker-compose.local.yml up` | `npm run dev` | Development mode |
| `docker compose -f docker/docker-compose.local.yml up --build` | `npm run dev:build` | With rebuild |
| `docker compose -f docker/docker-compose.local.yml down` | `npm run dev:down` | Stop services |
| `docker compose -f services/auth-service/docker-compose.yml up` | `npm run service:auth` | Single service |
| N/A | `npm run prod` | Production mode |
| N/A | `npm run logs:auth` | View service logs |

## Port Configuration

All ports are now configurable via environment variables with sensible defaults:

### Frontend & Gateway
- `FRONTEND_PORT=3010` (was hardcoded)
- `KONG_PROXY_PORT=8010` (was 8010 in microservices, 8000 in Supabase)
- `KONG_ADMIN_PORT=8011` (consistent)

### Services
- `AUTH_HTTP_PORT=3011` (consistent)
- `TODOS_HTTP_PORT=3002` (consistent)
- `FUNDFLOW_HTTP_PORT=3003` (consistent)

### Databases
- `AUTH_DB_PORT=5433` (was 5433 in main, 5432 in service file)
- `SHARED_DB_PORT=5435` (was 5435 in main, 5432 in service file)
- `FUNDFLOW_DB_PORT=5434` (consistent)

**No more port conflicts!**

## Benefits

1. **Single Source of Truth**: One docker-compose.yml file
2. **Flexible Deployment**: Use profiles for different scenarios
3. **Environment-Based Config**: Customize via .env file
4. **Consistent Ports**: No more conflicts between files
5. **Better Scripts**: Semantic npm commands
6. **Dev/Prod Parity**: Same config, different profile

## Troubleshooting

### Services won't start
```bash
# Make sure old containers are stopped
docker compose down
docker ps -a  # Check for orphaned containers
docker rm -f $(docker ps -aq)  # Force remove all containers
```

### Port already in use
```bash
# Check what's using the port
sudo lsof -i :3010
sudo lsof -i :8010

# Either stop that process or change port in .env
echo "FRONTEND_PORT=3020" >> .env
```

### Database data missing
Data volumes are preserved. They're named:
- `jam-stack-microservices_auth-db-data`
- `jam-stack-microservices_shared-db-data`
- `jam-stack-microservices_fundflow-db-data`

If you need to reset:
```bash
npm run clean  # Removes volumes - WARNING: deletes data
```

## Rollback (If Needed)

If you need to rollback to the old setup:

```bash
# Restore backup
mv docker/docker-compose.local.yml.backup docker/docker-compose.local.yml

# Use old command
docker compose -f docker/docker-compose.local.yml up
```

## Files Removed

These files have been removed as they're consolidated into `docker-compose.yml`:

- ✅ `docker-compose.prod.yml` (merged into prod profile)
- ✅ `docker-compose.local.yml` (old Supabase stack, unused)
- ✅ `services/auth-service/docker-compose.yml` (merged)
- ✅ `services/todos-service/docker-compose.yml` (merged)
- ✅ `services/fundflow-service/docker-compose.yml` (merged)
- 📦 `docker/docker-compose.local.yml.backup` (kept as backup)

## Next Steps

1. ✅ Test the new setup: `npm run dev`
2. ✅ Verify all services are healthy
3. ✅ Update CI/CD pipelines if applicable
4. ✅ Remove backup file when confident: `rm docker/docker-compose.local.yml.backup`
5. ✅ Commit changes to git

## Questions?

See `CLAUDE.md` for detailed command reference and architecture documentation.
