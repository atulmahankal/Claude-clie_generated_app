# Old Architecture Files & Directories

This directory contains the complete previous JAM stack architecture (before restructuring to micro-frontends).

## Directories

### Old Service Architecture
- **frontend/** - Old unified Next.js frontend (now split into service-specific frontends)
- **packages/** - Old shared packages:
  - `grpc-protos/` - Centralized protos (now service-owned in `services/*/protos/`)
  - `database-engine/` - Multi-DB abstraction (functionality moved to Python backends)
  - `base-app/` - Old shared utilities

### Old Infrastructure
- **docker/** - Old Docker configurations
- **nginx.conf** - Old Nginx config (now in `nginx/nginx.conf`)
- **Dockerfile, Dockerfile.dev** - Old unified Docker builds

### Other Directories
- **docs/** - Old documentation
- **tests/** - Old test files
- **supabase/** - Supabase configuration (if used)

## Configuration Files
- **.dockerignore** - Old Docker ignore rules
- **docker-compose.old.yml** - Previous Docker Compose configuration
- **.env.example.old** - Old environment template
- **package-lock.json** - Old npm lock file (referenced old workspace structure)
- **package.json** - Old npm workspace configuration (replaced by script.sh)

## Documentation Files
- **README.old.md** - Previous README
- **Workflow.old.md** - Previous workflow guide
- **MIGRATION.md** - Migration documentation
- **SETUP.md** - Old setup guide
- **DOCKER.md** - Docker documentation

## Migration Date
December 22, 2024

## New Architecture Location
See root directory for new structure:
- `base_app/` - Unified dashboard, shared UI, service config API
- `services/` - Independent microservices (auth, todos, fundflow)
- `nginx/` - Reverse proxy configuration
- `docker-compose.yml` - New micro-frontend orchestration

## Note
These files are kept for reference and can be safely deleted once you've verified the new architecture works for your needs.
