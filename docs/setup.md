# Setup Guide

## Prerequisites

- Node.js 18.17 or higher
- npm or yarn package manager
- Git
- Accounts for: Clerk, Supabase, OpenAI, Stripe

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd resumechat
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in all required environment variables (see Configuration section below).

### 3. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable the pgvector extension
3. Run the migration scripts (see `docs/database.md`)
4. Configure RLS policies

### 4. Authentication Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Configure allowed redirect URLs:
   - `http://localhost:3000`
   - `http://localhost:3000/sign-in`
   - `http://localhost:3000/sign-up`
3. Set up webhook endpoint for user sync

### 5. Payments Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create products for Free and Pro tiers
3. Configure webhook endpoints
4. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### 6. AI Configuration

1. Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Set usage limits in OpenAI dashboard
3. Configure rate limiting for your application

## Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Run tests with coverage

## Configuration

### Clerk

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Webhook signing secret

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

### OpenAI

- `OPENAI_API_KEY` - Your OpenAI API key

### Stripe

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Publishable key
- `STRIPE_SECRET_KEY` - Secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `STRIPE_PRICE_ID_PRO` - Price ID for Pro tier

## Troubleshooting

### Database Connection Issues

- Verify Supabase credentials
- Check if pgvector extension is enabled
- Ensure RLS policies are correctly configured

### Authentication Issues

- Clear browser cookies
- Verify Clerk redirect URLs
- Check webhook configuration

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

## Next Steps

- Review `docs/architecture.md` for system overview
- Check `docs/api.md` for API documentation
- Read `docs/security.md` for security best practices

