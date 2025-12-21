# Tests Directory

This directory contains all test results organized by timestamp for the JAM Stack application.

## Quick Start

Execute all tests and generate TEST_SUMMARY.md automatically:

```bash
./run-all-tests.sh
```

This single command will:

1. Create a timestamped directory (e.g., `tests/2025-12-21_15-30-45/`)
2. Run all test suites (Auth, Todos, Fundflow, Frontend)
3. Save test results to individual `.log` files in the timestamped directory
4. Generate `TEST_SUMMARY.md` with complete test report
5. Display a summary in the terminal

## Directory Structure

After running the test script, you'll have timestamped directories:

```
tests/
├── README.md
├── 2025-12-21_15-30-45/
│   ├── TEST_SUMMARY.md
│   ├── auth-service-test-results.log
│   ├── todos-service-test-results.log
│   ├── fundflow-service-test-results.log
│   └── frontend-test-results.log
├── 2025-12-21_16-45-12/
│   ├── TEST_SUMMARY.md
│   ├── auth-service-test-results.log
│   ├── todos-service-test-results.log
│   ├── fundflow-service-test-results.log
│   └── frontend-test-results.log
└── ...
```

## Files Generated Per Test Run

Each timestamped directory contains:

| File                                | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `TEST_SUMMARY.md`                   | Comprehensive test report with all results |
| `auth-service-test-results.log`     | Auth service test output                   |
| `todos-service-test-results.log`    | Todos service test output                  |
| `fundflow-service-test-results.log` | Fundflow service test output               |
| `frontend-test-results.log`         | Frontend test output                       |

## Manual Test Execution

If you want to run tests individually:

```bash
# Auth Service
cd services/auth-service
npm test

# Todos Service
cd services/todos-service
npm test

# Fundflow Service
cd services/fundflow-service
npm test

# Frontend
cd frontend
npm test
```

## Prerequisites

Before running tests, ensure:

1. Docker containers are running: `docker compose --profile dev up -d`
2. All services are healthy (check with `docker compose ps`)
3. Dependencies are installed in each service

## Test Framework

- **Backend Services**: Jest + TypeScript + Supertest
- **Frontend**: Jest + Next.js + Native Node.js HTTP

## CI/CD Integration

The `run-all-tests.sh` script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: ./run-all-tests.sh

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results-${{ github.run_number }}
    path: tests/*/*.log

- name: Upload Test Summary
  uses: actions/upload-artifact@v3
  with:
    name: test-summary-${{ github.run_number }}
    path: tests/*/TEST_SUMMARY.md
```

## Exit Codes

The script returns:

- `0` - All tests passed
- `1` - One or more tests failed

This makes it suitable for CI/CD pipelines that check exit codes.
