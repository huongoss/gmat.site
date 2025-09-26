import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import path from 'path';
import authRoutes from './routes/auth';
import testRoutes from './routes/tests';
import resultRoutes from './routes/results';
import paymentRoutes from './routes/payments';
import { handleWebhook as stripeWebhook } from './services/payments';
import cors from 'cors';
import rateLimit from './middleware/rateLimit';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Middleware
// Trust proxy (needed on Cloud Run / reverse proxies)
app.set('trust proxy', true);

app.use(cors());

// Stripe webhook MUST be before express.json() and use raw body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// JSON parser for normal API routes
app.use(express.json());

// Basic rate limiting for API
app.use(rateLimit);

// Database connection
(async () => {
  try {
    // Helper: write inline PEM to a temp file when provided
    const writeTempPem = (filename: string, content?: string) => {
      if (!content) return undefined;
      const trimmed = content.trim();
      if (!trimmed.startsWith('-----BEGIN')) {
        console.warn(`[mongo] Inline PEM for ${filename} missing BEGIN header; ignoring.`);
        return undefined;
      }
      const full = path.join(os.tmpdir(), filename);
      fs.writeFileSync(full, trimmed, { encoding: 'utf8', mode: 0o600 });
      return full;
    };

    const mongoUri = (process.env.MONGODB_URI as string) || 'mongodb://localhost:27017/gmat-practice';

    // Prefer provided file paths, otherwise accept inline PEM content
    const certPath = process.env.MONGODB_TLS_CERT_PATH || writeTempPem('client.pem', process.env.MONGODB_TLS_CERT);
    const caPath = process.env.MONGODB_TLS_CA_PATH || writeTempPem('ca.pem', process.env.MONGODB_TLS_CA);

    const x509Opts: Record<string, unknown> = certPath
      ? {
          tls: true,
          tlsCertificateKeyFile: certPath,
          ...(caPath ? { tlsCAFile: caPath } : {}),
          authMechanism: 'MONGODB-X509',
          authSource: '$external',
        }
      : {};

    await mongoose.connect(mongoUri, x509Opts as any);
    console.log(`MongoDB connected${certPath ? ' (X.509 TLS)' : ''}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
})();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/payments', paymentRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler (logs to stderr which Cloud Run captures)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Process-level safety nets
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', err);
});