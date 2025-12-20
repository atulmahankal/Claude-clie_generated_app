# Fundflow Service

Microservice for financial transaction tracking, recurring transactions, and analytics.

## Features

- **Transaction Management**: Track income and expenses
- **Category Management**: Organize transactions by custom categories
- **Recurring Transactions**: Automate recurring income/expenses
- **Smart Reminders**: Get notified about upcoming transactions
- **Financial Analytics**: Statistics, trends, and category breakdowns
- **Multi-Currency Support**: Track transactions in different currencies
- **Automated Processing**: Daily cron job for recurring transactions

## gRPC Service

The service implements 21 RPC methods defined in `fundflow.proto`:

### Transaction Operations (5 methods)
- `CreateTransaction` - Record a new transaction
- `GetTransactions` - Get transactions with filters
- `GetTransaction` - Get a specific transaction
- `UpdateTransaction` - Update transaction details
- `DeleteTransaction` - Delete a transaction

### Category Operations (4 methods)
- `CreateCategory` - Create income/expense category
- `GetCategories` - Get all categories (filterable by type)
- `UpdateCategory` - Update category details
- `DeleteCategory` - Delete category

### Recurring Transaction Operations (6 methods)
- `CreateRecurringTransaction` - Set up recurring income/expense
- `GetRecurringTransactions` - Get all recurring transactions
- `GetRecurringTransaction` - Get specific recurring transaction
- `UpdateRecurringTransaction` - Update recurring details
- `DeleteRecurringTransaction` - Delete recurring transaction
- `ProcessRecurringTransactions` - Process due recurring transactions (cron job)

### Analytics Operations (3 methods)
- `GetStatistics` - Financial statistics for a date range
- `GetCategoryBreakdown` - Spending/income breakdown by category
- `GetMonthlyTrends` - Month-over-month trends

### Reminder Operations (2 methods)
- `GetReminders` - Get transaction reminders
- `DismissReminder` - Mark reminder as read

## Environment Variables

```env
# Service Configuration
HTTP_PORT=3003
GRPC_PORT=50053
SERVICE_VERSION=1.0.0

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fundflow
DB_USER=postgres
DB_PASSWORD=postgres

# Logging
NODE_ENV=development
LOGS_DIR=logs
```

## Running the Service

### Standalone (with Docker Compose)
```bash
cd services/fundflow-service
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

**transaction_categories**
- User-defined categories for income/expenses
- Color and icon customization
- Type-based organization

**transactions**
- Individual financial transactions
- Links to categories
- Multi-currency support
- Transaction date tracking

**recurring_transactions**
- Recurring transaction templates
- Frequency: daily, weekly, monthly, yearly
- Auto-create or reminder-only modes
- Next occurrence calculation
- Active/inactive status

**transaction_reminders**
- Reminders for upcoming transactions
- Read/unread status
- Linked to recurring transactions

## Features in Detail

### Recurring Transaction Frequencies
- **Daily**: Every day
- **Weekly**: Every week (with optional day-of-week)
- **Monthly**: Every month (with optional day-of-month)
- **Yearly**: Every year

### Auto-Create vs Manual
- **Auto-Create**: Automatically creates transactions when due
- **Manual**: Only sends reminders, user creates manually

### Automated Processing

The service includes a database function `process_recurring_transactions_daily()` that:
1. Finds all active recurring transactions due for processing
2. Creates actual transactions if `auto_create = true`
3. Generates reminders based on `reminder_days_before`
4. Calculates next occurrence date
5. Updates the recurring transaction

This should be called daily via cron job or scheduler.

### Analytics Features

**Statistics**: Get financial overview
- Total income
- Total expenses
- Net balance
- Transaction count
- Average transaction amount

**Category Breakdown**: Spending/income analysis
- Amount per category
- Percentage of total
- Transaction count per category
- Sorted by amount

**Monthly Trends** (planned): Track changes over time
- Income per month
- Expenses per month
- Net balance per month

## Architecture

```
fundflow-service/
├── src/
│   ├── models/           # Data models (Category, Transaction, Recurring, Reminder)
│   ├── controllers/      # Business logic (FundflowController)
│   ├── grpc/
│   │   ├── handlers/     # gRPC request handlers
│   │   └── server.ts     # gRPC server setup
│   └── app.ts            # Main application entry point
├── migrations/           # Database migrations with functions
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Database Choice

This service uses a **separate database** for data isolation and complex operations:
- Advanced database functions for recurring transaction processing
- Financial data security requirements
- Performance isolation from other services

## Default Categories

The service provides default categories for new users:

**Income:**
- Salary
- Freelance
- Investment
- Other Income

**Expenses:**
- Food
- Transport
- Shopping
- Bills
- Entertainment
- Health
- Education
- Other Expense

## Dependencies

- `@jam/database-engine` - Multi-database abstraction
- `@jam/base-app` - Logging, errors, monitoring
- `@grpc/grpc-js` - gRPC server
- `express` - HTTP server

## Cron Job Setup

To enable automatic processing of recurring transactions, set up a daily cron job:

```bash
# Call the gRPC ProcessRecurringTransactions method daily
0 0 * * * grpcurl -plaintext -d '{}' localhost:50053 fundflow.FundflowService/ProcessRecurringTransactions
```

Or use the database function directly:
```sql
SELECT * FROM process_recurring_transactions_daily();
```
