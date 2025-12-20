# Authentication Service

Microservice for user authentication, 2FA, and session management.

## Features

- User signup and login
- Email/password authentication
- JWT-based session management
- Two-factor authentication (TOTP)
- Multi-device session tracking
- Login history and audit logs
- Password management
- Profile management

## gRPC Service

The service implements the following RPC methods defined in `auth.proto`:

### Authentication
- `Login` - User login with email/password
- `Signup` - New user registration
- `ValidateToken` - Verify JWT token validity
- `RefreshToken` - Refresh expired access token
- `Logout` - Revoke session

### Two-Factor Authentication
- `Enable2FA` - Generate 2FA secret and QR code
- `Verify2FA` - Verify 2FA setup
- `Disable2FA` - Disable 2FA for user

### Session Management
- `GetSessions` - List all active sessions
- `RevokeSession` - Revoke a specific session

### Profile Management
- `GetProfile` - Get user profile
- `UpdateProfile` - Update display name and avatar

### Password Management
- `ResetPassword` - Initiate password reset
- `ChangePassword` - Change user password

## Environment Variables

```env
# Service Configuration
HTTP_PORT=3001
GRPC_PORT=50051
SERVICE_VERSION=1.0.0

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key

# Logging
NODE_ENV=development
LOGS_DIR=logs
```

## Running the Service

### Standalone (with Docker Compose)
```bash
cd services/auth-service
docker compose up
```

### With All Services
```bash
# From project root
npm run dev
```

### Development
```bash
npm install
npm run dev
```

## HTTP Endpoints

- `GET /` - Service information
- `GET /health` - Full health check
- `GET /liveness` - Liveness probe
- `GET /readiness` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Database Schema

### Tables

**profiles**
- User accounts with credentials
- 2FA settings
- Timestamps

**active_sessions**
- JWT tokens (access + refresh)
- Device information
- Session expiry tracking

**login_history**
- Audit log of login attempts
- Success/failure tracking
- IP and device tracking

## Security Features

- Bcrypt password hashing (10 rounds)
- JWT token expiry (15 min access, 7 day refresh)
- TOTP-based 2FA with QR codes
- Row-level security policies
- Login attempt tracking
- Session management across devices

## Architecture

```
auth-service/
├── src/
│   ├── models/           # Data models (User, Session, LoginHistory)
│   ├── controllers/      # Business logic (AuthController)
│   ├── grpc/
│   │   ├── handlers/     # gRPC request handlers
│   │   └── server.ts     # gRPC server setup
│   ├── utils/            # JWT and 2FA utilities
│   └── app.ts            # Main application entry point
├── migrations/           # Database migrations
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Dependencies

- `@jam/database-engine` - Multi-database abstraction
- `@jam/base-app` - Logging, errors, monitoring
- `@grpc/grpc-js` - gRPC server
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens
- `speakeasy` - TOTP 2FA
- `qrcode` - QR code generation
- `express` - HTTP server
