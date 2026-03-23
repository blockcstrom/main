# AGENTS.md - Coding Guidelines for This Repository

## Overview

This document provides coding guidelines and conventions for agents operating in this repository.
Adjust these rules based on the specific framework and language used in the project.

---

## Build, Lint, and Test Commands

### Common Commands (Node.js/TypeScript)

```bash
# Install dependencies
npm install

# Build project
npm run build

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run type checking
npm run typecheck

# Run all tests
npm test

# Run a single test file
npm test -- path/to/testfile.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Python Projects

```bash
# Install dependencies
pip install -r requirements.txt

# Run linter (ruff)
ruff check .

# Format code
ruff format .

# Type checking (mypy)
mypy .

# Run tests
pytest

# Run single test
pytest tests/test_file.py::test_function

# Run tests with coverage
pytest --cov=. --cov-report=html
```

### Go Projects

```bash
# Build
go build ./...

# Run linter
golangci-lint run

# Format code
go fmt ./...

# Type checking
go vet ./...

# Run tests
go test ./...

# Run single test
go test -run TestFunctionName ./package

# Run tests with coverage
go test -coverprofile=coverage.out ./...
```

---

## Code Style Guidelines

### General Principles

- **Write clean, readable code** - Code is read more than written
- **Keep functions small and focused** - Single responsibility principle
- **Use meaningful names** - Variables, functions, and files should have descriptive names
- **Avoid magic numbers** - Use constants instead of hardcoded values
- **Comment the "why", not the "what"** - Explain intent, not implementation

### Imports

```typescript
// TypeScript/JavaScript: Group imports by type
// 1. Built-in/External libraries
import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal modules (relative paths first, then aliases)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '../utils/date';
import { validateEmail } from './validators';

// 3. Type imports
import type { User, Task } from '@/types';

// 4. Side-effect imports
import './styles.css';

// Use namespace imports sparingly
import * as fs from 'fs';
```

```python
# Python: Use isort-compatible ordering
# Standard library
import os
import sys
from pathlib import Path
from typing import Optional, List

# Third-party packages
import requests
from fastapi import APIRouter
from pydantic import BaseModel

# Local application
from app.api import routes
from app.models import User
from app.utils import format_date
```

### Formatting

- **Use 2 or 4 spaces for indentation** (match project convention)
- **Maximum line length: 80-120 characters** (typically 100)
- **Add trailing comma** in multi-line objects/arrays
- **Use semicolons** in JavaScript/TypeScript
- **One blank line between top-level definitions**
- **No blank lines inside functions** unless it improves readability

```typescript
// Good
const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
};

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Avoid
const user={id:1,name:'John Doe',email:'john@example.com'};
function calculateTotal(items:Item[]):number{return items.reduce((sum,item)=>sum+item.price,0)}
```

### Types

- **Use explicit types** for function parameters and return values
- **Avoid `any`** - Use `unknown` when type is truly unknown
- **Use interfaces** for objects, types for unions/primitives
- **Use optional chaining** and nullish coalescing

```typescript
// Good
interface User {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'user'; // Optional property
}

function getUserById(id: number): Promise<User | null> {
  // ...
}

function processData(data: unknown): string {
  if (isUser(data)) {
    return data.name;
  }
  return '';
}

// Avoid
function processData(data: any): any {
  // ...
}
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Functions | camelCase | `getUserById()`, `calculateTotal()` |
| Classes | PascalCase | `UserService`, `PaymentProcessor` |
| Interfaces | PascalCase | `User`, `ApiResponse` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `API_BASE_URL` |
| Files | kebab-case | `user-service.ts`, `api-client.js` |
| Components (React) | PascalCase | `UserProfile.tsx`, `Button.tsx` |
| Database tables | snake_case | `user_profiles`, `order_items` |

### Error Handling

- **Use try/catch** for async operations
- **Create custom error classes** for domain-specific errors
- **Log errors** with appropriate context
- **Never expose sensitive information** in error messages

```typescript
// Good
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchUser(id: number): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
    }
    logger.error('Failed to fetch user', { id, error });
    throw new ApiError('Internal error', 500, 'INTERNAL_ERROR');
  }
}

// Avoid
async function fetchUser(id: number): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.log(error); // Don't just log to console
    throw error; // Re-throw without context
  }
}
```

### File Organization

```
src/
├── components/        # Reusable UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
├── pages/             # Page-level components
├── hooks/             # Custom React hooks
├── services/          # API clients, business logic
├── utils/             # Helper functions
├── types/             # TypeScript type definitions
├── constants/         # Application constants
└── index.ts           # Main entry point
```

### Testing Guidelines

- **Name test files** as `*.test.ts` or `*.spec.ts`
- **Follow AAA pattern**: Arrange, Act, Assert
- **Test one thing** per test case
- **Use descriptive test names**: `should return user when valid ID provided`

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid ID is provided', async () => {
      // Arrange
      const userId = 123;
      const mockUser = { id: 123, name: 'John' };

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const userId = 999;

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Git Conventions

- **Use conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- **Keep commits small** and focused
- **Write descriptive PR titles**
- **Never commit secrets** - Use environment variables

---

## Project-Specific Notes

*(To be filled in as the project develops)*

- Framework: 
- Language version: 
- Primary package manager: 
- Test framework: 
- Linter/Formatter: 

---

## When in Doubt

1. Follow existing code style in the project
2. Ask for clarification if requirements are unclear
3. Prioritize readability over cleverness
4. Write tests for new functionality
5. Run linting before committing