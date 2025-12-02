# Brevo Email Integration - Summary

## What's Been Added

✅ **Brevo email service** as an alternative to SendGrid
✅ **Automatic provider routing** - switch via environment variable
✅ **Campaign support** - create marketing email campaigns
✅ **Backward compatible** - existing code works without changes

## Files Modified/Created

### New Files
- `server/src/services/brevo.ts` - Standalone Brevo service with campaign support
- `server/BREVO_SETUP.md` - Complete setup and usage documentation

### Modified Files
- `server/src/services/email.ts` - Added automatic Brevo routing
- `server/package.json` - Added `sib-api-v3-sdk` dependency
- `server/.env.example` - Added Brevo configuration options

## Quick Setup

### 1. Install Package
```bash
cd server
npm install
# or
yarn install
```

### 2. Configure Environment
Add to your `.env` or `infra/env.yaml`:
```bash
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your_api_key_here
BREVO_FROM_EMAIL=no-reply@gmat.site
BREVO_FROM_NAME=GMAT Practice
```

### 3. Get Brevo API Key
1. Sign up at https://www.brevo.com
2. Go to Settings → API Keys
3. Create new key and copy it

## Usage Examples

### Transactional Emails (Automatic Routing)
```typescript
import { sendMail, sendVerificationEmail } from './services/email';

// Uses Brevo if EMAIL_PROVIDER=brevo, otherwise SendGrid
await sendMail('user@example.com', 'Welcome!', '<h1>Hello</h1>');
await sendVerificationEmail('user@example.com', 'token123');
```

### Email Campaigns (Brevo-Specific)
```typescript
import { createBrevoEmailCampaign } from './services/brevo';

await createBrevoEmailCampaign({
  name: 'December GMAT Tips',
  subject: 'Boost Your GMAT Score',
  htmlContent: '<h1>Study Tips...</h1>',
  listIds: [2, 7], // Your contact lists
  scheduledAt: '2024-12-15 10:00:00'
});
```

## Key Features

### Provider Flexibility
- ✅ Switch providers via environment variable
- ✅ No code changes needed
- ✅ Can keep both configured as backup

### Brevo Advantages
- **Free Tier**: 300 emails/day (vs SendGrid 100/day)
- **Marketing**: Built-in campaign management
- **SMS**: Can send SMS too
- **CRM**: Contact list management
- **GDPR**: European data compliance

### Implementation Details
- Dynamic imports prevent requiring Brevo package if not used
- Graceful fallback to console logging in development
- Same API for both providers
- Type-safe with TypeScript

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `EMAIL_PROVIDER` | No | `sendgrid` | Choose email service |
| `BREVO_API_KEY` | If using Brevo | - | API authentication |
| `BREVO_FROM_EMAIL` | No | `no-reply@example.com` | Sender address |
| `BREVO_FROM_NAME` | No | `GMAT Practice` | Sender name |

## Testing

### Development Mode
If no API key is set, emails are logged to console:
```
[DEV EMAIL - Brevo] { to: 'user@example.com', subject: '...', html: '...' }
```

### Switching Providers
Change `EMAIL_PROVIDER=brevo` → `EMAIL_PROVIDER=sendgrid` and restart.

## Next Steps

1. **Install dependencies**: `cd server && npm install`
2. **Get Brevo API key**: Sign up at brevo.com
3. **Update environment**: Add BREVO_API_KEY
4. **Test**: Send a verification email
5. **Optional**: Create email campaigns for marketing

## Documentation

See `server/BREVO_SETUP.md` for:
- Detailed installation steps
- API key setup guide
- Campaign creation examples
- Troubleshooting tips
- Feature comparison

## Benefits

✅ **Cost-effective**: Better free tier than SendGrid
✅ **Zero migration effort**: Works with existing code
✅ **Feature-rich**: Campaigns, SMS, CRM included
✅ **Reliable**: High deliverability rates
✅ **Flexible**: Easy to switch back to SendGrid if needed
