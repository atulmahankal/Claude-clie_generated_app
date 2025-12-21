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
- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives (Dialog, Dropdown Menu, Select, etc.)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack Query (React Query) for server state
- **Notifications**: Sonner toast notifications
- **Charts & Visualization**: Recharts
- **HTTP Client**: Native fetch API

### Backend (Microservices)
- **Runtime**: Node.js 20.x (Alpine Linux)
- **Language**: TypeScript 5.x
- **Web Framework**: Express.js
- **Inter-Service Communication**: gRPC (Protocol Buffers)
- **API Exposure**: HTTP/REST + gRPC dual endpoints
- **Database**: PostgreSQL 15 (Alpine)
- **Database Pattern**: Database-per-service
- **Schema Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens)
- **2FA**: TOTP (Time-based One-Time Password)
- **Email**: Nodemailer (SMTP)

### Shared Packages (Monorepo)
- **`@jam/database-engine`**: Multi-database abstraction layer
  - Supports: PostgreSQL, MySQL, MongoDB, SQLite
  - Query builder interface
  - Migration support
- **`@jam/grpc-protos`**: Shared gRPC Protocol Buffer definitions
  - Auth service protos
  - Todos service protos
  - Fundflow service protos
- **`@jam/base-app`**: Shared utilities and base application setup

### Infrastructure & DevOps
- **Containerization**: Docker + Docker Compose
- **Service Orchestration**: Docker Compose profiles (dev, prod, per-service)
- **Networking**: Docker bridge network (jam-network)
- **BFF Pattern**: Next.js API Routes as Backend for Frontend
- **Email Testing**: Mailpit (SMTP + Web UI for development)
- **Database Management**: Adminer (Web-based SQL client)
- **Monorepo**: npm workspaces
- **Version Control**: Git

### Development Tools
- **Package Manager**: npm 10.x
- **Build Tool**: TypeScript compiler (tsc)
- **Code Quality**: ESLint
- **Hot Reload**: ts-node-dev (backend), Next.js Fast Refresh (frontend)
- **API Testing**: REST client support via health endpoints

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
- **Adminer (Database UI)**: http://localhost:8080 (dev mode only)

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

## System Architecture

This is a **microservices-based JAM stack application** following modern cloud-native patterns:

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
│                         (http://localhost:3010)                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTP/HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                                │
│                    BFF - Backend for Frontend                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  App Router Pages (React 19 + TypeScript)                          │    │
│  │  - (auth): Login, Signup, Password Reset                           │    │
│  │  - (dashboard): Todos, Fundflow, Profile                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  API Routes (/app/api/*)                                           │    │
│  │  - /api/auth/*      → gRPC → auth-service:50051                    │    │
│  │  - /api/todos/*     → gRPC → todos-service:50052                   │    │
│  │  - /api/fundflow/*  → gRPC → fundflow-service:50053                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                         Port: 3000 → External: 3010                          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ gRPC (Protocol Buffers)
                                 │ via Docker Network: jam-network
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   AUTH SERVICE    │  │  TODOS SERVICE    │  │ FUNDFLOW SERVICE  │
│   (Node.js 20)    │  │   (Node.js 20)    │  │  (Node.js 20)     │
│                   │  │                   │  │                   │
│ ┌───────────────┐ │  │ ┌───────────────┐ │  │ ┌───────────────┐ │
│ │ Express.js    │ │  │ │ Express.js    │ │  │ │ Express.js    │ │
│ │ + gRPC Server │ │  │ │ + gRPC Server │ │  │ │ + gRPC Server │ │
│ └───────────────┘ │  │ └───────────────┘ │  │ └───────────────┘ │
│                   │  │                   │  │                   │
│ Features:         │  │ Features:         │  │ Features:         │
│ - JWT Auth        │  │ - CRUD Todos      │  │ - Transactions    │
│ - 2FA (TOTP)      │  │ - Lists           │  │ - Categories      │
│ - Sessions        │  │ - Priorities      │  │ - Recurring Bills │
│ - Login History   │  │ - Due Dates       │  │ - Reports         │
│                   │  │                   │  │                   │
│ HTTP: 3001→3011   │  │ HTTP: 3002→3002   │  │ HTTP: 3003→3003   │
│ gRPC: 50051       │  │ gRPC: 50052       │  │ gRPC: 50053       │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                      │
          │ SQL                  │ SQL                  │ SQL
          ▼                      ▼                      ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   AUTH DATABASE   │  │  SHARED DATABASE  │  │ FUNDFLOW DATABASE │
│  (PostgreSQL 15)  │  │  (PostgreSQL 15)  │  │  (PostgreSQL 15)  │
│                   │  │                   │  │                   │
│ Tables:           │  │ Tables:           │  │ Tables:           │
│ - users           │  │ - todo_lists      │  │ - categories      │
│ - profiles        │  │ - todo_items      │  │ - transactions    │
│ - sessions        │  │ - user_lists      │  │ - recurring_txns  │
│ - login_history   │  │                   │  │ - reminders       │
│ - totp_secrets    │  │                   │  │                   │
│                   │  │                   │  │                   │
│ Port: 5433        │  │ Port: 5435        │  │ Port: 5434        │
│ Volume: auth-db   │  │ Volume: shared-db │  │ Volume: fund-db   │
└───────────────────┘  └───────────────────┘  └───────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPPORTING SERVICES (Dev Only)                        │
├───────────────────────────────────┬─────────────────────────────────────────┤
│        MAILPIT (Email Testing)    │      ADMINER (Database UI)              │
│  SMTP: 1025 → External: 1030      │      HTTP: 8080                         │
│  UI:   8025 → External: 8030      │      Access all 3 databases             │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

### Architecture Patterns

#### 1. **Microservices Architecture**
Each service is independently deployable and scalable:
- **Auth Service**: User authentication, authorization, 2FA, session management
- **Todos Service**: Todo list and item management with priorities
- **Fundflow Service**: Financial transaction tracking and reporting

#### 2. **Database-per-Service Pattern**
Each microservice owns its database, ensuring:
- **Service Independence**: Services can be developed, deployed, and scaled independently
- **Technology Flexibility**: Each service can choose its optimal database technology
- **Failure Isolation**: Database issues in one service don't cascade to others
- **Clear Ownership**: Data ownership and access patterns are explicit

#### 3. **BFF (Backend for Frontend) Pattern**
Next.js API Routes serve as the BFF layer:
- **Type Safety**: End-to-end TypeScript from browser to backend services
- **SSR/SSG Support**: Server-side rendering with direct gRPC access
- **Protocol Translation**: Maps REST/HTTP (browser-friendly) to gRPC (service-efficient)
- **Request Aggregation**: Single frontend request can fan out to multiple services
- **Authentication**: Centralized auth middleware before reaching backend services
- **Error Handling**: Unified error formatting for frontend consumption

#### 4. **Communication Patterns**

**Browser ↔ Frontend:**
- Protocol: HTTP/HTTPS
- Format: JSON
- Tools: Fetch API, TanStack Query

**Frontend ↔ Backend Services:**
- Protocol: gRPC (via Next.js API Routes)
- Format: Protocol Buffers (binary)
- Ports: 50051 (Auth), 50052 (Todos), 50053 (Fundflow)
- Network: Docker internal network (jam-network)

**Services ↔ Databases:**
- Protocol: PostgreSQL wire protocol
- Connection Pool: Managed per service
- Abstraction: @jam/database-engine package

#### 5. **Monorepo Structure**
npm workspaces enable code sharing and unified dependency management:

```
jam-stack-microservices/
├── frontend/                    # Next.js application (BFF Pattern)
│   ├── src/
│   │   ├── app/                # App Router pages & API routes
│   │   │   ├── (auth)/         # Auth route group
│   │   │   ├── (dashboard)/    # Protected routes
│   │   │   └── api/            # BFF API endpoints
│   │   ├── components/         # React components
│   │   │   └── ui/             # Radix UI primitives
│   │   ├── lib/                # Utilities
│   │   │   ├── api/            # API client functions
│   │   │   ├── grpc/           # gRPC client setup
│   │   │   └── hooks/          # React Query hooks
│   │   └── types/              # TypeScript types
│   └── Dockerfile
│
├── services/                   # Backend microservices
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── app.ts          # Express + gRPC server
│   │   │   ├── controllers/    # HTTP handlers
│   │   │   ├── grpc/           # gRPC implementations
│   │   │   ├── models/         # Database models
│   │   │   └── utils/          # Auth utilities
│   │   ├── migrations/         # SQL migrations
│   │   └── Dockerfile
│   ├── todos-service/          # Similar structure
│   └── fundflow-service/       # Similar structure
│
├── packages/                   # Shared packages
│   ├── database-engine/        # Multi-DB abstraction
│   │   ├── src/
│   │   │   ├── factories/      # Database factory
│   │   │   ├── adapters/       # DB-specific adapters
│   │   │   └── query-builder/  # Query builder
│   │   └── package.json
│   ├── grpc-protos/            # gRPC definitions
│   │   ├── proto/              # .proto files
│   │   │   ├── auth.proto
│   │   │   ├── todos.proto
│   │   │   └── fundflow.proto
│   │   ├── generated/          # Generated TypeScript
│   │   └── package.json
│   └── base-app/               # Shared utilities
│
├── docker-compose.yml          # Unified deployment
├── .env.example                # Configuration template
├── CLAUDE.md                   # Developer documentation
└── package.json                # Workspace root
```

### Port Mapping Reference

| Service | Internal | External | gRPC | Purpose |
|---------|----------|----------|------|---------|
| Frontend | 3000 | 3010 | - | User interface |
| Auth Service | 3001 | 3011* | 50051 | Authentication |
| Todos Service | 3002 | 3002* | 50052 | Todo management |
| Fundflow Service | 3003 | 3003* | 50053 | Finance tracking |
| Auth DB | 5432 | 5433 | - | Auth database |
| Shared DB | 5432 | 5435 | - | Todos database |
| Fundflow DB | 5432 | 5434 | - | Finance database |
| Mailpit SMTP | 1025 | 1030 | - | Email sending |
| Mailpit UI | 8025 | 8030 | - | Email testing |
| Adminer | - | 8080 | - | DB management |

*HTTP ports for debugging/health checks only. Frontend uses gRPC ports for service communication.

### Design Decisions

#### Why gRPC for Inter-Service Communication?
- **Performance**: Binary protocol is 7-10x faster than JSON
- **Type Safety**: Protocol buffers provide compile-time type checking
- **Streaming**: Supports bidirectional streaming for real-time features
- **Code Generation**: Automatic client/server code generation
- **Backward Compatibility**: Built-in versioning support

#### Why Next.js as BFF?
- **Unified Stack**: Single TypeScript codebase for frontend and API layer
- **SSR/SSG**: Server-side rendering with direct backend access
- **API Routes**: Built-in API endpoint support
- **Developer Experience**: Hot module replacement, TypeScript support
- **Deployment**: Can deploy as single unit or separate frontend/API layers

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

### Database Access

#### Using Adminer (Web UI)

Access Adminer at http://localhost:8080 when running in dev mode. Login credentials for each database:

**Auth Database:**
- System: PostgreSQL
- Server: `auth-db`
- Username: `postgres`
- Password: `postgres`
- Database: `auth`

**Todos Database:**
- System: PostgreSQL
- Server: `shared-db`
- Username: `postgres`
- Password: `postgres`
- Database: `shared`

**Fundflow Database:**
- System: PostgreSQL
- Server: `fundflow-db`
- Username: `postgres`
- Password: `postgres`
- Database: `fundflow`

#### Using Command Line (psql)

```bash
# Auth database
docker exec -it jam-auth-db psql -U postgres -d auth

# Todos database
docker exec -it jam-shared-db psql -U postgres -d shared

# Fundflow database
docker exec -it jam-fundflow-db psql -U postgres -d fundflow
```

#### Using External DB Client

Connect with tools like pgAdmin, DBeaver, TablePlus, or DataGrip:
- Auth DB: `localhost:5433`
- Todos DB: `localhost:5435`
- Fundflow DB: `localhost:5434`
- Username: `postgres`
- Password: `postgres`

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
