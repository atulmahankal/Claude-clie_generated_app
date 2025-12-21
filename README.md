# JAM Stack Application

A modular micro-frontend architecture with Python/FastAPI backends, featuring independent services that can be toggled on/off and easily ported to other projects.

## 🏗️ Architecture Overview

This application uses a **micro-frontend architecture** where each service consists of its own:
- **Frontend**: Next.js 16 application with dedicated routing (`basePath`)
- **Backend**: Python 3.12 + FastAPI with REST + gRPC endpoints
- **Database**: PostgreSQL 16 (database-per-service pattern)
- **Protos**: Service-owned gRPC protocol definitions

Services are orchestrated via **Nginx reverse proxy** and communicate through gRPC, while the frontend is exposed via path-based routing.

## 🚀 Tech Stack

### Frontend
- Next.js 16, React 19, TypeScript 5.7
- Tailwind CSS 4
- Custom UI library (`@jam/shared-ui`)
- TanStack Query

### Backend
- Python 3.12, FastAPI, SQLAlchemy 2.0
- gRPC (grpcio)
- JWT Authentication, 2FA (TOTP)

### Infrastructure
- Nginx (reverse proxy)
- PostgreSQL 16
- Docker Compose

## 📦 Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. (Optional) Setup custom hostname like DDEV
sudo ./script.sh setup-hostname

# 3. Start all services
./script.sh dev

# 4. Access application
open http://jamstack.local  # or http://localhost
```

## 🎯 Key Features

- ✅ Micro-frontend architecture with independent services
- ✅ Each service fully self-contained and portable
- ✅ Dynamic service enable/disable via admin panel
- ✅ Nginx reverse proxy with path-based routing
- ✅ Shared UI component library
- ✅ Docker Compose profiles for flexible deployment
- ✅ Python/FastAPI backends with gRPC support
- ✅ Database-per-service pattern

## 📂 Structure

```
├── base_app/              # Unified dashboard & shared components
├── services/
│   ├── auth-service/      # Authentication (/auth)
│   ├── todos-service/     # Task management (/todos)
│   └── fundflow-service/  # Financial tracking (/fundflow)
├── nginx/                 # Reverse proxy config
├── script.sh              # Management script (all commands)
└── docker-compose.yml     # Service orchestration
```

## 🛠️ Management Script

The `script.sh` file provides a comprehensive CLI for managing the application.

**Quick Commands:**
```bash
./script.sh --help          # Show all available commands
./script.sh info            # Show application information
./script.sh health          # Check service health
./script.sh status          # Show container status
```

**Hostname Setup (like DDEV):**
```bash
sudo ./script.sh setup-hostname    # Add jamstack.local to /etc/hosts
./script.sh show-hostname          # Show hostname configuration
sudo ./script.sh remove-hostname   # Remove custom hostname
```

**Service Operations:**
```bash
./script.sh dev             # Development mode
./script.sh prod-build      # Production deployment
./script.sh service auth    # Start auth service only
./script.sh stop            # Stop all services
```

**Database Operations:**
```bash
./script.sh db-connect auth # Connect to auth database
./script.sh db-backup auth  # Backup auth database
./script.sh db-restore auth # Restore from backup
```

See [Workflow.md](./Workflow.md) for complete command reference.

## 🔧 Development

See [Workflow.md](./Workflow.md) for detailed commands and workflows.

```bash
# Show all available commands
./script.sh --help

# Start all services
./script.sh dev

# Start specific service
./script.sh service auth

# View logs
./script.sh logs

# Check health
./script.sh health

# Stop services
./script.sh stop
```

## 🌐 Access Points

### With Custom Hostname (like DDEV)
After running `sudo ./script.sh setup-hostname`:
- **Dashboard**: http://jamstack.local
- **Auth Service**: http://jamstack.local/auth
- **Todos Service**: http://jamstack.local/todos
- **FundFlow Service**: http://jamstack.local/fundflow
- **Email Testing**: http://mailpit.jamstack.local

### Default (localhost)
- **Dashboard**: http://localhost
- **Auth Service**: http://localhost/auth
- **Todos Service**: http://localhost/todos
- **FundFlow Service**: http://localhost/fundflow
- **Email Testing**: http://localhost:8030

## 📚 Documentation

- **[Workflow.md](./Workflow.md)** - Complete development workflow and command reference
- **[CLAUDE.md](./CLAUDE.md)** - Project instructions for AI assistants
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Complete feature list and implementation details

## 🚨 Troubleshooting

```bash
# Check if all services are running
./script.sh status

# View logs for debugging
./script.sh logs
./script.sh logs auth-service

# Rebuild services from scratch
./script.sh rebuild

# Clean and restart everything
./script.sh clean
./script.sh dev-build
```

For more help, run: `./script.sh --help`

## 📝 License

MIT
