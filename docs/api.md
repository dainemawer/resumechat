# API Documentation

## Authentication

All authenticated endpoints require a valid Clerk session cookie. Public endpoints (like `/api/chat` for shared resumes) don't require authentication but may have rate limiting.

## Endpoints

### Resume Upload

**POST** `/api/resumes/upload`

Upload and parse a resume file (PDF or DOCX).

**Headers:**
```
Content-Type: multipart/form-data
Cookie: __session=<clerk-session>
```

**Body:**
```
file: File (PDF or DOCX, max 5MB)
```

**Response:**
```json
{
	"success": true,
	"resumeId": "uuid",
	"shareSlug": "unique-slug",
	"summary": "AI-generated summary",
	"parsedData": {
		"skills": ["React", "TypeScript"],
		"experience": [...],
		"education": [...]
	}
}
```

**Errors:**
- `400` - Invalid file type or size
- `401` - Unauthorized
- `403` - Subscription limit reached
- `500` - Server error

---

### Chat

**POST** `/api/chat`

Stream AI responses based on resume content.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
	"resumeId": "uuid",
	"shareSlug": "unique-slug",
	"message": "What are your technical skills?",
	"conversationHistory": []
}
```

**Response:**
Streaming response using Server-Sent Events (SSE)

```
data: {"type":"token","content":"I"}
data: {"type":"token","content":" have"}
data: {"type":"token","content":" expertise"}
...
data: {"type":"done"}
```

**Errors:**
- `400` - Invalid request
- `404` - Resume not found
- `429` - Rate limit exceeded
- `500` - Server error

---

### Stripe Checkout

**POST** `/api/stripe/create-checkout`

Create a Stripe Checkout session for Pro subscription.

**Headers:**
```
Content-Type: application/json
Cookie: __session=<clerk-session>
```

**Response:**
```json
{
	"sessionId": "cs_test_xxx",
	"url": "https://checkout.stripe.com/..."
}
```

---

### Stripe Customer Portal

**POST** `/api/stripe/create-portal`

Create a Stripe Customer Portal session for subscription management.

**Headers:**
```
Content-Type: application/json
Cookie: __session=<clerk-session>
```

**Response:**
```json
{
	"url": "https://billing.stripe.com/..."
}
```

---

### Check Subscription

**GET** `/api/stripe/check-subscription`

Get current user's subscription status.

**Headers:**
```
Cookie: __session=<clerk-session>
```

**Response:**
```json
{
	"tier": "pro",
	"status": "active",
	"currentPeriodEnd": "2024-02-01T00:00:00Z"
}
```

---

## Webhooks

### Clerk Webhook

**POST** `/api/webhooks/clerk`

Handles user lifecycle events from Clerk.

**Headers:**
```
svix-id: <message-id>
svix-timestamp: <timestamp>
svix-signature: <signature>
```

**Events Handled:**
- `user.created` - Create user in database
- `user.updated` - Update user data
- `user.deleted` - Delete user data

---

### Stripe Webhook

**POST** `/api/webhooks/stripe`

Handles payment and subscription events from Stripe.

**Headers:**
```
stripe-signature: <signature>
```

**Events Handled:**
- `checkout.session.completed` - Create subscription
- `customer.subscription.updated` - Update subscription
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_succeeded` - Confirm payment
- `invoice.payment_failed` - Handle failed payment

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/resumes/upload` | 5 requests | 1 hour |
| `/api/chat` | 50 requests (free) | 1 month |
| `/api/chat` | Unlimited (pro) | - |
| All authenticated routes | 100 requests | 15 minutes |

## Error Responses

All errors follow this format:

```json
{
	"error": {
		"code": "INVALID_FILE_TYPE",
		"message": "Only PDF and DOCX files are supported",
		"details": {}
	}
}
```

## Common Error Codes

- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not authorized for this resource
- `NOT_FOUND` - Resource not found
- `INVALID_INPUT` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SUBSCRIPTION_LIMIT` - Subscription limit reached
- `SERVER_ERROR` - Internal server error

