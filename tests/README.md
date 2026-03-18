# Playwright Test Suite for Mystic Logbook

## Overview

This test suite provides comprehensive coverage for the Mystic Logbook application, including API integration tests, E2E tests, and admin functionality tests.

## Test Structure

```
tests/
├── fixtures/
│   └── test-utils.ts       # Test utilities and API helpers
├── api/
│   ├── auth.spec.ts        # Authentication API tests
│   ├── dreams.spec.ts       # Dreams API tests
│   ├── blog.spec.ts        # Blog API tests
│   ├── categories.spec.ts   # Categories API tests
│   ├── admin.spec.ts       # Admin API tests
│   └── search.spec.ts     # Search and contact API tests
└── e2e/
    └── user-flows.spec.ts  # End-to-end user flow tests
```

## Prerequisites

1. **Database must be running** - MySQL database with the schema initialized
2. **Backend server must be running** - The API server on port 3001

## Setup Instructions

### 1. Start MySQL Database

Ensure MySQL is running and the database is created:

```sql
CREATE DATABASE mystic_logbook;
```

Run the schema migration:
```bash
cd server
npm run seed  # or execute the SQL schema
```

### 2. Start the Backend Server

```bash
cd server
npm run dev
```

The server should be running on http://localhost:3001

### 3. Start the Frontend (optional for API tests)

```bash
cd mystic-logbook
npm run dev
```

The frontend runs on http://localhost:8080

## Running Tests

### Run all tests
```bash
npm test
```

### Run API tests only
```bash
npm run test:api
```

### Run E2E tests only
```bash
npm run test:e2e
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests in headed mode
```bash
npm run test:headed
```

### View test report
```bash
npm run test:report
```

## Test Coverage

### Authentication Tests (auth.spec.ts)
- User registration
- Login with valid/invalid credentials
- Profile retrieval
- Profile updates
- Password change
- Logout
- Input validation

### Dreams API Tests (dreams.spec.ts)
- Get all dreams (with pagination and filtering)
- Get featured dreams
- Get dream by slug
- Create dream (admin only)
- Update dream (admin only)
- Delete dream (admin only)
- Like/unlike dream
- Favorite/unfavorite dream
- Get/add comments
- Get similar dreams

### Blog API Tests (blog.spec.ts)
- Get all blog posts (with pagination and filtering)
- Get post by slug
- Create/update/delete posts (admin only)
- Like posts
- Blog categories CRUD
- Newsletter subscription
- Comments

### Categories API Tests (categories.spec.ts)
- Get all categories
- Get category by ID
- Create/update/delete categories (admin only)

### Admin API Tests (admin.spec.ts)
- Dashboard statistics
- User management (CRUD)
- Role management
- Comment moderation
- Contact messages
- Audit logs
- Category stats

### Search Tests (search.spec.ts)
- Search functionality
- Search with filters
- Search suggestions
- Contact form submission

### E2E User Flows (user-flows.spec.ts)
- Complete user registration and login flow
- Dream browsing and viewing
- Blog browsing
- Search functionality
- Contact form submission
- Category browsing
- Pagination handling

## Expected Results

When the backend is running properly:
- **Total Tests**: 101
- **Expected Pass Rate**: ~95%+

## Troubleshooting

### Tests fail with connection errors
- Check if the backend server is running on port 3001
- Check if MySQL is running and accessible

### Tests fail with authentication errors
- Check JWT_SECRET in server/.env
- Ensure database has the required tables

### Database connection errors
- Verify MySQL credentials in server/.env
- Ensure the database exists

## Test Configuration

The Playwright configuration is in `playwright.config.ts`:
- Base URL: http://localhost:8080
- API URL: http://localhost:3001/api
- Reporter: HTML, JSON, and List reporters
- Browser: Chromium (default)

## Notes

- Tests are designed to be independent and can run in parallel
- Each test creates its own test data where needed
- Tests clean up after themselves where possible
- Admin tests require a user with admin role
