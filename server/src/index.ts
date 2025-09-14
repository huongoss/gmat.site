import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import os from 'os';
import authRoutes from './routes/auth';
import testRoutes from './routes/tests';
import resultRoutes from './routes/results';
import paymentsRoutes from './routes/payments';
import { handleWebhook as stripeWebhook } from './services/payments';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Middleware
app.use(cors());

// Stripe webhook MUST come before express.json() and use raw body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// JSON parser for normal API routes
app.use(express.json());

// Helper: write env content to a temp file and return its path
const writeTempPem = (filename: string, content?: string) => {
  if (!content) return undefined;
  const tmpDir = os.tmpdir();
  const full = path.join(tmpDir, filename);
  fs.writeFileSync(full, content, { encoding: 'utf8', mode: 0o600 });
  return full;
};

// Database connection
(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gmat-practice';

    // Support X.509 via either file paths or inline PEM content
    const certPath = process.env.MONGODB_TLS_CERT_PATH || writeTempPem('client.pem', process.env.MONGODB_TLS_CERT);
    const caPath = process.env.MONGODB_TLS_CA_PATH || writeTempPem('ca.pem', process.env.MONGODB_TLS_CA);

    const baseOpts: any = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose v5 option to use createIndex instead of ensureIndex
      useCreateIndex: true as any,
    };

    const x509Opts: any = certPath
      ? {
          tls: true,
          tlsCertificateKeyFile: certPath,
          // Atlas default CA is trusted by Node; include CA only if custom
          ...(caPath ? { tlsCAFile: caPath } : {}),
          authMechanism: 'MONGODB-X509',
          authSource: '$external',
        }
      : {};

    await mongoose.connect(mongoUri, { ...(baseOpts as any), ...(x509Opts as any) } as any);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
})();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/payments', paymentsRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});