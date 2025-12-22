# Project Overview

This project is a comprehensive JAMstack microservices application designed for scalability, modularity, and ease of development. It leverages a modern technology stack and a monorepo structure to manage multiple interconnected services.

**Key Features:**

*   **Microservices Architecture:** The application is composed of several independent services, each responsible for a specific domain (e.g., authentication, todos, fund management).
*   **Polyglot Backend:** Backends are implemented using a mix of Python (FastAPI) and Node.js (Express.js/TypeScript), chosen based on service requirements.
*   **Next.js Frontends:** Each service requiring a user interface utilizes Next.js with React, providing server-side rendering and a modern frontend development experience.
*   **Shared UI Components:** A `shared-ui` package promotes UI consistency and reusability across all frontends.
*   **Containerization with Docker:** All services are containerized using Docker, ensuring consistent environments from development to production.
*   **Orchestration with Docker Compose:** `docker-compose.yml` defines and links all services, making local development and deployment straightforward.
*   **Nginx Reverse Proxy:** Nginx is used to route traffic to the various frontend and backend services.
*   **PostgreSQL Databases:** Each service has its own dedicated PostgreSQL database.
*   **gRPC Communication:** Inter-service communication often utilizes gRPC for efficient and performant data exchange.
*   **Internal Libraries:** Shared functionalities like base application features, database engine, and gRPC protocol definitions are encapsulated in internal `@jam` packages.

# Building and Running

The project uses Docker and Docker Compose for building and running all services.

## Prerequisites

*   Docker
*   Docker Compose

## Environment Variables

Copy the example environment variables file:
```bash
cp .env.example .env
```
Then, populate the `.env` file with appropriate values.

## Building the Services

To build all service images:
```bash
docker compose build
```

You can also build specific services using profiles. For example, to build only the base application and authentication service:
```bash
docker compose build --profile base --profile auth
```

## Running the Services

To run all services defined in `docker-compose.yml`:
```bash
docker compose up -d
```

To run a subset of services using profiles (e.g., for development of a specific service):
```bash
docker compose up -d --profile base --profile auth
```

The `docker-compose.yml` defines the following profiles: `dev`, `prod`, `base`, `auth`, `todos`, `fundflow`, `mail`.

## Accessing Services

*   **Nginx (Reverse Proxy):** Typically accessible on port `80` (or `NGINX_PORT` if specified in `.env`).
*   **Mailpit (Development Email Server):** Accessible via its UI on port `8030` (or `MAILPIT_UI_PORT`). SMTP listens on `1030` (or `MAILPIT_SMTP_PORT`).

Refer to the `docker-compose.yml` file and the `.env` configuration for specific port mappings.

## Management Script (`script.sh`)

The project includes a comprehensive bash script, `./script.sh`, to streamline development and management tasks. This script provides an interactive menu for common operations and supports direct command execution.

**Key Features:**

*   **Interactive Menu:** Run `./script.sh` without arguments to access an interactive menu for guided operations.
*   **Service Lifecycle Management:** Start, stop, restart, build, and rebuild services (both all services or specific ones) in development or production modes.
*   **Monitoring and Debugging:** View aggregated or service-specific logs, check container status, and perform health checks.
*   **Database Operations:** Connect to service databases, perform backups, and restore from backups.
*   **Hostname Management:** Set up, change, and remove custom local hostnames (e.g., `jamstack.local`) for HTTPS development, leveraging `mkcert`.
*   **Utilities:** Clean up Docker resources (containers, volumes), execute commands inside running containers, pull latest images, and prune unused Docker data.

**Usage:**

To see a list of all available commands and their options, run:
```bash
./script.sh --help
```

For interactive mode:
```bash
./script.sh
```

**Examples:**

*   Start all services in development mode: `./script.sh dev`
*   Start only the authentication and todos services: `./script.sh service "auth todos"`
*   View logs for the authentication service: `./script.sh logs auth-service`
*   Set up local custom hostnames (requires `sudo` for `/etc/hosts` modification): `sudo ./script.sh setup-hostname`

# Development Conventions

## Language and Frameworks

*   **Frontend:** Next.js with React and TypeScript. Styling with Tailwind CSS.
*   **Python Backends:** FastAPI with Pydantic and SQLAlchemy for database interactions.
*   **Node.js Backends:** Express.js with TypeScript.
*   **Database:** PostgreSQL for all services.

## Code Style and Linting

*   **TypeScript/Next.js:** ESLint (`next lint`) is used for linting.
*   **Python:** (Presumed) Adherence to PEP 8. Specific linting tools like Black or Flake8 may be configured within individual service backends.

## Testing

*   **Node.js Services:** Jest is used for unit and integration testing. Refer to `jest.config.js` and `__tests__` directories within each Node.js service.
*   **Python Services:** (Presumed) A testing framework like `pytest` might be used, although not explicitly detailed in the provided `requirements.txt`.

## Database Migrations

*   **Python Backends:** Alembic is used for managing database schema migrations.
*   **Node.js Backends:** Custom migration scripts are used (e.g., `npm run migrate` in `auth-service`).

## gRPC

*   Protocol Buffer definition files (`.proto`) are located in `protos/` directories within each service.
*   Shared gRPC related code is likely in `@jam/grpc-protos`.

## Shared Libraries

The project utilizes several internal shared libraries prefixed with `@jam/`, such as:
*   `@jam/base-app`: Provides common application functionalities (e.g., health checks, metrics, error handling).
*   `@jam/database-engine`: Abstracts database connection and interaction logic.
*   `@jam/grpc-protos`: Contains generated gRPC client/server code and protobuf definitions.

This setup promotes code reuse and maintains consistency across microservices.
