# Coding Guidelines

## Overview

This document describes the coding style and quality principles for the task management application. All contributors should follow these guidelines to ensure the codebase remains readable, consistent, and maintainable.

## General Formatting

Consistent formatting is enforced across the entire codebase. Code should be easy to scan — use 2-space indentation, keep lines under 100 characters where practical, and end files with a newline. Use single quotes for strings in JavaScript unless the string itself contains a single quote, in which case double quotes are preferred. Always use semicolons to terminate statements.

Avoid deeply nested code. If a function requires more than two or three levels of nesting, consider refactoring into smaller, named helper functions to improve readability.

## Import Organisation

Imports should be grouped and ordered consistently at the top of each file:

1. **External dependencies** (e.g., `react`, `express`) — first.
2. **Internal modules** (e.g., local components, utilities, services) — second.
3. **Styles and assets** — last.

Leave a blank line between each group. Avoid wildcard imports (`import * as ...`) unless there is a clear reason to do so. Remove unused imports — they add noise and can confuse tooling.

## Linting

This project uses **ESLint** to enforce code quality rules. All code must pass the linter without errors or warnings before being committed. Run the linter locally before pushing:

```bash
npm run lint
```

Do not disable lint rules inline (e.g., `// eslint-disable-next-line`) without a clear, commented justification. If a rule consistently produces false positives for a legitimate pattern, update the shared ESLint configuration instead.

## DRY Principle

Do not Repeat Yourself. If the same logic appears in more than one place, extract it into a shared function, hook, or utility. This applies to both business logic and UI patterns. Repeated code is harder to maintain — a change in one place requires the same change everywhere else.

That said, avoid premature abstraction. Only extract shared logic when the duplication is clear and the abstraction genuinely simplifies the code. A helper that is only used once may not be worth the indirection.

## Naming Conventions

- Use **camelCase** for variables and functions: `taskList`, `handleDelete`.
- Use **PascalCase** for React components and classes: `TaskItem`, `AppRouter`.
- Use **UPPER_SNAKE_CASE** for constants: `MAX_TASKS`, `DEFAULT_PORT`.
- File names should match the primary export they contain (e.g., `TaskItem.js` exports `TaskItem`).

## Code Quality Principles

- **Single Responsibility**: Each function and component should do one thing well. If a function is doing several unrelated things, split it.
- **Clarity over cleverness**: Write code that is easy to understand at a glance. Avoid overly terse or clever expressions that sacrifice readability.
- **Avoid magic numbers and strings**: Replace unexplained literal values with named constants that communicate intent.
- **Keep functions small**: Functions should be short enough to understand without scrolling. If a function grows beyond ~30 lines, consider breaking it up.
- **Consistent error handling**: Handle errors at the appropriate layer — surface user-facing errors in the UI, log unexpected errors on the backend, and never swallow errors silently.
