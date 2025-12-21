# Development Workflow

Complete guide for working with the JAM Stack micro-frontend architecture.

## 🚀 Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. (Optional) Setup custom hostname like DDEV
sudo ./script.sh setup-hostname

# 3. Start all services
./script.sh dev

# 4. Access application
# - With hostname: http://jamstack.local
# - Default: http://localhost

# Show all available commands
./script.sh --help
```

## 📦 Service Management

### Starting Services

```bash
# All services (development)
./script.sh dev

# All services with rebuild
./script.sh dev-build

# Production mode
./script.sh prod
./script.sh prod-build
```

### Individual Services

```bash
./script.sh service base      # Base app only
./script.sh service auth      # Auth service
./script.sh service todos     # Todos service
./script.sh service fundflow  # Fundflow service

# Multiple services
./script.sh service "auth todos"      # Auth + Todos
./script.sh service "auth todos" -d   # Detached mode
```

### Docker Compose Profiles

```bash
# Combine services
docker compose --profile auth --profile todos up

# Development with Mailpit
docker compose --profile dev up

# Production
docker compose --profile prod up -d
```

## 🔧 Development Commands

```bash
# View logs (all services)
./script.sh logs

# View logs (specific service)
./script.sh logs auth-service

# Check service health
./script.sh health

# Check container status
./script.sh status

# Restart services
./script.sh restart

# Stop services
./script.sh stop

# Clean up (removes volumes - requires confirmation)
./script.sh clean
```

## 💻 Frontend Development

```bash
cd services/auth-service/frontend

npm install      # Install dependencies
npm run dev      # Development server
npm run build    # Production build
```

## 🐍 Backend Development

```bash
cd services/auth-service/backend

python -m venv venv                    # Create venv
source venv/bin/activate               # Activate
pip install -r requirements.txt       # Install deps
uvicorn src.main:app --reload         # Run dev server
```

## 🗄️ Database Access

```bash
# Connect to database
docker exec -it jam-auth-db psql -U postgres -d auth

# Backup database
docker exec jam-auth-db pg_dump -U postgres auth > backup.sql

# Restore database
docker exec -i jam-auth-db psql -U postgres auth < backup.sql
```

## 🗄️ Database Management

```bash
# Connect to database
./script.sh db-connect auth
./script.sh db-connect todos
./script.sh db-connect fundflow

# Backup database
./script.sh db-backup auth

# Restore database
./script.sh db-restore auth backup_file.sql
```

## 🌐 Hostname Configuration (Like DDEV)

Setup custom hostnames to access your application with friendly URLs instead of localhost.

### Setup Hostname

```bash
# Check current hostname configuration
./script.sh show-hostname

# Setup custom hostname (requires sudo)
sudo ./script.sh setup-hostname

# This adds the following to /etc/hosts:
# 127.0.0.1    jamstack.local
# 127.0.0.1    mailpit.jamstack.local
```

### Access URLs

After setup, access your application at:
- **Main App**: http://jamstack.local
- **Auth**: http://jamstack.local/auth
- **Todos**: http://jamstack.local/todos
- **Fundflow**: http://jamstack.local/fundflow
- **Mailpit**: http://mailpit.jamstack.local

### Customize Hostname

Edit `.env` file to change the hostname:

```bash
# .env
APP_HOSTNAME=myapp.local
MAILPIT_HOSTNAME=mailpit.myapp.local
```

Then run:
```bash
sudo ./script.sh setup-hostname
```

### Remove Hostname

```bash
# Remove custom hostname from /etc/hosts
sudo ./script.sh remove-hostname
```

## 🔍 Troubleshooting

```bash
# Check service status
./script.sh status

# Check health endpoints
./script.sh health

# View logs for debugging
./script.sh logs
./script.sh logs auth-service

# Rebuild without cache
./script.sh rebuild

# Execute command in container
./script.sh exec auth-service sh

# Test endpoints manually
curl http://localhost/health
curl http://localhost:3001/health
```

## 📚 Available Commands

Run `./script.sh --help` to see all available commands.

**Quick Reference:**

| Command | Description |
|---------|-------------|
| `dev` | Start all services in development mode |
| `dev-build` | Rebuild and start all services |
| `prod` | Start production services (detached) |
| `prod-build` | Rebuild and start production |
| `service <name>` | Start specific service(s) |
| `stop` | Stop all services |
| `restart` | Restart all services |
| `clean` | Stop and remove volumes (with confirmation) |
| `logs [service]` | View logs (follow mode) |
| `status` | Show container status |
| `health` | Check service health endpoints |
| `db-connect <svc>` | Connect to service database |
| `db-backup <svc>` | Backup database to file |
| `db-restore <svc>` | Restore database from file |
| `setup-hostname` | Add custom hostname to /etc/hosts (requires sudo) |
| `show-hostname` | Show hostname configuration |
| `remove-hostname` | Remove custom hostname (requires sudo) |
| `exec <container>` | Execute command in container |
| `rebuild` | Rebuild without cache |
| `info` | Show application information |
| `--help` | Show detailed help |

For complete command documentation, run: `./script.sh --help`

---

See [README.md](./README.md) for architecture overview.
