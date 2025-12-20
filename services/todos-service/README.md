# Todos Service

Microservice for managing todo lists and todo items.

## Features

- Todo list management (CRUD)
- Todo item management (CRUD)
- Todo completion tracking
- Priority levels (low, medium, high, urgent)
- Due date tracking
- Overdue todo detection
- User statistics

## gRPC Service

The service implements the following RPC methods defined in `todos.proto`:

### List Operations
- `CreateList` - Create a new todo list
- `GetLists` - Get all lists for a user
- `GetList` - Get a specific list with stats
- `UpdateList` - Update list properties
- `DeleteList` - Delete a list and all its todos

### Todo Operations
- `CreateTodo` - Create a new todo item
- `GetTodos` - Get todos in a list (with filters)
- `GetTodo` - Get a specific todo
- `UpdateTodo` - Update todo properties
- `DeleteTodo` - Delete a todo
- `ToggleTodo` - Toggle completion status

## Environment Variables

```env
# Service Configuration
HTTP_PORT=3002
GRPC_PORT=50052
SERVICE_VERSION=1.0.0

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shared
DB_USER=postgres
DB_PASSWORD=postgres

# Logging
NODE_ENV=development
LOGS_DIR=logs
```

## Running the Service

### Standalone (with Docker Compose)
```bash
cd services/todos-service
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

**todo_lists**
- User's todo lists
- Customizable color and icon
- Sortable order
- Automatic todo counts

**todos**
- Individual todo items
- Belongs to a list
- Priority levels
- Due dates
- Completion tracking

## Features

### Priority Levels
- `low` - Low priority
- `medium` - Normal priority (default)
- `high` - Important
- `urgent` - Critical

### Filtering
- Active todos only
- Completed todos only
- By priority
- Overdue todos
- Due today

### Statistics
- Total todos
- Completed count
- Active count
- Overdue count

## Architecture

```
todos-service/
├── src/
│   ├── models/           # Data models (TodoList, Todo)
│   ├── controllers/      # Business logic (TodosController)
│   ├── grpc/
│   │   ├── handlers/     # gRPC request handlers
│   │   └── server.ts     # gRPC server setup
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
- `express` - HTTP server

## Database Choice

This service uses the **shared database** as it primarily performs simple CRUD operations and doesn't require the isolation that auth or fundflow services need.
