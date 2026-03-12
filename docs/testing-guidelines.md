# Testing Guidelines

## Overview

This document outlines the testing guidelines for the task management application. All tests should follow these conventions to ensure consistency and maintainability across the codebase.

## Unit Tests

- Use **Jest** to test individual functions and React components in isolation.
- Unit tests should not rely on external services, databases, or network calls — mock dependencies where necessary.
- Each test should focus on a single behaviour or outcome.

## File Naming Convention

- Test files must use the naming convention `*.test.js` or `*.test.ts`.
- Name test files after the file they are testing. For example, `app.js` should be tested in `app.test.js`, and `app.ts` in `app.test.ts`.

## File Locations

- **Backend tests**: `packages/backend/__tests__/`
- **Frontend tests**: `packages/frontend/src/__tests__/`

## Integration Tests

- Use **Jest + Supertest** to test backend API endpoints with real HTTP requests.
- Integration tests should be placed in `packages/backend/__tests__/integration/`.
- Use the same naming convention as unit tests: `*.test.js` or `*.test.ts`.
- Name integration test files based on the API or feature being tested. For example, tests for the TODO API should be named `todo-api.test.js`.

## End-to-End (E2E) Tests

- Use **Playwright** to test complete UI workflows through browser automation.
- E2E tests should be placed in `tests/e2e/`.
- Use the naming convention `*.spec.js` or `*.spec.ts`.
- Name E2E test files based on the user journey they test. For example, a test covering the TODO workflow should be named `todo-workflow.spec.js`.

## General Guidelines

- Write tests that are readable and self-documenting — test descriptions should clearly state what behaviour is being verified.
- Keep tests isolated and independent from one another; each test should set up its own data and not rely on the state left by another test.
- Use setup and teardown hooks to ensure tests are repeatable and succeed across multiple runs.
- Aim for meaningful coverage of core logic and edge cases rather than chasing a coverage percentage.
- Limit E2E tests to 5–8 critical user journeys — focus on happy paths and key edge cases, not exhaustive coverage.
- Playwright tests must use one browser only.
- Playwright tests must use the **Page Object Model (POM)** pattern for maintainability.
- All new features must include appropriate tests (unit, integration, or E2E as applicable).
- Tests should be maintainable and follow best practices — avoid duplication, keep assertions focused, and refactor tests alongside source code.
- Update or remove tests when the code they cover changes.

## Port Configuration

Always use environment variables with sensible defaults for port configuration to allow CI/CD workflows to dynamically detect ports.

- **Backend**: `const PORT = process.env.PORT || 3030;`
- **Frontend**: React's default port is `3000`, but can be overridden with the `PORT` environment variable.
