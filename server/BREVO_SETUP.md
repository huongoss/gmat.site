# Brevo Email Integration

## Installation

Install the Brevo (formerly Sendinblue) SDK:

```bash
cd server
npm install sib-api-v3-sdk
# or
yarn add sib-api-v3-sdk
```

## Configuration

Add these environment variables to your `.env` file or `infra/env.yaml`:

```bash
# Email Provider Selection
EMAIL_PROVIDER=brevo  # Options: 'sendgrid' or 'brevo' (default: sendgrid)

# Brevo API Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=no-reply@gmat.site
BREVO_FROM_NAME=GMAT Practice

# Optional: Keep SendGrid as fallback
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=no-reply@gmat.site
```

## Getting Your Brevo API Key

1. Sign up at [https://www.brevo.com](https://www.brevo.com)
2. Go to Settings > API Keys
3. Create a new API key
4. Copy the key and add it to your environment variables

## Usage

### Automatic Provider Selection

The email service will automatically use the provider specified in `EMAIL_PROVIDER`:

```typescript
import { sendMail } from './services/email';

// Automatically uses Brevo or SendGrid based on EMAIL_PROVIDER
await sendMail('user@example.com', 'Welcome!', '<h1>Hello</h1>');
```

### Direct Brevo Usage

If you want to use Brevo-specific features (like campaigns):

```typescript
import { 
  sendBrevoMail, 
  createBrevoEmailCampaign 
} from './services/brevo';

// Send transactional email
await sendBrevoMail('user@example.com', 'Subject', '<p>Content</p>');

// Create email campaign
await createBrevoEmailCampaign({
  name: 'Monthly Newsletter',
  subject: 'GMAT Tips for December',
  htmlContent: '<h1>Newsletter content</h1>',
  listIds: [2, 7], // Your Brevo contact list IDs
  scheduledAt: '2024-12-01 10:00:00'
});
```

## Features

### Transactional Emails (via email.ts)
- ✅ Email verification
- ✅ Password reset
- ✅ Support notifications
- ✅ Automatic provider routing

### Brevo-Specific Features (via brevo.ts)
- ✅ Email campaigns
- ✅ Contact list management
- ✅ Scheduled sending
- ✅ Marketing automation ready

## Switching Providers

To switch from SendGrid to Brevo:

1. Install `sib-api-v3-sdk` package
2. Set `EMAIL_PROVIDER=brevo` in environment
3. Add `BREVO_API_KEY` and `BREVO_FROM_EMAIL`
4. Restart your server

No code changes needed - existing `sendMail()` calls work automatically!

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PROVIDER` | No | `sendgrid` | Which email service to use |
| `BREVO_API_KEY` | Yes (for Brevo) | - | Your Brevo API key |
| `BREVO_FROM_EMAIL` | No | `no-reply@example.com` | Sender email address |
| `BREVO_FROM_NAME` | No | `GMAT Practice` | Sender display name |
| `SENDGRID_API_KEY` | Yes (for SendGrid) | - | Your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | No | `no-reply@example.com` | Sender email address |

## Benefits of Brevo

- ✅ **Free tier**: 300 emails/day (vs SendGrid's 100/day)
- ✅ **Marketing campaigns**: Built-in campaign management
- ✅ **SMS support**: Send SMS in addition to emails
- ✅ **CRM features**: Contact management and segmentation
- ✅ **European compliance**: GDPR-ready infrastructure
- ✅ **Better deliverability**: High inbox placement rates

## Troubleshooting

### Package not found error
```bash
cd server
npm install sib-api-v3-sdk --save
```

### Emails not sending
1. Check `BREVO_API_KEY` is set correctly
2. Verify sender email is verified in Brevo dashboard
3. Check server logs for detailed error messages

### Using both providers
You can keep both configured and switch via environment variable without code changes!
