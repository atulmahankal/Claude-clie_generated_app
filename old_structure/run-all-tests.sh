#!/bin/bash

# JAM Stack Application - Automated Test Runner
# Executes all test suites and generates TEST_SUMMARY.md

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JAM Stack Application - Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create timestamp for this test run
RUN_TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
TIMESTAMP_DIR="$PROJECT_ROOT/tests/$RUN_TIMESTAMP"

# Create timestamped directory for this test run
mkdir -p "$TIMESTAMP_DIR"

echo -e "${BLUE}Test results will be saved to: tests/$RUN_TIMESTAMP/${NC}"
echo ""

# Run Auth Service Tests
echo -e "${YELLOW}[1/4] Running Auth Service Tests...${NC}"
cd "$PROJECT_ROOT/services/auth-service"
npm test 2>&1 | tee "$TIMESTAMP_DIR/auth-service-test-results.log"
AUTH_EXIT_CODE=${PIPESTATUS[0]}
echo ""

# Run Todos Service Tests
echo -e "${YELLOW}[2/4] Running Todos Service Tests...${NC}"
cd "$PROJECT_ROOT/services/todos-service"
npm test 2>&1 | tee "$TIMESTAMP_DIR/todos-service-test-results.log"
TODOS_EXIT_CODE=${PIPESTATUS[0]}
echo ""

# Run Fundflow Service Tests
echo -e "${YELLOW}[3/4] Running Fundflow Service Tests...${NC}"
cd "$PROJECT_ROOT/services/fundflow-service"
npm test 2>&1 | tee "$TIMESTAMP_DIR/fundflow-service-test-results.log"
FUNDFLOW_EXIT_CODE=${PIPESTATUS[0]}
echo ""

# Run Frontend Tests
echo -e "${YELLOW}[4/4] Running Frontend Tests...${NC}"
cd "$PROJECT_ROOT/frontend"
npm test 2>&1 | tee "$TIMESTAMP_DIR/frontend-test-results.log"
FRONTEND_EXIT_CODE=${PIPESTATUS[0]}
echo ""

# Check if all tests passed
TOTAL_EXIT_CODE=$((AUTH_EXIT_CODE + TODOS_EXIT_CODE + FUNDFLOW_EXIT_CODE + FRONTEND_EXIT_CODE))

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Generating TEST_SUMMARY.md...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Extract test counts from log files
AUTH_TESTS=$(grep -oP 'Tests:\s+\K\d+(?= passed)' "$TIMESTAMP_DIR/auth-service-test-results.log" || echo "0")
TODOS_TESTS=$(grep -oP 'Tests:\s+\K\d+(?= passed)' "$TIMESTAMP_DIR/todos-service-test-results.log" || echo "0")
FUNDFLOW_TESTS=$(grep -oP 'Tests:\s+\K\d+(?= passed)' "$TIMESTAMP_DIR/fundflow-service-test-results.log" || echo "0")
FRONTEND_TESTS=$(grep -oP 'Tests:\s+\K\d+(?= passed)' "$TIMESTAMP_DIR/frontend-test-results.log" || echo "0")

# Extract execution times
AUTH_TIME=$(grep -oP 'Time:\s+\K[\d.]+\s*s' "$TIMESTAMP_DIR/auth-service-test-results.log" | head -1 || echo "0s")
TODOS_TIME=$(grep -oP 'Time:\s+\K[\d.]+\s*s' "$TIMESTAMP_DIR/todos-service-test-results.log" | head -1 || echo "0s")
FUNDFLOW_TIME=$(grep -oP 'Time:\s+\K[\d.]+\s*s' "$TIMESTAMP_DIR/fundflow-service-test-results.log" | head -1 || echo "0s")
FRONTEND_TIME=$(grep -oP 'Time:\s+\K[\d.]+\s*s' "$TIMESTAMP_DIR/frontend-test-results.log" | head -1 || echo "0s")

# Calculate totals
TOTAL_TESTS=$((AUTH_TESTS + TODOS_TESTS + FUNDFLOW_TESTS + FRONTEND_TESTS))

# Get human-readable timestamp
DISPLAY_TIMESTAMP=$(date "+%B %d, %Y, %I:%M %p")

# Generate TEST_SUMMARY.md
cat > "$TIMESTAMP_DIR/TEST_SUMMARY.md" << 'EOF'
# JAM Stack Application - Test Summary

**Test Execution Date**: TIMESTAMP_PLACEHOLDER
**Test Run ID**: RUN_ID_PLACEHOLDER
**Test Framework**: Jest
**Environment**: Docker Compose (Development Profile)

## Overall Test Results

| Component | Tests Passed | Total Tests | Execution Time | Status |
|-----------|-------------|-------------|----------------|--------|
| Auth Service | AUTH_TESTS_PLACEHOLDER | AUTH_TESTS_PLACEHOLDER | AUTH_TIME_PLACEHOLDER | STATUS_AUTH_PLACEHOLDER |
| Todos Service | TODOS_TESTS_PLACEHOLDER | TODOS_TESTS_PLACEHOLDER | TODOS_TIME_PLACEHOLDER | STATUS_TODOS_PLACEHOLDER |
| Fundflow Service | FUNDFLOW_TESTS_PLACEHOLDER | FUNDFLOW_TESTS_PLACEHOLDER | FUNDFLOW_TIME_PLACEHOLDER | STATUS_FUNDFLOW_PLACEHOLDER |
| Frontend | FRONTEND_TESTS_PLACEHOLDER | FRONTEND_TESTS_PLACEHOLDER | FRONTEND_TIME_PLACEHOLDER | STATUS_FRONTEND_PLACEHOLDER |
| **TOTAL** | **TOTAL_TESTS_PLACEHOLDER** | **TOTAL_TESTS_PLACEHOLDER** | **-** | **STATUS_TOTAL_PLACEHOLDER** |

**Success Rate**: SUCCESS_RATE_PLACEHOLDER%
**Test Suites**: 4 total
**Snapshots**: 0 total

---

## Test Results by Service

### 1. Auth Service (AUTH_TESTS_PLACEHOLDER tests)

**File**: `services/auth-service/src/__tests__/health.test.ts`
**Execution Time**: AUTH_TIME_PLACEHOLDER
**Test Suite**: Health Endpoint Tests

See detailed test output in: `auth-service-test-results.log`

---

### 2. Todos Service (TODOS_TESTS_PLACEHOLDER tests)

**File**: `services/todos-service/src/__tests__/health.test.ts`
**Execution Time**: TODOS_TIME_PLACEHOLDER
**Test Suite**: Todos Service - Health Endpoint Tests

See detailed test output in: `todos-service-test-results.log`

---

### 3. Fundflow Service (FUNDFLOW_TESTS_PLACEHOLDER tests)

**File**: `services/fundflow-service/src/__tests__/health.test.ts`
**Execution Time**: FUNDFLOW_TIME_PLACEHOLDER
**Test Suite**: Fundflow Service - Health Endpoint Tests

See detailed test output in: `fundflow-service-test-results.log`

---

### 4. Frontend Integration Tests (FRONTEND_TESTS_PLACEHOLDER tests)

**File**: `frontend/src/__tests__/frontend-integration.test.ts`
**Execution Time**: FRONTEND_TIME_PLACEHOLDER
**Test Suite**: Frontend Integration Tests

See detailed test output in: `frontend-test-results.log`

---

## Test Result Files

All test results are stored in `./tests/RUN_ID_PLACEHOLDER/` directory:

| File | Content |
|------|---------|
| `auth-service-test-results.log` | Auth service test output |
| `todos-service-test-results.log` | Todos service test output |
| `fundflow-service-test-results.log` | Fundflow service test output |
| `frontend-test-results.log` | Frontend test output |

---

## Running Tests

### Run All Tests Automatically
```bash
# Execute all tests and generate TEST_SUMMARY.md
./run-all-tests.sh
```

### Individual Service Tests
```bash
# Auth Service
cd services/auth-service && npm test

# Todos Service
cd services/todos-service && npm test

# Fundflow Service
cd services/fundflow-service && npm test

# Frontend
cd frontend && npm test
```

---

## Architecture Validation

### Services Tested
All microservices running in Docker containers:

| Service | HTTP Port | gRPC Port | Database | Status |
|---------|-----------|-----------|----------|--------|
| Auth Service | 3011 | 50051 | PostgreSQL:5433 | ✓ Tested |
| Todos Service | 3002 | 50052 | PostgreSQL:5434 | ✓ Tested |
| Fundflow Service | 3003 | 50053 | PostgreSQL:5435 | ✓ Tested |
| Frontend (Next.js) | 3010 | - | - | ✓ Tested |

---

## Conclusion

CONCLUSION_PLACEHOLDER

**Generated by**: `./run-all-tests.sh`
EOF

# Replace placeholders
sed -i "s/TIMESTAMP_PLACEHOLDER/$DISPLAY_TIMESTAMP/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/RUN_ID_PLACEHOLDER/$RUN_TIMESTAMP/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/AUTH_TESTS_PLACEHOLDER/$AUTH_TESTS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/TODOS_TESTS_PLACEHOLDER/$TODOS_TESTS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/FUNDFLOW_TESTS_PLACEHOLDER/$FUNDFLOW_TESTS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/FRONTEND_TESTS_PLACEHOLDER/$FRONTEND_TESTS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/AUTH_TIME_PLACEHOLDER/$AUTH_TIME/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/TODOS_TIME_PLACEHOLDER/$TODOS_TIME/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/FUNDFLOW_TIME_PLACEHOLDER/$FUNDFLOW_TIME/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/FRONTEND_TIME_PLACEHOLDER/$FRONTEND_TIME/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
sed -i "s/TOTAL_TESTS_PLACEHOLDER/$TOTAL_TESTS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"

# Set status markers
if [ $AUTH_EXIT_CODE -eq 0 ]; then
    sed -i "s/STATUS_AUTH_PLACEHOLDER/✓ PASS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
else
    sed -i "s/STATUS_AUTH_PLACEHOLDER/✗ FAIL/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
fi

if [ $TODOS_EXIT_CODE -eq 0 ]; then
    sed -i "s/STATUS_TODOS_PLACEHOLDER/✓ PASS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
else
    sed -i "s/STATUS_TODOS_PLACEHOLDER/✗ FAIL/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
fi

if [ $FUNDFLOW_EXIT_CODE -eq 0 ]; then
    sed -i "s/STATUS_FUNDFLOW_PLACEHOLDER/✓ PASS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
else
    sed -i "s/STATUS_FUNDFLOW_PLACEHOLDER/✗ FAIL/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
fi

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    sed -i "s/STATUS_FRONTEND_PLACEHOLDER/✓ PASS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
else
    sed -i "s/STATUS_FRONTEND_PLACEHOLDER/✗ FAIL/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
fi

if [ $TOTAL_EXIT_CODE -eq 0 ]; then
    sed -i "s/STATUS_TOTAL_PLACEHOLDER/✓ ALL PASS/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
    sed -i "s/SUCCESS_RATE_PLACEHOLDER/100/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
    sed -i "s/CONCLUSION_PLACEHOLDER/All $TOTAL_TESTS tests passed successfully. The JAM Stack application is fully operational./g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
else
    sed -i "s/STATUS_TOTAL_PLACEHOLDER/✗ FAILURES/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
    sed -i "s/SUCCESS_RATE_PLACEHOLDER/N\/A/g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
    sed -i "s/CONCLUSION_PLACEHOLDER/Some tests failed. Please review the individual log files for details./g" "$TIMESTAMP_DIR/TEST_SUMMARY.md"
fi

echo -e "${GREEN}✓ TEST_SUMMARY.md generated successfully${NC}"
echo -e "${GREEN}✓ Location: tests/$RUN_TIMESTAMP/TEST_SUMMARY.md${NC}"
echo ""

# Print final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Execution Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Auth Service:     $AUTH_TESTS tests - $([ $AUTH_EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo -e "Todos Service:    $TODOS_TESTS tests - $([ $TODOS_EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo -e "Fundflow Service: $FUNDFLOW_TESTS tests - $([ $FUNDFLOW_EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo -e "Frontend:         $FRONTEND_TESTS tests - $([ $FRONTEND_EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo ""
echo -e "Total Tests:      ${GREEN}$TOTAL_TESTS${NC}"
echo ""
echo -e "${BLUE}Test results directory: tests/$RUN_TIMESTAMP/${NC}"
echo ""

if [ $TOTAL_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${GREEN}✓ TEST_SUMMARY.md has been generated${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo -e "Check individual log files in: tests/$RUN_TIMESTAMP/"
    exit 1
fi
