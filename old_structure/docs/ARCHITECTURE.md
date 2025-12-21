# Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Database Architecture](#database-architecture)
4. [Authentication Flow](#authentication-flow)
5. [Application Flow](#application-flow)
6. [Component Architecture](#component-architecture)
7. [API Architecture](#api-architecture)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)

---

## System Overview

The JAM Stack Application is a full-stack web application built on modern web technologies, following the JAMstack architecture pattern (JavaScript, APIs, and Markup).

### Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        A[Next.js 14 App Router]
        B[React 18]
        C[TypeScript]
        D[Tailwind CSS]
        E[Recharts]
    end

    subgraph "Backend"
        F[Supabase PostgreSQL]
        G[Supabase Auth]
        H[Supabase Realtime]
        I[Supabase Storage]
    end

    subgraph "DevOps"
        J[Docker]
        K[GitHub Actions]
        L[Vercel/Docker Deploy]
    end

    A --> B
    B --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    J --> L
    K --> L
```

---

## High-Level Architecture

### System Architecture Diagram

```mermaid
C4Context
    title System Context Diagram - JAM Stack Application

    Person(user, "User", "End user accessing the application")

    System(webapp, "JAM Stack Web App", "Next.js application providing todos and financial tracking")

    System_Ext(supabase, "Supabase Platform", "Backend-as-a-Service providing database, auth, and storage")
    System_Ext(oauth, "OAuth Providers", "Google, GitHub authentication")
    System_Ext(email, "Email Service", "Transactional emails")

    Rel(user, webapp, "Uses", "HTTPS")
    Rel(webapp, supabase, "Reads/Writes data", "REST API, WebSocket")
    Rel(webapp, oauth, "Authenticates", "OAuth 2.0")
    Rel(supabase, email, "Sends emails", "SMTP")
    Rel(oauth, user, "Returns to")
```

### Container Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        UI[React UI Components]
        STATE[Client State Management]
        CACHE[Local Cache]
    end

    subgraph "Next.js Server"
        SSR[Server-Side Rendering]
        API[API Routes]
        MIDDLEWARE[Auth Middleware]
        SERVER_ACTIONS[Server Actions]
    end

    subgraph "Supabase"
        DB[(PostgreSQL Database)]
        AUTH[Auth Service]
        REALTIME[Realtime Engine]
        STORAGE[File Storage]
        RLS[Row Level Security]
    end

    UI --> SSR
    UI --> API
    STATE --> CACHE
    SSR --> MIDDLEWARE
    API --> MIDDLEWARE
    MIDDLEWARE --> AUTH
    API --> DB
    SERVER_ACTIONS --> DB
    DB --> RLS
    REALTIME --> UI
    UI --> STORAGE
```

---

## Database Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS ||--o{ PROFILES : "has one"
    AUTH_USERS ||--o{ LOGIN_HISTORY : "has many"
    AUTH_USERS ||--o{ ACTIVE_SESSIONS : "has many"
    AUTH_USERS ||--o{ TODO_LISTS : "owns many"
    AUTH_USERS ||--o{ TODOS : "owns many"
    AUTH_USERS ||--o{ TRANSACTION_CATEGORIES : "owns many"
    AUTH_USERS ||--o{ TRANSACTIONS : "owns many"
    AUTH_USERS ||--o{ RECURRING_TRANSACTIONS : "owns many"
    AUTH_USERS ||--o{ TRANSACTION_REMINDERS : "has many"

    TODO_LISTS ||--o{ TODOS : "contains many"
    TRANSACTION_CATEGORIES ||--o{ TRANSACTIONS : "categorizes many"
    TRANSACTION_CATEGORIES ||--o{ RECURRING_TRANSACTIONS : "categorizes many"
    RECURRING_TRANSACTIONS ||--o{ TRANSACTIONS : "generates many"
    RECURRING_TRANSACTIONS ||--o{ TRANSACTION_REMINDERS : "has many"

    PROFILES {
        uuid id PK
        string email
        string display_name
        string avatar_url
        boolean two_factor_enabled
        string two_factor_secret
        timestamp created_at
        timestamp updated_at
    }

    LOGIN_HISTORY {
        uuid id PK
        uuid user_id FK
        timestamp login_at
        string device_type
        string device_info
        string ip_address
        string location
        boolean success
    }

    ACTIVE_SESSIONS {
        uuid id PK
        uuid user_id FK
        string session_token
        string device_type
        string device_info
        timestamp created_at
        timestamp last_active
        timestamp expires_at
    }

    TODO_LISTS {
        uuid id PK
        uuid user_id FK
        string name
        string description
        string color
        string icon
        int sort_order
        timestamp created_at
        timestamp updated_at
    }

    TODOS {
        uuid id PK
        uuid user_id FK
        uuid list_id FK
        string title
        string description
        boolean completed
        enum priority
        timestamp due_date
        timestamp completed_at
        int sort_order
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION_CATEGORIES {
        uuid id PK
        uuid user_id FK
        string name
        enum type
        string color
        string icon
        boolean is_default
        timestamp created_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        enum type
        decimal amount
        string description
        date transaction_date
        uuid recurring_transaction_id FK
        timestamp created_at
        timestamp updated_at
    }

    RECURRING_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        enum type
        decimal amount
        string description
        enum frequency
        date start_date
        date end_date
        date next_occurrence
        boolean is_active
        int remind_days_before
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION_REMINDERS {
        uuid id PK
        uuid user_id FK
        uuid recurring_transaction_id FK
        date reminder_date
        boolean sent
        boolean dismissed
        timestamp created_at
    }
```

### Database Schema Layers

```mermaid
graph LR
    subgraph "Application Layer"
        APP[Next.js Application]
    end

    subgraph "Security Layer"
        RLS[Row Level Security Policies]
        AUTH_CHECK[Authentication Checks]
    end

    subgraph "Data Layer"
        TABLES[(Database Tables)]
        INDEXES[Indexes for Performance]
        FUNCTIONS[Database Functions]
        TRIGGERS[Triggers & Automations]
    end

    APP --> AUTH_CHECK
    AUTH_CHECK --> RLS
    RLS --> TABLES
    TABLES --> INDEXES
    TABLES --> FUNCTIONS
    TABLES --> TRIGGERS
```

---

## Authentication Flow

### Email/Password Authentication

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant Middleware
    participant Supabase
    participant Database

    User->>Browser: Enter credentials
    Browser->>NextJS: POST /api/auth/login
    NextJS->>Supabase: signInWithPassword()
    Supabase->>Database: Verify credentials
    Database-->>Supabase: User data
    Supabase-->>NextJS: Session + JWT
    NextJS->>Database: Log login history
    NextJS-->>Browser: Set session cookie
    Browser->>NextJS: Navigate to /dashboard
    NextJS->>Middleware: Check auth
    Middleware->>Supabase: Validate session
    Supabase-->>Middleware: Valid user
    Middleware-->>NextJS: Allow access
    NextJS-->>Browser: Render dashboard
```

### OAuth Flow (Google/GitHub)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant Supabase
    participant OAuth as OAuth Provider
    participant Database

    User->>Browser: Click "Sign in with Google"
    Browser->>NextJS: GET /auth/oauth/google
    NextJS->>Supabase: signInWithOAuth()
    Supabase->>OAuth: Redirect with client_id
    OAuth->>User: Show consent screen
    User->>OAuth: Approve
    OAuth->>Browser: Redirect to callback URL
    Browser->>NextJS: GET /auth/callback?code=xxx
    NextJS->>Supabase: Exchange code for session
    Supabase->>OAuth: Verify code
    OAuth-->>Supabase: User profile
    Supabase->>Database: Create/update user
    Database->>Database: Trigger: create profile
    Database-->>Supabase: User created
    Supabase-->>NextJS: Session + JWT
    NextJS->>Database: Log login history
    NextJS-->>Browser: Redirect to /dashboard
```

### Two-Factor Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant Supabase
    participant TOTP as TOTP Generator
    participant Database

    Note over User,Database: Setup Phase
    User->>Browser: Navigate to /settings/security
    Browser->>NextJS: Request 2FA setup
    NextJS->>TOTP: Generate secret
    TOTP-->>NextJS: Secret + QR code
    NextJS-->>Browser: Display QR code
    User->>User: Scan with authenticator app
    User->>Browser: Enter verification code
    Browser->>NextJS: POST /api/auth/verify-2fa
    NextJS->>TOTP: Verify code
    TOTP-->>NextJS: Valid
    NextJS->>Database: Save encrypted secret
    NextJS-->>Browser: 2FA enabled

    Note over User,Database: Login Phase
    User->>Browser: Login with email/password
    Browser->>NextJS: POST /api/auth/login
    NextJS->>Supabase: signInWithPassword()
    Supabase-->>NextJS: Session (pending 2FA)
    NextJS->>Database: Check if 2FA enabled
    Database-->>NextJS: 2FA required
    NextJS-->>Browser: Show 2FA prompt
    User->>Browser: Enter TOTP code
    Browser->>NextJS: POST /api/auth/verify-2fa
    NextJS->>Database: Get 2FA secret
    NextJS->>TOTP: Verify code
    TOTP-->>NextJS: Valid
    NextJS-->>Browser: Complete login
```

---

## Application Flow

### Todo Management Flow

```mermaid
graph TD
    A[User opens /todos] --> B{Authenticated?}
    B -->|No| C[Redirect to /login]
    B -->|Yes| D[Fetch todo lists]
    D --> E[Subscribe to realtime updates]
    E --> F[Display todos]

    F --> G{User action?}
    G -->|Create| H[Show todo form]
    G -->|Edit| I[Load todo data]
    G -->|Delete| J[Confirm deletion]
    G -->|Toggle| K[Update completed status]

    H --> L[Validate input]
    L -->|Valid| M[Insert into DB]
    L -->|Invalid| H
    M --> N[Realtime broadcast]
    N --> F

    I --> O[Update todo form]
    O --> P[Save changes]
    P --> N

    J -->|Confirmed| Q[Delete from DB]
    Q --> N

    K --> R[Optimistic UI update]
    R --> S[Update DB]
    S --> N
```

### Transaction Tracking Flow

```mermaid
graph TD
    A[User opens /fundflow] --> B{Authenticated?}
    B -->|No| C[Redirect to /login]
    B -->|Yes| D[Fetch transactions]
    D --> E[Fetch categories]
    E --> F[Calculate statistics]
    F --> G[Generate charts]
    G --> H[Display dashboard]

    H --> I{User action?}
    I -->|Add Transaction| J[Show transaction form]
    I -->|View Reports| K[Open reports page]
    I -->|Manage Categories| L[Show category manager]
    I -->|Set Recurring| M[Show recurring form]

    J --> N[Select category & type]
    N --> O[Enter amount & date]
    O --> P[Validate input]
    P -->|Valid| Q[Save transaction]
    P -->|Invalid| J
    Q --> R[Update statistics]
    R --> H

    M --> S[Configure frequency]
    S --> T[Set start/end dates]
    T --> U[Set reminder days]
    U --> V[Save recurring transaction]
    V --> W[Create first transaction]
    W --> H
```

### Recurring Transaction Processing

```mermaid
graph TD
    A[Cron Job Daily] --> B[Call process_recurring_transactions]
    B --> C{Active recurring transactions?}
    C -->|Yes| D[Check next_occurrence]
    D --> E{Due today or earlier?}
    E -->|Yes| F[Create transaction record]
    E -->|No| K[Skip]

    F --> G[Calculate next occurrence]
    G --> H{Past end_date?}
    H -->|Yes| I[Deactivate recurring]
    H -->|No| J[Update next_occurrence]

    I --> K
    J --> K
    K --> L{More records?}
    L -->|Yes| D
    L -->|No| M[Generate reminders]

    M --> N{Reminders needed?}
    N -->|Yes| O[Create reminder records]
    N -->|No| P[End]
    O --> P
```

---

## Component Architecture

### Frontend Component Hierarchy

```mermaid
graph TB
    subgraph "App Layer"
        ROOT[Root Layout]
        AUTH_LAYOUT[Auth Layout]
        DASH_LAYOUT[Dashboard Layout]
    end

    subgraph "Page Components"
        LOGIN[Login Page]
        SIGNUP[Signup Page]
        DASHBOARD[Dashboard Page]
        TODOS[Todos Page]
        FUNDFLOW[Fundflow Page]
        SETTINGS[Settings Page]
    end

    subgraph "Feature Components"
        TODO_LIST[TodoList]
        TODO_ITEM[TodoItem]
        TODO_FORM[TodoForm]
        TRANS_LIST[TransactionList]
        TRANS_FORM[TransactionForm]
        CHARTS[Chart Components]
        PROFILE[Profile Settings]
        SESSIONS[Session Manager]
    end

    subgraph "UI Components"
        BUTTON[Button]
        INPUT[Input]
        MODAL[Modal]
        DROPDOWN[Dropdown]
        CARD[Card]
    end

    ROOT --> AUTH_LAYOUT
    ROOT --> DASH_LAYOUT
    AUTH_LAYOUT --> LOGIN
    AUTH_LAYOUT --> SIGNUP
    DASH_LAYOUT --> DASHBOARD
    DASH_LAYOUT --> TODOS
    DASH_LAYOUT --> FUNDFLOW
    DASH_LAYOUT --> SETTINGS

    TODOS --> TODO_LIST
    TODO_LIST --> TODO_ITEM
    TODOS --> TODO_FORM

    FUNDFLOW --> TRANS_LIST
    FUNDFLOW --> TRANS_FORM
    FUNDFLOW --> CHARTS

    SETTINGS --> PROFILE
    SETTINGS --> SESSIONS

    TODO_FORM --> BUTTON
    TODO_FORM --> INPUT
    TODO_FORM --> MODAL
    TRANS_FORM --> DROPDOWN
    TRANS_FORM --> CARD
```

### State Management Pattern

```mermaid
graph LR
    subgraph "Client Components"
        UI[UI Components]
        HOOKS[Custom Hooks]
        CONTEXT[React Context]
    end

    subgraph "Data Layer"
        SUPABASE[Supabase Client]
        CACHE[Local Cache]
        REALTIME[Realtime Subscriptions]
    end

    subgraph "Server Components"
        SERVER[Server Components]
        SERVER_ACTIONS[Server Actions]
    end

    UI --> HOOKS
    HOOKS --> CONTEXT
    HOOKS --> SUPABASE
    HOOKS --> REALTIME
    SUPABASE --> CACHE
    SERVER --> SERVER_ACTIONS
    SERVER_ACTIONS --> SUPABASE
    REALTIME --> UI
```

---

## API Architecture

### API Routes Structure

```mermaid
graph TB
    subgraph "API Routes /api"
        AUTH_ROUTES[/auth/*]
        TODO_ROUTES[/todos/*]
        TRANS_ROUTES[/transactions/*]
        REC_ROUTES[/recurring/*]
        REM_ROUTES[/reminders/*]
    end

    subgraph "Middleware Layers"
        CORS[CORS Handling]
        RATE_LIMIT[Rate Limiting]
        AUTH_CHECK[Authentication Check]
        VALIDATION[Input Validation]
    end

    subgraph "Business Logic"
        HANDLERS[Request Handlers]
        SERVICES[Service Layer]
        DATABASE[Database Operations]
    end

    AUTH_ROUTES --> CORS
    TODO_ROUTES --> CORS
    TRANS_ROUTES --> CORS

    CORS --> RATE_LIMIT
    RATE_LIMIT --> AUTH_CHECK
    AUTH_CHECK --> VALIDATION
    VALIDATION --> HANDLERS
    HANDLERS --> SERVICES
    SERVICES --> DATABASE
```

### Request/Response Flow

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant API
    participant Validation
    participant DB
    participant Realtime

    Client->>Middleware: HTTP Request
    Middleware->>Middleware: Check rate limit
    Middleware->>Middleware: Verify JWT token
    Middleware->>API: Authorized request
    API->>Validation: Validate input (Zod)
    Validation-->>API: Validated data
    API->>DB: Execute query with RLS
    DB-->>API: Query result
    API->>Realtime: Broadcast change
    API-->>Client: JSON response
    Realtime-->>Client: WebSocket update
```

---

## Security Architecture

### Security Layers

```mermaid
graph TB
    subgraph "Application Security"
        INPUT_VAL[Input Validation - Zod]
        XSS[XSS Protection - React]
        CSRF[CSRF Protection - SameSite]
        CORS_SEC[CORS Configuration]
    end

    subgraph "Authentication Security"
        JWT[JWT Tokens]
        SESSION[Secure Sessions]
        TWO_FA[Two-Factor Auth]
        OAUTH_SEC[OAuth 2.0]
        PASSWORD[Password Hashing - bcrypt]
    end

    subgraph "Database Security"
        RLS_SEC[Row Level Security]
        ENCRYPTION[Data Encryption]
        PREPARED[Prepared Statements]
        AUDIT[Audit Logging]
    end

    subgraph "Network Security"
        HTTPS[HTTPS/TLS]
        RATE_LIM[Rate Limiting]
        HEADERS[Security Headers]
        FIREWALL[Firewall Rules]
    end

    INPUT_VAL --> JWT
    XSS --> SESSION
    JWT --> RLS_SEC
    SESSION --> ENCRYPTION
    HTTPS --> RATE_LIM
    RATE_LIM --> HEADERS
```

### Row Level Security Flow

```mermaid
graph LR
    A[Client Request] --> B[JWT Token]
    B --> C[Supabase validates JWT]
    C --> D{Valid token?}
    D -->|No| E[401 Unauthorized]
    D -->|Yes| F[Extract user_id from JWT]
    F --> G[Execute query]
    G --> H[RLS Policy Check]
    H --> I{user_id matches?}
    I -->|No| J[Return empty result]
    I -->|Yes| K[Return user's data]
```

---

## Deployment Architecture

### Docker Deployment Architecture

```mermaid
graph TB
    subgraph "Docker Host"
        subgraph "Development"
            DEV_APP[Next.js Dev Container]
            DEV_VOL[Source Code Volume]
        end

        subgraph "Production"
            NGINX[Nginx Container]
            PROD_APP[Next.js Prod Container]
        end

        NETWORK[Docker Network]
    end

    subgraph "External Services"
        SUPABASE_EXT[Supabase Cloud]
        CDN[CDN / Static Assets]
    end

    DEV_APP --> DEV_VOL
    DEV_APP --> NETWORK

    NGINX --> NETWORK
    PROD_APP --> NETWORK

    NETWORK --> SUPABASE_EXT
    NGINX --> CDN
```

### CI/CD Pipeline

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    B --> C[Lint & Format Check]
    C --> D[Run Tests]
    D --> E{Tests Pass?}
    E -->|No| F[Fail Build]
    E -->|Yes| G[Build Docker Image]
    G --> H[Run Security Scan]
    H --> I{Scan Pass?}
    I -->|No| F
    I -->|Yes| J[Push to Registry]
    J --> K{Branch?}
    K -->|main| L[Deploy to Production]
    K -->|develop| M[Deploy to Staging]
    L --> N[Health Check]
    M --> N
    N --> O{Healthy?}
    O -->|No| P[Rollback]
    O -->|Yes| Q[Success]
```

### Deployment Environments

```mermaid
graph TB
    subgraph "Development"
        DEV[Local Docker Compose]
        DEV_DB[Supabase Dev Project]
    end

    subgraph "Staging"
        STAGE[Staging Server]
        STAGE_DB[Supabase Staging]
    end

    subgraph "Production"
        PROD[Production Server/Vercel]
        PROD_DB[Supabase Production]
        PROD_CDN[CDN]
    end

    DEV --> STAGE
    STAGE --> PROD
    DEV_DB -.migrate.-> STAGE_DB
    STAGE_DB -.migrate.-> PROD_DB
    PROD --> PROD_CDN
```

---

## Performance Architecture

### Caching Strategy

```mermaid
graph TB
    A[User Request] --> B{Cache Hit?}
    B -->|Yes| C[Return Cached Data]
    B -->|No| D[Fetch from Database]
    D --> E[Cache Result]
    E --> F[Return Data]

    subgraph "Cache Layers"
        G[Browser Cache]
        H[CDN Cache]
        I[Server Cache]
        J[Database Cache]
    end

    C --> G
    C --> H
    E --> I
    D --> J
```

### Optimization Strategies

```mermaid
mindmap
    root((Performance))
        Frontend
            Code Splitting
            Lazy Loading
            Image Optimization
            Minification
        Backend
            Database Indexing
            Query Optimization
            Connection Pooling
        Caching
            Static Assets
            API Responses
            Database Queries
        CDN
            Geographic Distribution
            Edge Caching
```

---

## Monitoring & Observability

### Monitoring Architecture

```mermaid
graph TB
    subgraph "Application"
        APP[Next.js App]
        API[API Routes]
    end

    subgraph "Monitoring Tools"
        LOGS[Log Aggregation]
        METRICS[Metrics Collection]
        ERRORS[Error Tracking]
        APM[Application Performance]
    end

    subgraph "Alerts"
        EMAIL[Email Alerts]
        SLACK[Slack Notifications]
        DASHBOARD[Monitoring Dashboard]
    end

    APP --> LOGS
    APP --> ERRORS
    API --> METRICS
    API --> APM

    LOGS --> DASHBOARD
    METRICS --> DASHBOARD
    ERRORS --> EMAIL
    APM --> SLACK
```

---

## Scalability Considerations

### Horizontal Scaling

```mermaid
graph TB
    LB[Load Balancer] --> APP1[App Instance 1]
    LB --> APP2[App Instance 2]
    LB --> APP3[App Instance 3]

    APP1 --> DB[(Database - Supabase)]
    APP2 --> DB
    APP3 --> DB

    DB --> REPLICA1[(Read Replica 1)]
    DB --> REPLICA2[(Read Replica 2)]
```

### Database Scaling

```mermaid
graph LR
    WRITE[Write Operations] --> PRIMARY[(Primary DB)]
    READ[Read Operations] --> ROUTER{Read Router}
    ROUTER --> REPLICA1[(Replica 1)]
    ROUTER --> REPLICA2[(Replica 2)]
    ROUTER --> REPLICA3[(Replica 3)]
    PRIMARY -.replication.-> REPLICA1
    PRIMARY -.replication.-> REPLICA2
    PRIMARY -.replication.-> REPLICA3
```

---

## Future Architecture Enhancements

1. **Microservices Migration**: Break down into smaller services
2. **Event-Driven Architecture**: Implement message queues for async processing
3. **GraphQL API**: Provide GraphQL endpoint alongside REST
4. **Mobile Apps**: React Native apps using same backend
5. **AI Integration**: ML-based insights and recommendations
6. **Multi-tenancy**: Support for organizations and teams
7. **Elasticsearch**: Advanced search capabilities
8. **Redis**: Distributed caching layer

---

*Last Updated: 2025-12-20*
*Version: 1.0.0*
