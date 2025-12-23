# IMPLEMENTATION_TODO

Generated: 2025-12-23

This file summarizes current completed work and remaining implementation tasks (collected from IMPLEMENTATION_COMPLETE.md and code TODO/FIXME comments).

---

### Phase 1: Core App

- [x] Core system scaffolding and orchestration
  - [x] Micro-frontend architecture with path-based routing (Nginx).
  - [x] Docker Compose orchestration with profiles and management script (script.sh).
  - [x] Mailpit integration for email testing.
- [x] Backend & infra foundations
  - [x] Python/FastAPI backends scaffolded for each service (auth, todos, fundflow) with SQLAlchemy + Alembic migrations.
  - [x] JWT + 2FA utilities and email utilities configured for Mailpit.
- [x] Frontend & shared packages
  - [x] Shared UI component library (@jam/shared-ui) and frontend foundations (Next.js 16, React 19, Tailwind).
- [x] Documentation
  - [x] README.md, Workflow.md, CLAUDE.md, and IMPLEMENTATION_COMPLETE.md.
- [ ] Testing
  - [ ] Backend test
  - [ ] Frontend test

### Phase 2: Auth Service

- [ ] Start and fully implement gRPC server entrypoint
  - [ ] Add server bootstrap in services/auth-service/backend/src/main.py
  - [ ] Load proto definitions and register gRPC service implementations
  - [ ] Ensure environment-driven ports, health endpoint and readiness probe
  - [ ] Implement graceful shutdown and SIG handling
  - [ ] Add structured logging, metrics and request tracing headers
- [ ] Finish frontend auth UI flow (login/signup) and wire 2FA verification to backend
  - [ ] Implement login form + validation and client-side error handling
  - [ ] Implement signup form + email verification and resend flows
  - [ ] Add 2FA (TOTP) setup, QR code display, and verification flow
  - [ ] Provide backup codes and recovery UX
- [ ] Tests
  - [ ] Unit tests for auth utilities (JWT, hashing, TOTP)
  - [ ] Integration test for signup -> email -> 2FA flow
  - [ ] End-to-end test covering login, refresh tokens and logout

### Phase 3: Todos Service

- [ ] Start and fully implement gRPC server entrypoint
  - [ ] Add server bootstrap in services/todos-service/backend/src/main.py
  - [ ] Register Todos gRPC handlers and wire DB connections
  - [ ] Add health and readiness endpoints for the service
- [ ] Implement Todos CRUD and service layer
  - [ ] Define proto messages and RPCs for Todos (create/read/update/delete, list)
  - [ ] Create service layer for Todos operations with transactional safety
  - [ ] Implement controllers: services/todos-service/src/controllers/todos.controller.ts
  - [ ] Add migrations to ensure todos table schema and indexes (user_id, created_at)
  - [ ] Implement pagination, filtering and sorting for list endpoints
- [ ] Wire frontend
  - [ ] Map Next.js API Routes to Todos gRPC client calls with retries and timeout
  - [ ] Add React components and hooks for Todos UI (list, create, edit, delete)
- [ ] Tests
  - [ ] Unit tests for controllers and service layer
  - [ ] Integration tests for gRPC endpoints and DB interactions

### Phase 4: Fundflow Service

- [ ] Start and fully implement gRPC server entrypoint
  - [ ] Add server bootstrap in services/fundflow-service/backend/src/main.py
  - [ ] Register fundflow handlers and ensure DB connections & migrations run
- [ ] Implement Fundflow business logic
  - [ ] Implement monthly trends calculation in services/fundflow-service/src/grpc/handlers/fundflow.handler.ts
  - [ ] Add aggregation queries, grouping by category, month and account
  - [ ] Add caching strategy for expensive aggregations (e.g., Redis) if needed
  - [ ] Add input validation and error handling
- [ ] Tests
  - [ ] Unit tests for calculations and handlers
  - [ ] Integration tests against sample datasets and DB migrations


## Phase 5: Frontend / BFF

- [ ] Connect Next.js API Routes / frontend API layer to gRPC clients (BFF integration)
- [ ] Ensure BFF routes perform proper authentication, error handling, and validation
- [ ] Testing
  - [ ] Backend test
  - [ ] Frontend test

## Phase 6: Testing / CI

- [ ] Add comprehensive tests (unit/integration) for frontend and backend
- [ ] Add CI pipeline to run tests and linters on PRs

## Phase 6: Security & Production Hardening

- [ ] Update JWT secrets and rotate DB passwords
- [ ] Enable SSL/TLS for Nginx and secure cookies
- [ ] Configure monitoring, logging aggregation, and backups

### Other / Misc

- [ ] Audit repository for additional TODO/FIXME comments and triage into above categories
- [ ] Add example environment file (.env) guidance and production notes

## Recommended next actions (priority)

- [ ] Start gRPC servers in backend entrypoints and verify gRPC endpoints are reachable from Next.js API routes.
- [ ] Implement Todos controller & handlers (CRUD + migrations verification).
- [ ] Implement Fundflow monthly trends calculation and add unit tests for it.
- [ ] Wire frontend API routes to gRPC clients and finish auth UI flow (2FA verification).
- [ ] Add test suites and CI, then run security checklist before deploying.

---

If you want, next step can be: run tests, start the dev environment, or open/generate issues for each pending item. Reply with preferred next action or "pick for me".
