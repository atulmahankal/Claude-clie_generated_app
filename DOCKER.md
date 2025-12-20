# Docker Quick Reference

This guide provides quick commands for managing your local Supabase development environment.

## Prerequisites

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Ensure Docker is running before executing any commands

## Quick Start

```bash
# 1. Copy environment template
cp .env.local.example .env.local

# 2. Start all services
docker-compose -f docker-compose.local.yml up

# 3. Access the services
# - Next.js: http://localhost:3000
# - Supabase Studio: http://localhost:3001
# - Supabase API: http://localhost:8000
```

## Common Commands

### Starting Services

```bash
# Start all services (foreground - shows logs)
docker-compose -f docker-compose.local.yml up

# Start all services (background)
docker-compose -f docker-compose.local.yml up -d

# Start specific service
docker-compose -f docker-compose.local.yml up app
docker-compose -f docker-compose.local.yml up db
```

### Stopping Services

```bash
# Stop all services (keeps data)
docker-compose -f docker-compose.local.yml down

# Stop all services and remove volumes (deletes all data)
docker-compose -f docker-compose.local.yml down -v

# Stop specific service
docker-compose -f docker-compose.local.yml stop app
```

### Viewing Logs

```bash
# View all logs (follow mode)
docker-compose -f docker-compose.local.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.local.yml logs -f app
docker-compose -f docker-compose.local.yml logs -f db
docker-compose -f docker-compose.local.yml logs -f studio

# View last 100 lines
docker-compose -f docker-compose.local.yml logs --tail=100
```

### Restarting Services

```bash
# Restart all services
docker-compose -f docker-compose.local.yml restart

# Restart specific service
docker-compose -f docker-compose.local.yml restart app
docker-compose -f docker-compose.local.yml restart db
```

### Service Status

```bash
# View running containers
docker-compose -f docker-compose.local.yml ps

# View all containers (including stopped)
docker-compose -f docker-compose.local.yml ps -a

# Check Docker status
docker ps
```

## Database Management

### Access PostgreSQL

```bash
# Connect to PostgreSQL container
docker exec -it supabase-db psql -U postgres -d postgres

# Run SQL file
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/001_initial_schema.sql
```

### Database Operations

```bash
# Backup database
docker exec supabase-db pg_dump -U postgres postgres > backup.sql

# Restore database
docker exec -i supabase-db psql -U postgres -d postgres < backup.sql

# Check database health
docker exec -it supabase-db pg_isready -U postgres
```

### Run Migrations

```bash
# Run all migrations in order
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/001_initial_schema.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/002_rls_policies.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/003_indexes.sql
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/004_functions.sql
```

## Troubleshooting

### Reset Everything

```bash
# Nuclear option - complete reset
docker-compose -f docker-compose.local.yml down -v
docker system prune -a --volumes

# Then restart
docker-compose -f docker-compose.local.yml up
```

### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000  # Next.js
lsof -i :3001  # Supabase Studio
lsof -i :8000  # Supabase API
lsof -i :5432  # PostgreSQL

# Kill process on port
kill -9 $(lsof -t -i:3000)
```

### Rebuild Containers

```bash
# Rebuild all containers
docker-compose -f docker-compose.local.yml build

# Rebuild specific container
docker-compose -f docker-compose.local.yml build app

# Rebuild and start (no cache)
docker-compose -f docker-compose.local.yml build --no-cache
docker-compose -f docker-compose.local.yml up --force-recreate
```

### View Container Details

```bash
# Inspect container
docker inspect supabase-db
docker inspect jam-stack-app-dev

# View container stats (CPU, memory usage)
docker stats

# Execute command in running container
docker exec -it supabase-db sh
docker exec -it jam-stack-app-dev sh
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything (BE CAREFUL!)
docker system prune -a --volumes
```

## Environment Variables

### View Environment Variables

```bash
# View all environment variables in container
docker exec jam-stack-app-dev env

# View specific environment variable
docker exec jam-stack-app-dev printenv NEXT_PUBLIC_SUPABASE_URL
```

### Update Environment Variables

1. Edit `.env.local` file
2. Restart the services:
   ```bash
   docker-compose -f docker-compose.local.yml restart
   ```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Next.js App | http://localhost:3000 | Main application |
| Supabase Studio | http://localhost:3001 | Database management UI |
| Supabase API | http://localhost:8000 | API Gateway |
| PostgreSQL | localhost:5432 | Database (use client to connect) |
| Mailpit | http://localhost:8025 | Email testing UI |

## Production Deployment

For production deployment, use:

```bash
# Build and start production stack
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to cloud platforms:
# - Vercel (Next.js)
# - Supabase Cloud (Database & Auth)
```

See [SETUP.md](./SETUP.md) for detailed production deployment instructions.

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting/docker)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)

## Tips

1. **First Run**: Initial startup takes 2-5 minutes to download images
2. **Data Persistence**: Database data is stored in Docker volumes
3. **Hot Reload**: Source code changes automatically reload the Next.js app
4. **Studio Access**: Use Supabase Studio at http://localhost:3001 to manage your database visually
5. **Logs**: Always check logs first when debugging: `docker-compose -f docker-compose.local.yml logs -f`
6. **Email Testing**: Use Mailpit at http://localhost:8025 to view all emails sent by the application (signup confirmations, password resets, etc.)
