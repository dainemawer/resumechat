# System Architecture

## Overview

ResumeChat is built as a modern serverless application using Next.js 15 App Router with React Server Components, providing an optimal balance between performance, developer experience, and scalability.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Vercel AI SDK** - Streaming AI responses

### Backend
- **Next.js API Routes** - Serverless functions
- **Supabase** - PostgreSQL database with pgvector
- **Clerk** - Authentication and user management
- **Stripe** - Subscription payments
- **OpenAI API** - AI chat and embeddings

### Development
- **Biome** - Fast linting and formatting
- **Vitest** - Unit and integration testing
- **React Testing Library** - Component testing

## Architecture Patterns

### Server Components First

We follow Next.js 15 best practices by using Server Components by default:
- Faster initial page loads
- Reduced JavaScript bundle size
- Direct database access
- Automatic code splitting

Client Components (`'use client'`) are used only when necessary for:
- Interactive UI elements
- Browser APIs
- React hooks like useState, useEffect

### API Design

All API routes follow RESTful conventions:
- `POST /api/resumes/upload` - Upload and parse resume
- `POST /api/chat` - Stream chat responses
- `POST /api/stripe/create-checkout` - Create payment session
- `POST /api/webhooks/clerk` - Handle user events
- `POST /api/webhooks/stripe` - Handle payment events

### Database Architecture

**Supabase PostgreSQL with pgvector:**
- Row Level Security (RLS) for data isolation
- Vector similarity search for semantic retrieval
- Automatic backups and point-in-time recovery
- Real-time subscriptions (future enhancement)

### Authentication Flow

1. User signs up/in via Clerk
2. Clerk webhook creates user record in Supabase
3. Session managed by Clerk (JWT cookies)
4. Middleware protects authenticated routes
5. RLS policies enforce data access

### Payment Flow

1. User clicks upgrade button
2. Stripe Checkout session created
3. User completes payment
4. Stripe webhook updates subscription in database
5. Features unlocked immediately

### AI Pipeline

**Resume Processing:**
1. Upload PDF/DOCX → Parse text
2. Clean and structure with GPT-4
3. Generate embeddings (text-embedding-3-small)
4. Store chunks with vectors in database

**Chat Flow:**
1. User question received
2. Vector similarity search for context
3. Build prompt with relevant resume sections
4. Stream GPT-4 response with AI SDK
5. Store interaction in database

## Data Flow

```
User Browser
    ↓
Next.js Middleware (Auth Check)
    ↓
Server Component (Data Fetch)
    ↓
Supabase (RLS Enforced)
    ↓
Client Component (Interactive UI)
```

## Security Layers

1. **Authentication** - Clerk JWT validation
2. **Authorization** - RLS policies in Supabase
3. **Input Validation** - Zod schemas
4. **Rate Limiting** - API route protection
5. **HTTPS Only** - Enforced in production
6. **CSP Headers** - XSS prevention
7. **Webhook Verification** - Signed requests only

## Scalability

### Current Capacity
- **Users:** Unlimited (serverless)
- **Requests:** Auto-scales on Vercel
- **Database:** Supabase handles 100k+ rows
- **Storage:** Text-only (no file storage)

### Optimization Strategies
- Edge functions for authentication
- Streaming responses for chat
- Incremental Static Regeneration (ISR)
- Image optimization with next/image
- Font optimization with next/font

## Deployment

**Vercel Platform:**
- Automatic CI/CD from Git
- Edge network distribution
- Built-in analytics
- Preview deployments for PRs
- Environment variable management

## Monitoring

- Vercel Analytics for performance
- Supabase logs for database queries
- Stripe Dashboard for payments
- Custom error logging (future: Sentry)

## Future Enhancements

1. **Real-time Features** - Supabase real-time subscriptions
2. **Edge Functions** - Move auth to edge for <50ms response
3. **CDN Caching** - Cache public share pages
4. **Background Jobs** - Queue for embeddings generation
5. **Multi-region** - Deploy closer to users globally

