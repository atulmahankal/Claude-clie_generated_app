# JAM Stack Application

A full-stack web application built with Next.js 14, Supabase, and Tailwind CSS featuring authentication, todo management, and financial tracking.

## Features

### Authentication
- Email/Password signup & login
- Social login (Google/GitHub OAuth)
- Password reset flow
- Profile management
- Two-factor authentication (2FA)
- Session control (view and logout from devices)
- Login history tracking

### Todo Management
- Create, read, update, delete todos
- Organize todos in lists
- Priority levels (low, medium, high, urgent)
- Due dates
- Real-time synchronization

### Fundflow Tracker
- Income & Expense transaction tracking
- Visual reports and charts
- Recurring transactions (bills, subscriptions)
- Reminders for upcoming payments
- Category management
- Financial dashboard

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack Query (React Query)
- **Notifications**: Sonner
- **Charts**: Recharts

### Backend (Microservices)
- **Runtime**: Node.js 20 (Alpine)
- **Language**: TypeScript 5
- **Framework**: Express.js
- **Communication**: gRPC + HTTP/REST
- **Database**: PostgreSQL 15 (database-per-service)
- **Validation**: Zod
- **Authentication**: JWT + 2FA (TOTP)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Email Testing**: Mailpit (development)
- **Database Abstraction**: Custom multi-DB engine
- **BFF Pattern**: Next.js API Routes for backend communication

## Getting Started

### Prerequisites

- **Docker Desktop** installed and running
- **Node.js** >= 20.0.0 and npm >= 10.0.0
- **Git** for version control

### Quick Start (Docker)

**Ensure Docker Desktop is installed and running** before proceeding.

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and start all containers
# Development mode (with Mailpit email testing):
docker compose --profile dev up --build

# Production mode (without Mailpit):
docker compose --profile prod up --build -d

# 3. Subsequent runs (after first build)
docker compose --profile dev up          # Development
docker compose --profile prod up -d      # Production

# 4. View logs
docker compose logs -f                   # All services
docker compose logs -f auth-service      # Specific service

# 5. Stop services
docker compose down                      # Stop all
docker compose down -v                   # Stop and remove volumes (DESTROYS DATA)
```

**Access the Application:**
- **Frontend**: http://localhost:3010
- **Mailpit (Email Testing)**: http://localhost:8030 (dev mode only)

**Service Health Endpoints:**
- Auth: http://localhost:3011/health
- Todos: http://localhost:3002/health
- Fundflow: http://localhost:3003/health

### Local Installation (Without Docker)

For local development without Docker:

```bash
# 1. Install dependencies for all workspaces
npm install

# 2. Set up local PostgreSQL databases
# Create three databases: auth, shared, fundflow
createdb auth
createdb shared
createdb fundflow

# 3. Configure environment
cp .env.example .env
# Edit .env to point to your local databases:
# DB_HOST=localhost
# AUTH_DB_PORT=5432
# SHARED_DB_PORT=5432
# FUNDFLOW_DB_PORT=5432

# 4. Run database migrations
cd services/auth-service && npm run migrate
cd ../todos-service && npm run migrate
cd ../fundflow-service && npm run migrate

# 5. Start services individually
# Terminal 1 - Auth Service:
cd services/auth-service && npm run dev

# Terminal 2 - Todos Service:
cd services/todos-service && npm run dev

# Terminal 3 - Fundflow Service:
cd services/fundflow-service && npm run dev

# Terminal 4 - Frontend:
cd frontend && npm run dev
```

**Note**: Docker is the recommended approach as it handles all database setup, networking, and service orchestration automatically.

## Architecture

This is a **microservices-based application** with:
- **3 Backend Services**: Auth, Todos, Fundflow (each with dedicated PostgreSQL database)
- **1 Frontend**: Next.js application (serves as BFF - Backend for Frontend)
- **gRPC**: Frontend to backend communication via Next.js API Routes
- **npm Workspaces**: Monorepo structure

### Project Structure

```
jam-stack-microservices/
├── frontend/              # Next.js application (BFF Pattern)
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   │   └── api/      # API Routes (BFF layer)
│   │   ├── components/   # React components
│   │   ├── lib/          # gRPC clients, hooks
│   │   └── types/        # TypeScript types
│   └── Dockerfile
├── services/             # Backend microservices
│   ├── auth-service/     # Authentication + 2FA
│   ├── todos-service/    # Todo management
│   └── fundflow-service/ # Financial tracking
├── packages/             # Shared packages
│   ├── database-engine/  # Multi-DB abstraction
│   ├── grpc-protos/      # gRPC definitions
│   └── base-app/         # Shared utilities
├── docker-compose.yml    # Unified deployment config
├── .env.example          # Configuration template
└── CLAUDE.md             # Developer documentation
```

## Available Scripts

### Development
```bash
npm run dev          # Start all services (development)
npm run dev:build    # Rebuild and start
npm start            # Start in background (detached)
npm stop             # Stop all services
```

### Production
```bash
npm run prod         # Start all services (production)
npm run prod:build   # Rebuild and start (production)
npm run prod:down    # Stop production services
```

### Individual Services
```bash
npm run service:auth      # Auth service only
npm run service:todos     # Todos service only
npm run service:fundflow  # Fundflow service only
npm run service:frontend  # Frontend only
npm run service:gateway   # Kong gateway only
```

### Logs
```bash
npm run logs              # All services
npm run logs:auth         # Auth service
npm run logs:frontend     # Frontend
# ... (todos, fundflow, kong available)
```

### Utilities
```bash
npm run proto:generate    # Regenerate gRPC proto files
npm run build:all         # Build all workspaces
npm run test:all          # Test all workspaces
npm run clean             # Remove containers & volumes
npm run clean:all         # Full system cleanup
```

## Database Architecture

Each microservice has its own PostgreSQL database (database-per-service pattern):

### Auth Database
- Users, profiles, authentication
- Login history, active sessions
- 2FA secrets and backup codes

### Shared Database (Todos)
- Todo lists and items
- Priority levels and due dates
- User assignments

### Fundflow Database
- Transaction categories
- Financial transactions
- Recurring transactions and reminders

**Benefits**: Service independence, technology flexibility, failure isolation.

## Security

- Row Level Security (RLS) policies on all tables
- Server-side validation with Zod
- Session management with automatic expiry
- CSRF protection with SameSite cookies
- 2FA support with TOTP
- Secure password requirements

## Environment Configuration

All ports and database passwords are configurable via environment variables. Copy `.env.example` to `.env` and customize:

```bash
# Key configuration options
NODE_ENV=production              # or 'development'
FRONTEND_PORT=3010               # Frontend port
AUTH_HTTP_PORT=3011              # Auth service HTTP port (for debugging)
AUTH_GRPC_PORT=50051             # Auth service gRPC port
# ... see .env.example for all options
```

**Note**: Frontend communicates with backend services via gRPC through Next.js API Routes (BFF pattern). HTTP ports are exposed only for debugging and health checks.

## Deployment

### Production Deployment

The unified `docker-compose.yml` supports production deployment:

```bash
# Set environment
export NODE_ENV=production

# Start production services
npm run prod:build
```

### Cloud Deployment

For cloud deployment (AWS, GCP, Azure):
1. Build Docker images for each service
2. Push to container registry
3. Deploy using Kubernetes, ECS, or similar
4. Configure environment variables
5. Set up load balancer pointing to frontend
6. Ensure frontend can reach backend services via gRPC (internal network)

### Database Backups

Database volumes persist data. For production:
```bash
# Backup volumes
docker run --rm -v jam-auth-db-data:/data -v $(pwd):/backup alpine tar czf /backup/auth-db-backup.tar.gz -C /data .

# Restore from backup
docker run --rm -v jam-auth-db-data:/data -v $(pwd):/backup alpine tar xzf /backup/auth-db-backup.tar.gz -C /data
```

## Documentation

- **CLAUDE.md** - Comprehensive developer guide with commands and architecture
- **MIGRATION.md** - Docker Compose migration guide
- **.env.example** - Environment variable reference
- **docs/** - Additional technical documentation

## Current Status

✅ **Infrastructure Complete**
- Microservices architecture implemented
- Docker Compose with profiles
- Kong API gateway configured
- Database abstraction layer
- gRPC communication setup

✅ **Authentication Service**
- User registration and login
- JWT-based authentication
- 2FA support (TOTP)
- Health check endpoints

✅ **Frontend Foundation**
- Next.js 16 with App Router
- UI component library (Radix UI)
- TanStack Query integration
- Form handling (React Hook Form)

🚧 **In Progress**
- Todos service implementation
- Fundflow service implementation
- Frontend UI development

## Contributing

This is a personal project. Feel free to fork and customize for your own use.

## License

MIT
