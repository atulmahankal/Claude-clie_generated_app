# Setup Guide - JAM Stack Microservices Application

Complete setup guide for the JAM stack microservices application.

## Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** installed and running ([download here](https://www.docker.com/products/docker-desktop/))
- **Node.js** >= 20.0.0 ([download here](https://nodejs.org/))
- **npm** >= 10.0.0 (comes with Node.js)
- **Git** for version control

## Quick Start (5 Minutes)

### 1. Clone and Configure

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd jam-stack-application

# Create environment configuration
cp .env.example .env
```

### 2. Start All Services

```bash
# Start all services in development mode
npm run dev

# Or rebuild if this is your first time
npm run dev:build
```

This single command starts:
- ✅ 3 PostgreSQL databases
- ✅ 3 Backend microservices (Auth, Todos, Fundflow)
- ✅ 1 Next.js frontend (with BFF API Routes)
- ✅ Mailpit email testing tool

### 3. Access the Application

**Wait 30-60 seconds** for all services to start, then access:

- **Frontend (Main App)**: http://localhost:3010
- **Mailpit (Emails)**: http://localhost:8030

**Health Checks:**
- Auth: http://localhost:3011/health
- Todos: http://localhost:3002/health
- Fundflow: http://localhost:3003/health

All should return `{"status":"healthy"}`.

## Detailed Setup

### Understanding the Architecture

This application uses a **microservices architecture**:

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────┐
│    Next.js      │
│   Frontend      │
│  (port 3010)    │
├─────────────────┤
│  API Routes     │  ◄─── BFF Layer
│  (gRPC clients) │
└────────┬────────┘
         │ gRPC
         ├────────┬────────┬────────┐
         ▼        ▼        ▼        ▼
     ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐
     │ Auth │ │Todos │ │Fund  │ │Mail   │
     │      │ │      │ │flow  │ │pit    │
     └───┬──┘ └───┬──┘ └───┬──┘ └───────┘
         │        │        │
         ▼        ▼        ▼
      ┌────┐   ┌────┐   ┌────┐
      │DB  │   │DB  │   │DB  │
      └────┘   └────┘   └────┘
```

**Key Benefits:**
- Each service scales independently
- Database-per-service isolation
- gRPC for fast inter-service communication
- Next.js BFF pattern for type-safe API layer
- Single entry point (Next.js frontend)

### Environment Configuration

The `.env` file controls all ports and configuration. Default values:

```bash
# Deployment mode
NODE_ENV=production

# Database ports
AUTH_DB_PORT=5433
SHARED_DB_PORT=5435
FUNDFLOW_DB_PORT=5434

# Service ports (HTTP for debugging, gRPC for communication)
AUTH_HTTP_PORT=3011
AUTH_GRPC_PORT=50051
TODOS_HTTP_PORT=3002
TODOS_GRPC_PORT=50052
FUNDFLOW_HTTP_PORT=3003
FUNDFLOW_GRPC_PORT=50053

# Frontend
FRONTEND_PORT=3010

# Email testing
MAILPIT_UI_PORT=8030
MAILPIT_SMTP_PORT=1030
```

**Change ports if needed:**
```bash
# Edit .env
FRONTEND_PORT=4000  # Change frontend to port 4000
```

### Service Profiles

The unified `docker-compose.yml` supports selective service startup:

```bash
# All development services
npm run dev

# All production services (no Mailpit)
npm run prod

# Individual services
npm run service:auth      # Just auth service + database
npm run service:todos     # Just todos service + database
npm run service:frontend  # Just frontend (requires services to be running)

# Custom combinations
docker compose --profile auth --profile frontend up
```

### Database Management

#### Accessing Databases

```bash
# Auth database
docker exec -it jam-auth-db psql -U postgres -d auth

# Todos database (shared)
docker exec -it jam-shared-db psql -U postgres -d shared

# Fundflow database
docker exec -it jam-fundflow-db psql -U postgres -d fundflow
```

#### Migrations

Migrations run automatically on first container start:

```bash
# Location of migration files
services/auth-service/migrations/
services/todos-service/migrations/
services/fundflow-service/migrations/
```

**Manual migration** (within service directory):
```bash
cd services/auth-service
npm run migrate
```

#### Database Volumes

Data persists in Docker volumes:
- `jam-stack-microservices_auth-db-data`
- `jam-stack-microservices_shared-db-data`
- `jam-stack-microservices_fundflow-db-data`

**Backup a database:**
```bash
docker run --rm \
  -v jam-stack-microservices_auth-db-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/auth-db-backup.tar.gz -C /data .
```

**Restore from backup:**
```bash
docker run --rm \
  -v jam-stack-microservices_auth-db-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/auth-db-backup.tar.gz -C /data
```

### Development Workflow

#### Making Code Changes

Different components require different rebuild strategies:

**Backend Services:**
```bash
# Code changes require rebuild
npm run dev:build

# Or restart specific service
docker compose restart auth-service
```

**Frontend:**
```bash
# For development with hot-reload, run frontend standalone
cd frontend
npm run dev

# Or rebuild the container
npm run dev:build
```

**Shared Packages:**
```bash
# Changes in packages/ require rebuilding dependent services
cd packages/database-engine
npm run build

# Then rebuild services that use it
npm run dev:build
```

**gRPC Protocols:**
```bash
# Regenerate proto files
npm run proto:generate

# Rebuild affected services
npm run dev:build
```

#### Viewing Logs

```bash
# All services
npm run logs

# Specific service
npm run logs:auth
npm run logs:frontend
npm run logs:kong

# Or use Docker Compose directly
docker compose logs -f auth-service
docker compose logs -f frontend --tail=100
```

#### Stopping Services

```bash
# Stop (preserves data)
npm stop

# Stop and remove containers (preserves volumes/data)
npm run dev:down

# Nuclear option - removes EVERYTHING including data
npm run clean
```

### Testing the Setup

#### 1. Verify All Services Running

```bash
docker ps
```

Should show 8 containers running:
- jam-auth-db, jam-shared-db, jam-fundflow-db (databases)
- jam-auth-service, jam-todos-service, jam-fundflow-service (services)
- jam-frontend (Next.js with BFF)
- jam-mailpit (email)

#### 2. Health Check All Services

```bash
# Check all health endpoints
curl http://localhost:3011/health  # Auth
curl http://localhost:3002/health  # Todos
curl http://localhost:3003/health  # Fundflow
```

Each should return:
```json
{"status":"healthy","timestamp":"...","service":"..."}
```

#### 3. Test Frontend

```bash
# Frontend access
curl http://localhost:3010/ | head -20

# Should return Next.js HTML
```

#### 4. Test Email System

1. Open Mailpit UI: http://localhost:8030
2. You should see the Mailpit dashboard
3. All emails sent by the app appear here during development

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker ps

# Check for port conflicts
sudo lsof -i :3010  # Frontend
sudo lsof -i :50051 # Auth gRPC
sudo lsof -i :5433  # Auth DB

# View service status
docker compose ps

# Check logs for errors
docker compose logs
```

### Database Connection Errors

```bash
# Verify database is healthy
docker ps | grep -E "jam-(auth|shared|fundflow)-db"

# Should show "(healthy)" in STATUS column

# Check database logs
docker logs jam-auth-db
```

### Build Failures

```bash
# Clean everything and rebuild
npm run clean
npm run dev:build

# If that fails, nuclear option
docker system prune -af --volumes
npm run dev:build
```

### Port Already in Use

Edit `.env` to change ports:
```bash
FRONTEND_PORT=3020
KONG_PROXY_PORT=8020
# ... etc
```

### Services Stuck in Restart Loop

```bash
# Check logs for the failing service
docker logs jam-auth-service --tail=50

# Common issues:
# - Database not ready (wait 30s)
# - Missing environment variables (check .env)
# - Port conflicts (change ports in .env)
```

## Production Deployment

### Environment Setup

```bash
# Create production .env
cp .env.example .env.prod

# Edit for production
NODE_ENV=production
# Set secure database passwords
AUTH_DB_PASSWORD=<secure-password>
SHARED_DB_PASSWORD=<secure-password>
FUNDFLOW_DB_PASSWORD=<secure-password>
```

### Deploy

```bash
# Start in production mode
NODE_ENV=production npm run prod:build
```

### Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use environment-specific .env files
- [ ] Enable SSL/TLS for frontend (HTTPS)
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting in Next.js middleware
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Use secrets management (not .env)
- [ ] Set up proper firewall rules

## Advanced Topics

### Custom Service Combinations

```bash
# Run only backend services (no frontend)
docker compose --profile auth --profile todos --profile fundflow up

# Run frontend + gateway only (assumes services running elsewhere)
docker compose --profile frontend --profile gateway up
```

### Monitoring Resources

```bash
# Real-time resource usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune
```

### Working with Monorepo

```bash
# Install all workspace dependencies
npm run install:all

# Build all packages
npm run build:all

# Run tests across all workspaces
npm run test:all

# Add dependency to specific workspace
npm install express --workspace=services/auth-service
```

## Next Steps

Now that your environment is set up:

1. **Review Architecture**: See `CLAUDE.md` for detailed architecture
2. **Development Guide**: Check `README.md` for available commands
3. **API Documentation**: See `docs/` folder for API specs
4. **Code Standards**: Review existing code patterns

## Getting Help

- **Documentation**: See `CLAUDE.md` for comprehensive guide
- **Migration Guide**: See `MIGRATION.md` if migrating from old setup
- **Common Issues**: Check the Troubleshooting section above
- **Docker Issues**: `docker compose logs` is your friend

## Useful Commands Reference

```bash
# Development
npm run dev                    # Start all services
npm run dev:build              # Rebuild and start
npm start                      # Start in background
npm stop                       # Stop all services

# Production
npm run prod                   # Production mode
npm run prod:build             # Build and deploy

# Logs
npm run logs                   # All logs
npm run logs:auth              # Specific service

# Cleanup
npm run clean                  # Remove containers + volumes
npm run clean:all              # Complete Docker cleanup

# Database
docker exec -it jam-auth-db psql -U postgres -d auth

# Health checks
curl http://localhost:3011/health  # Auth
curl http://localhost:3002/health  # Todos
curl http://localhost:3003/health  # Fundflow
```

---

**Setup Status**: Ready for development!
**Next**: Start coding or review `CLAUDE.md` for architecture details
