# Deployment Guide

## Vercel Deployment

### Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Git repository (GitHub, GitLab, or Bitbucket)
- All third-party services configured (Clerk, Supabase, OpenAI, Stripe)

### Initial Setup

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link project
   vercel link
   ```

2. **Configure Project**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**
   
   Add all variables from `.env.local.example` in Vercel dashboard:
   
   - Go to Project Settings → Environment Variables
   - Add each variable for Production, Preview, and Development
   - Use different keys for production (e.g., production Stripe keys)

### Production Environment Variables

```bash
# Clerk (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# OpenAI (Production)
OPENAI_API_KEY=sk-xxx

# Stripe (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_PRO=price_xxx

# Application
NEXT_PUBLIC_APP_URL=https://resumechat.ai
```

### Custom Domain

1. Add domain in Vercel dashboard
2. Configure DNS records:
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```
3. Enable HTTPS (automatic with Vercel)
4. Update environment variables with new domain

### Webhook Configuration

#### Clerk Webhook

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://resumechat.ai/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

#### Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://resumechat.ai/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Database Migration

1. **Export from Development**
   ```bash
   # Dump schema
   pg_dump -h db.xxx.supabase.co \
     -U postgres \
     -d postgres \
     --schema-only \
     -f schema.sql
   
   # Dump data (if needed)
   pg_dump -h db.xxx.supabase.co \
     -U postgres \
     -d postgres \
     --data-only \
     -f data.sql
   ```

2. **Import to Production**
   ```bash
   # In Supabase SQL Editor, run:
   # 1. Enable pgvector
   # 2. Create tables
   # 3. Set up RLS policies
   # 4. Create indexes
   ```

### Deployment Process

#### Automatic Deployment

```bash
# Push to main branch
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Runs checks
# 4. Deploys to production
```

#### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Preview Deployments

- Every pull request gets a unique preview URL
- Test changes before merging
- Share with stakeholders for feedback

### Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

## Monitoring & Analytics

### Vercel Analytics

Enable in project settings:
- Web Vitals tracking
- Real User Monitoring (RUM)
- Custom events

### Error Tracking

Optional: Integrate Sentry

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Logging

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => ({ level: label }),
    },
  }),
});
```

## Performance Optimization

### Build Optimization

```typescript
// next.config.ts
const nextConfig = {
  // ... existing config
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
};
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // for above-the-fold images
/>
```

### Font Optimization

```typescript
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
```

## Security Checklist

- [ ] All environment variables set
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers configured
- [ ] Webhook signatures verified
- [ ] API rate limiting enabled
- [ ] RLS policies tested
- [ ] Error messages sanitized
- [ ] Dependencies audited

## Post-Deployment

### Smoke Tests

1. Sign up with test account
2. Upload test resume
3. Verify chat functionality
4. Test payment flow (Stripe test mode first)
5. Check public share links
6. Verify webhook delivery

### Monitoring

- Check Vercel logs for errors
- Monitor Supabase database performance
- Review Stripe Dashboard for payment issues
- Track OpenAI API usage

### Backups

- Supabase: Daily automatic backups
- Code: Git repository
- Environment variables: Store securely (password manager)

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
vercel --force

# Check build logs
vercel logs <deployment-url>
```

### Runtime Errors

1. Check Vercel function logs
2. Verify environment variables
3. Test webhook endpoints
4. Review Supabase logs

### Database Issues

1. Check connection pool limits
2. Verify RLS policies
3. Review slow query logs
4. Ensure indexes are created

## Scaling Considerations

### Traffic Spikes
- Vercel auto-scales serverless functions
- Monitor function execution limits
- Consider edge functions for authentication

### Database
- Supabase Pro for larger databases
- Connection pooling (PgBouncer)
- Read replicas for high traffic

### Costs
- Monitor Vercel usage dashboard
- Track OpenAI API costs
- Review Stripe transaction fees
- Optimize database queries

## Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check uptime (Vercel analytics)
- [ ] Monitor API usage

### Monthly
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Backup verification
- [ ] Performance review

### Quarterly
- [ ] Security audit
- [ ] Load testing
- [ ] Cost optimization review
- [ ] User feedback analysis

## Emergency Procedures

### Service Outage

1. Check Vercel status page
2. Verify third-party services (Clerk, Supabase, OpenAI, Stripe)
3. Roll back to last known good deployment
4. Notify users via status page

### Data Breach

1. Immediately rotate all API keys
2. Notify affected users
3. Review access logs
4. Conduct security audit
5. Implement fixes
6. Post-mortem analysis

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

