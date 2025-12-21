# Docker Quick Reference - JAM Stack Microservices

Quick commands and tips for managing the Docker microservices stack.

## Quick Start

```bash
# Start all services
npm run dev

# Start with rebuild
npm run dev:build

# Start in background
npm start

# Stop services
npm stop
```

## Architecture

The unified `docker-compose.yml` orchestrates:

| Component | Container Name | Ports | Profile | Purpose |
|-----------|---------------|-------|---------|---------|
| Auth Service | jam-auth-service | 3011 (HTTP), 50051 (gRPC) | dev, prod, auth | Authentication + 2FA |
| Todos Service | jam-todos-service | 3002 (HTTP), 50052 (gRPC) | dev, prod, todos | Todo management |
| Fundflow Service | jam-fundflow-service | 3003 (HTTP), 50053 (gRPC) | dev, prod, fundflow | Financial tracking |
| Frontend | jam-frontend | 3010 | dev, prod, frontend | Next.js with BFF |
| Auth DB | jam-auth-db | 5433 | dev, prod, auth | PostgreSQL |
| Shared DB | jam-shared-db | 5435 | dev, prod, todos | PostgreSQL |
| Fundflow DB | jam-fundflow-db | 5434 | dev, prod, fundflow | PostgreSQL |
| Mailpit | jam-mailpit | 8030 (UI), 1030 (SMTP) | dev, mail | Email testing |

**Note**: HTTP ports (3011, 3002, 3003) are for debugging/health checks only. Communication is via gRPC through Next.js API Routes.

## Service Management

### Starting Services

```bash
# All services (development)
docker compose --profile dev up

# All services (production)
docker compose --profile prod up -d

# Specific services
docker compose --profile auth up        # Auth + database
docker compose --profile frontend up     # Frontend only

# Custom combinations
docker compose --profile auth --profile todos up
```

### Stopping Services

```bash
# Stop all services (preserve volumes/data)
docker compose down

# Stop specific service
docker compose stop auth-service

# Stop and remove volumes (DELETES DATA)
docker compose down -v
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart auth-service
docker compose restart frontend
```

## Logs and Monitoring

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth-service
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100 auth-service

# Multiple services
docker compose logs -f auth-service todos-service
```

### Container Status

```bash
# List running containers
docker compose ps

# List all containers
docker compose ps -a

# View resource usage
docker stats

# Detailed container info
docker inspect jam-auth-service
```

## Database Operations

### Accessing Databases

```bash
# Auth database
docker exec -it jam-auth-db psql -U postgres -d auth

# Todos database
docker exec -it jam-shared-db psql -U postgres -d shared

# Fundflow database
docker exec -it jam-fundflow-db psql -U postgres -d fundflow
```

### Common PostgreSQL Commands

```sql
-- List all tables
\dt

-- Describe table
\d table_name

-- Show all databases
\l

-- Quit
\q
```

### Database Backups

```bash
# Backup auth database
docker exec jam-auth-db pg_dump -U postgres auth > auth-backup.sql

# Backup todos database
docker exec jam-shared-db pg_dump -U postgres shared > todos-backup.sql

# Backup fundflow database
docker exec jam-fundflow-db pg_dump -U postgres fundflow > fundflow-backup.sql

# Restore database
docker exec -i jam-auth-db psql -U postgres -d auth < auth-backup.sql
```

### Volume Backups

```bash
# Backup volume to tar.gz
docker run --rm \
  -v jam-stack-microservices_auth-db-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/auth-db.tar.gz -C /data .

# Restore volume from tar.gz
docker run --rm \
  -v jam-stack-microservices_auth-db-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/auth-db.tar.gz -C /data
```

## Building and Rebuilding

### Build Commands

```bash
# Rebuild all services
docker compose build

# Rebuild specific service
docker compose build auth-service

# Rebuild without cache
docker compose build --no-cache

# Build and start
docker compose up --build
```

### Image Management

```bash
# List images
docker images

# Remove specific image
docker rmi docker-auth-service

# Remove all unused images
docker image prune

# Remove all images (nuclear option)
docker image prune -a
```

## Troubleshooting

### Health Checks

```bash
# Check service health
curl http://localhost:3011/health  # Auth
curl http://localhost:3002/health  # Todos
curl http://localhost:3003/health  # Fundflow

# Check frontend
curl http://localhost:3010/

# Check database health
docker exec jam-auth-db pg_isready -U postgres
```

### Port Conflicts

```bash
# Check what's using a port
sudo lsof -i :3010  # Frontend
sudo lsof -i :50051 # Auth gRPC
sudo lsof -i :5433  # Auth DB

# Kill process on port
sudo kill -9 $(sudo lsof -t -i:3010)
```

### Service Debugging

```bash
# Enter running container
docker exec -it jam-auth-service sh
docker exec -it jam-frontend sh

# View environment variables
docker exec jam-auth-service env

# Check specific env variable
docker exec jam-auth-service printenv DB_HOST

# View container filesystem
docker exec jam-auth-service ls -la /app
```

### Reset Everything

```bash
# Stop and remove everything
docker compose down -v

# Clean all Docker resources
docker system prune -af --volumes

# Start fresh
npm run dev:build
```

## Environment Variables

### Viewing Configuration

```bash
# View current docker-compose config
docker compose config

# View services in a profile
docker compose --profile dev config --services

# Check profiles
docker compose config --profiles
```

### Updating Environment

1. Edit `.env` file
2. Restart services:
   ```bash
   docker compose restart
   ```

Or rebuild if needed:
```bash
docker compose up --build
```

## Network Management

### Network Commands

```bash
# List networks
docker network ls

# Inspect network
docker network inspect jam-stack-application_jam-network

# Remove unused networks
docker network prune
```

### Network Debugging

```bash
# Test connectivity between containers
docker exec jam-frontend ping jam-auth-service
docker exec jam-frontend nslookup jam-auth-service

# Check gRPC connectivity (from frontend)
docker exec jam-frontend telnet jam-auth-service 50051
```

## Volume Management

### Volume Commands

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect jam-stack-microservices_auth-db-data

# Remove specific volume
docker volume rm jam-stack-microservices_auth-db-data

# Remove all unused volumes
docker volume prune
```

### Data Persistence

Database data is stored in named volumes:
- `jam-stack-microservices_auth-db-data`
- `jam-stack-microservices_shared-db-data`
- `jam-stack-microservices_fundflow-db-data`

These persist between container restarts unless explicitly removed.

## Production Deployment

### Build for Production

```bash
# Set NODE_ENV
export NODE_ENV=production

# Build and deploy
docker compose --profile prod up --build -d
```

### Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Change all default database passwords
- [ ] Enable SSL/TLS for frontend
- [ ] Configure proper logging
- [ ] Set up monitoring
- [ ] Enable automated backups
- [ ] Use secrets management (not .env files)
- [ ] Configure resource limits
- [ ] Set up health monitoring

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Docker Compose shortcuts
alias dcup='docker compose up'
alias dcdown='docker compose down'
alias dclogs='docker compose logs -f'
alias dcps='docker compose ps'
alias dcrestart='docker compose restart'

# JAM stack specific
alias jamdev='docker compose --profile dev up'
alias jamlogs='docker compose logs -f'
alias jamdown='docker compose down'
alias jamclean='docker compose down -v && docker system prune -f'
```

## Common Workflows

### Morning Startup

```bash
# Start all services
npm run dev

# Check health
curl http://localhost:3011/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# View logs
npm run logs
```

### After Code Changes

```bash
# Backend service changes
npm run dev:build

# Frontend changes (for hot reload)
cd frontend && npm run dev

# Proto file changes
npm run proto:generate && npm run dev:build
```

### End of Day

```bash
# Stop services (preserve data)
npm stop

# Or completely shut down
npm run dev:down
```

## Emergency Commands

### Service is Unresponsive

```bash
# Force restart
docker compose kill auth-service
docker compose up -d auth-service

# Or rebuild
docker compose up --build -d auth-service
```

### Database Corruption

```bash
# Stop services
docker compose down

# Remove database volume
docker volume rm jam-stack-microservices_auth-db-data

# Restart (will recreate database)
docker compose up -d
```

### Complete Reset

```bash
# Nuclear option - destroys everything
docker compose down -v
docker system prune -af --volumes
rm -rf node_modules
npm install
npm run dev:build
```

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)
- [CLAUDE.md](./CLAUDE.md) - Full architecture guide
- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [MIGRATION.md](./MIGRATION.md) - Migration from old setup

## Tips

1. **Use profiles**: `--profile` flag allows running specific service combinations
2. **Check logs first**: Most issues are visible in `docker compose logs`
3. **Health endpoints**: All services expose `/health` for quick status checks
4. **Volume persistence**: Data survives container restarts (unless you use `-v`)
5. **Environment changes**: Some changes require rebuild, others just restart
6. **Port conflicts**: Use `.env` to customize ports if defaults are taken
7. **gRPC communication**: Services communicate via gRPC (ports 50051-50053), not HTTP
8. **BFF pattern**: Frontend uses Next.js API Routes to call gRPC services

---

**Quick Help**: `docker compose --help` or `docker --help`
**Project Docs**: See `CLAUDE.md` for complete architecture and commands
