# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **microservices-based JAM stack application** with a Next.js frontend communicating with backend services via gRPC. Kong serves as the API gateway for HTTP/REST routing.

### Key Components

1. **Frontend** (`frontend/`): Next.js 16 application using App Router, React 19, TypeScript, and Tailwind CSS
2. **Backend Services** (`services/`):
   - `auth-service`: Authentication with 2FA (PostgreSQL)
   - `todos-service`: Todo management (PostgreSQL)
   - `fundflow-service`: Financial tracking (PostgreSQL)
3. **Shared Packages** (`packages/`):
   - `database-engine`: Multi-database abstraction layer (PostgreSQL, MySQL, MongoDB, SQLite)
   - `grpc-protos`: gRPC protocol buffer definitions
   - `base-app`: Shared utilities and base application setup
4. **API Gateway**: Kong (port 8010) routes HTTP requests to services
5. **Databases**: Each service has its own PostgreSQL database (database-per-service pattern)

### Communication Patterns

- **Frontend ↔ Backend**: gRPC (development) via environment variables:
  - `AUTH_SERVICE_URL=auth-service:50051`
  - `TODOS_SERVICE_URL=todos-service:50052`
  - `FUNDFLOW_SERVICE_URL=fundflow-service:50053`
- **External HTTP ↔ Services**: Kong gateway routes `/api/auth`, `/api/todos`, `/api/fundflow` to respective services
- **Frontend HTTP**: Kong routes `/` to the Next.js frontend on port 3000

### Port Mapping

| Service | Internal Port | External Port | gRPC Port | External gRPC |
|---------|---------------|---------------|-----------|---------------|
| Frontend | 3000 | 3010 | - | - |
| Auth Service | 3001 | 3011 | 50051 | 50051 |
| Todos Service | 3002 | 3002 | 50052 | 50052 |
| Fundflow Service | 3003 | 3003 | 50053 | 50053 |
| Kong Gateway | 8000/8001 | 8010/8011 | - | - |
| Mailpit UI | 8025 | 8030 | - | - |
| Mailpit SMTP | 1025 | 1030 | - | - |
| Auth DB | 5432 | 5433 | - | - |
| Todos DB | 5432 | 5435 | - | - |
| Fundflow DB | 5432 | 5434 | - | - |

## Development Commands

### Starting the Application

```bash
# Development - Start all services (foreground)
npm run dev

# Development - Rebuild and start (after code/dependency changes)
npm run dev:build

# Development - Start in background (detached)
npm start

# Stop all services
npm stop

# Stop and remove containers (preserves volumes)
npm run dev:down
```

### Production Deployment

```bash
# Production - Start all services in background
npm run prod

# Production - Rebuild and start
npm run prod:build

# Production - Stop services
npm run prod:down
```

### Individual Service Development

```bash
# Start specific services for isolated testing
npm run service:auth      # Auth service + database
npm run service:todos     # Todos service + database
npm run service:fundflow  # Fundflow service + database
npm run service:frontend  # Frontend only (requires services running)
npm run service:gateway   # Kong gateway only

# Multiple services using Docker Compose directly
docker compose --profile auth --profile todos up
```

### Viewing Logs

```bash
# All services
npm run logs

# Specific service
npm run logs:auth
npm run logs:todos
npm run logs:fundflow
npm run logs:frontend
npm run logs:kong

# Docker Compose logs for any service
docker compose logs -f [service-name]
```

### Service Management

```bash
# Restart all running services
npm run restart

# Restart specific service
docker compose restart auth-service
docker compose restart frontend
```

### Frontend Development

```bash
cd frontend
npm run dev    # Start Next.js dev server
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

### Backend Service Development

Each service (`services/auth-service`, `services/todos-service`, `services/fundflow-service`) has:

```bash
npm run dev      # Start with hot reload (ts-node-dev)
npm run build    # Compile TypeScript
npm run start    # Run compiled JavaScript
npm run test     # Run tests
npm run migrate  # Run database migrations
```

### Working with gRPC Protocols

```bash
# Regenerate gRPC code from .proto files (after modifying .proto files)
npm run proto:generate

# Individual proto generation
cd packages/grpc-protos
npm run proto:auth
npm run proto:todos
npm run proto:fundflow
```

### Monorepo Management

```bash
# Install all dependencies across workspaces
npm run install:all

# Build all packages and services
npm run build:all

# Run tests across all workspaces
npm run test:all
```

## Database Management

### Database Access

```bash
# Connect to databases directly
docker exec -it jam-auth-db psql -U postgres -d auth
docker exec -it jam-shared-db psql -U postgres -d shared
docker exec -it jam-fundflow-db psql -U postgres -d fundflow

# List all tables in a database
docker exec -it jam-auth-db psql -U postgres -d auth -c "\dt"

# View database connection info (from service logs)
docker logs jam-auth-service | grep "Database connected"
```

### Migrations

- Migration files are in `services/[service-name]/migrations/`
- Migrations auto-run on container startup via `docker-entrypoint-initdb.d`
- Initial migrations run only on first container creation (not on restart)
- For manual migration: `npm run migrate` within each service directory
- Database volumes persist data between container restarts (`auth-db-data`, `shared-db-data`, `fundflow-db-data`)

### Database Engine Usage

The custom `@jam/database-engine` package provides a unified interface:

```typescript
import { DatabaseFactory, createDatabaseFromEnv } from '@jam/database-engine';

// Create from environment variables
const db = createDatabaseFromEnv();
await db.connect();

// Use query builder
const users = await db.table('users')
  .where('email', 'test@example.com')
  .first();

// Raw queries
const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);
```

Supports: PostgreSQL (default), MySQL, MongoDB, SQLite. Configure via environment variables:
- `DB_TYPE`: postgres | mysql | mongodb | sqlite
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## Project Structure Details

### Workspace Organization

This is an **npm workspaces** monorepo. Packages reference each other using workspace protocol:

```json
"dependencies": {
  "@jam/database-engine": "*",
  "@jam/grpc-protos": "*",
  "@jam/base-app": "*"
}
```

To add a dependency to a specific workspace:
```bash
npm install <package> --workspace=services/auth-service
```

### Frontend Architecture

- **App Router**: Route groups `(auth)` for login/signup, `(dashboard)` for protected pages
- **API Layer**: `frontend/src/lib/api/` contains API client functions
- **Hooks**: `frontend/src/lib/hooks/` for React Query hooks (e.g., `use-auth.ts`)
- **UI Components**: Radix UI primitives in `frontend/src/components/ui/`
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form + Zod validation

### Backend Service Structure

Each microservice follows this pattern:

```
services/[service-name]/
├── src/
│   ├── app.ts              # Express + gRPC server setup
│   ├── controllers/        # HTTP endpoint handlers
│   ├── grpc/              # gRPC service implementations
│   ├── models/            # Database models
│   └── utils/             # Service-specific utilities
├── migrations/            # SQL migration files
├── Dockerfile
└── package.json
```

### Configuration Files

- **Docker Compose**:
  - `docker-compose.yml`: Unified configuration with profiles for dev/prod and individual services
  - Supports selective service activation via profiles
- **Kong Gateway**: `docker/kong/kong.yml` defines routing rules
- **Environment Variables**:
  - `.env`: Configuration file (copy from `.env.example`)
  - All ports and passwords are configurable via environment variables
  - Frontend: Uses `AUTH_SERVICE_URL`, `TODOS_SERVICE_URL`, `FUNDFLOW_SERVICE_URL`
  - Services: Use `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `GRPC_PORT`, `HTTP_PORT`

### Docker Compose Profiles

The unified `docker-compose.yml` uses profiles for flexible deployment:

- **`dev`**: All services including Mailpit (email testing)
- **`prod`**: All production services (excludes Mailpit)
- **`auth`**: Authentication service + auth-db
- **`todos`**: Todos service + shared-db
- **`fundflow`**: Fundflow service + fundflow-db
- **`frontend`**: Frontend application only
- **`gateway`**: Kong API gateway only
- **`mail`**: Mailpit email testing tool

Combine profiles for custom setups:
```bash
docker compose --profile auth --profile frontend up
```

## Testing and Debugging

### Accessing Services

- **Frontend**: http://localhost:3010 (via Kong: http://localhost:8010/)
- **Kong Admin API**: http://localhost:8011
- **Mailpit UI**: http://localhost:8030 (email testing)
- **Individual Services**:
  - Auth: http://localhost:3011
  - Todos: http://localhost:3002
  - Fundflow: http://localhost:3003

### Health Checks

```bash
# Check all running containers
docker ps

# View logs (streaming)
docker logs -f jam-frontend
docker logs -f jam-auth-service
docker logs -f jam-kong

# Check service health endpoints
curl http://localhost:3011/health  # Auth service
curl http://localhost:3002/health  # Todos service
curl http://localhost:3003/health  # Fundflow service

# Check Kong routes
curl http://localhost:8011/services
curl http://localhost:8011/routes

# Test complete request flow through Kong
curl http://localhost:8010/           # Should return Next.js frontend
curl http://localhost:8010/api/auth   # Routes to auth-service
```

### Common Issues

1. **Kong route resolution fails**: Verify service names in `docker/kong/kong.yml` match container names in docker-compose
2. **gRPC connection errors**: Ensure `*_SERVICE_URL` environment variables use internal Docker network hostnames, not localhost
3. **Database connection fails**: Check if databases are healthy: `docker ps` should show "healthy" status
4. **Port conflicts**: Default ports are 3010 (frontend via Kong), 8010 (Kong proxy), 3011/3002/3003 (services)
5. **Build cache issues**: If services don't reflect code changes, rebuild with `npm run dev:build` (includes `--build` flag)
6. **Service startup order**: Services wait for databases to be healthy before starting (see `depends_on` in docker-compose)

## Important Technical Decisions

### Why Database-Per-Service?

Each microservice maintains its own database to ensure:
- **Service Independence**: Services can scale independently
- **Technology Flexibility**: Each service can use different database technologies via `database-engine`
- **Failure Isolation**: Database issues in one service don't affect others

### Why gRPC for Inter-Service Communication?

- **Performance**: Binary protocol is faster than JSON/REST
- **Type Safety**: Protocol buffers provide strong typing across services
- **Streaming**: Supports bidirectional streaming (planned for real-time features)

Currently services expose both:
- **gRPC** (ports 50051-50053): For inter-service communication
- **HTTP/REST** (ports 3001-3003): For direct access and Kong routing

### Kong as API Gateway

Kong provides:
- **Unified Entry Point**: Single port (8010) for all frontend HTTP requests
- **CORS Handling**: Centralized CORS configuration
- **Future Extensions**: Rate limiting, authentication, logging can be added as plugins

## Technology Versions

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Next.js**: 16.1.0
- **React**: 19.2.3
- **TypeScript**: 5.x
- **PostgreSQL**: 15
- **Kong**: 3.4
- **Docker**: Alpine-based images (node:20-alpine)

## Development Workflow Tips

### Making Code Changes

1. **Backend services**: Code changes require container rebuild (`npm run dev:build`)
2. **Frontend**: Next.js production build is cached; rebuild container for changes
3. **Shared packages** (`packages/*`): Changes require rebuilding dependent services
4. **gRPC protos**: Run `npm run proto:generate` then rebuild affected services
5. **Kong config** (`docker/kong/kong.yml`): Restart Kong container: `docker restart jam-kong`

### Inspecting Running Services

```bash
# Enter a running container
docker exec -it jam-auth-service sh
docker exec -it jam-frontend sh

# Check environment variables
docker exec jam-auth-service env | grep DB_

# Monitor all container logs simultaneously
docker compose logs -f

# View resource usage
docker stats
```

### Cleaning Up

```bash
# Stop all services
npm stop

# Stop and remove containers, networks (preserves volumes)
npm run dev:down

# Remove all containers, networks, AND volumes (DESTRUCTIVE - deletes data)
npm run clean

# Full system cleanup: images, containers, volumes, networks (VERY DESTRUCTIVE)
npm run clean:all

# Remove only orphaned volumes
docker volume prune

# Remove only stopped containers
docker container prune
```
