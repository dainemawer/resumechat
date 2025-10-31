# Testing Strategy

## Overview

ResumeChat uses Vitest for unit and integration tests, and React Testing Library for component tests. We aim for 80%+ coverage on critical paths and 100% coverage on payment/security logic.

## Test Stack

- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing
- **Testing Library Jest DOM** - Custom matchers
- **MSW** - API mocking (future)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

## Test Structure

### Unit Tests

**Location:** Co-located with source files in `__tests__` folders

```typescript
// src/lib/utils/__tests__/slug.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlug } from '../slug';

describe('generateSlug', () => {
	it('should generate a URL-safe slug', () => {
		const slug = generateSlug('John Doe');
		expect(slug).toMatch(/^[a-z0-9-]+$/);
	});

	it('should be unique for each call', () => {
		const slug1 = generateSlug('John Doe');
		const slug2 = generateSlug('John Doe');
		expect(slug1).not.toBe(slug2);
	});
});
```

### Component Tests

```typescript
// src/components/ui/__tests__/button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
	it('should render with children', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
	});

	it('should call onClick when clicked', async () => {
		const handleClick = vi.fn();
		const user = userEvent.setup();
		
		render(<Button onClick={handleClick}>Click me</Button>);
		await user.click(screen.getByRole('button'));
		
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it('should be disabled when disabled prop is true', () => {
		render(<Button disabled>Click me</Button>);
		expect(screen.getByRole('button')).toBeDisabled();
	});
});
```

### Integration Tests

```typescript
// src/app/api/resumes/__tests__/upload.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../upload/route';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/openai/structure-resume');

describe('Resume Upload API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should upload and process PDF file', async () => {
		const formData = new FormData();
		formData.append('file', new File(['test'], 'resume.pdf', { type: 'application/pdf' }));
		
		const request = new Request('http://localhost:3000/api/resumes/upload', {
			method: 'POST',
			body: formData,
		});

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('resumeId');
		expect(data).toHaveProperty('shareSlug');
	});

	it('should reject invalid file types', async () => {
		const formData = new FormData();
		formData.append('file', new File(['test'], 'resume.txt', { type: 'text/plain' }));
		
		const request = new Request('http://localhost:3000/api/resumes/upload', {
			method: 'POST',
			body: formData,
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});
});
```

## Testing Patterns

### Test Data Factories

```typescript
// src/lib/test-data.ts
export const createMockUser = (overrides = {}) => ({
	id: 'user_123',
	clerkId: 'clerk_123',
	email: 'test@example.com',
	name: 'Test User',
	subscriptionTier: 'free',
	...overrides,
});

export const createMockResume = (overrides = {}) => ({
	id: 'resume_123',
	userId: 'user_123',
	rawText: 'Sample resume text...',
	parsedJson: { skills: ['React'], experience: [] },
	summary: 'Experienced developer',
	shareSlug: 'test-slug',
	fileName: 'resume.pdf',
	...overrides,
});
```

### Custom Render Helpers

```typescript
// src/lib/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<ClerkProvider>
			{children}
		</ClerkProvider>
	);
};

export const renderWithProviders = (
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>
) => {
	return render(ui, { wrapper: AllProviders, ...options });
};

export * from '@testing-library/react';
```

### Mocking External Services

```typescript
// src/lib/__mocks__/supabase/server.ts
import { vi } from 'vitest';

export const createServerClient = vi.fn(() => ({
	from: vi.fn(() => ({
		select: vi.fn().mockResolvedValue({ data: [], error: null }),
		insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
		update: vi.fn().mockResolvedValue({ data: {}, error: null }),
		delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
	})),
	auth: {
		getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
	},
}));
```

## Coverage Goals

### Critical Paths (100% Coverage)
- Payment processing
- Authentication flows
- Data validation
- Webhook handlers
- RLS policies

### Standard Paths (80% Coverage)
- Business logic
- Utility functions
- API routes
- React components

### Lower Priority (60% Coverage)
- UI components without logic
- Configuration files
- Type definitions

## Testing Checklist

### Before Committing
- [ ] All tests passing
- [ ] No skipped tests without justification
- [ ] Coverage thresholds met
- [ ] No console errors in tests

### Pull Request
- [ ] New features have tests
- [ ] Bug fixes include regression tests
- [ ] Integration tests for API changes
- [ ] Component tests for UI changes

## Best Practices

### Do's ✅
- Test behavior, not implementation
- Use meaningful test descriptions
- Keep tests focused and simple
- Mock external dependencies
- Use data factories for test data
- Test edge cases and error states
- Write tests before fixing bugs

### Don'ts ❌
- Don't test third-party libraries
- Don't test implementation details
- Don't skip tests without good reason
- Don't use real API keys in tests
- Don't commit tests that fail intermittently
- Don't over-mock (test as close to reality as possible)

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Vitest UI

```bash
npm test -- --ui
```

### Debug in VS Code

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["--run"],
  "console": "integratedTerminal"
}
```

### Screen Debugging

```typescript
import { screen } from '@testing-library/react';

// Print DOM to console
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

