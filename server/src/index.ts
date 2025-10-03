import './config/env';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
// X.509 support removed; simplified SCRAM/password connection only
import authRoutes from './routes/auth';
import testRoutes from './routes/tests';
import resultRoutes from './routes/results';
import supportRoutes from './routes/support';
import paymentRoutes from './routes/payments';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Optional config diagnostics (enable by setting DEBUG_CONFIG=1)
if (process.env.DEBUG_CONFIG === '1') {
  const keys = ['MONGODB_URI','JWT_SECRET','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','SENDGRID_API_KEY'];
  const report: Record<string,string> = {};
  for (const k of keys) {
    const v = process.env[k];
    report[k] = v ? `present(len=${v.length})` : 'MISSING';
  }
  console.log('[config-diagnostics]', report);
  if (!process.env.MONGODB_URI) console.warn('[config] MONGODB_URI not set; will fallback to local default');
}

// Middleware
app.use(cors());
app.use(express.json());

// Basic request logger (dev aid)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[req] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

async function connectMongo(retries = 5) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gmat-practice';
  const opts: any = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
  };
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[mongo] attempt ${attempt} -> ${uri.split('@').pop()}`);
      await mongoose.connect(uri, opts);
      console.log('[mongo] connected');
      return;
    } catch (err:any) {
      const code = err?.code || err?.name;
      console.error(`[mongo] FAIL attempt ${attempt} code=${code} msg=${err?.message}`);
      if (/auth/i.test(err?.message || '')) {
        console.error('[mongo] Authentication error: verify username/password in MONGODB_URI.');
      }
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1500));
    }
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payments', (req, _res, next) => { console.log('[payments-route] hit', req.method, req.originalUrl); next(); }, paymentRoutes);

// Dev helper: endpoint to receive client console log forwarding
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/client-log', (req, res) => {
    try {
      const { level, messages, ts, clientId } = req.body || {};
      const safeLevel = ['log','info','warn','error','debug'].includes(level) ? level : 'log';
  (console as any)[safeLevel](`[client:${clientId || 'anon'}]`, ts || Date.now(), ...(Array.isArray(messages)?messages:[]));
      res.json({ ok: true });
    } catch (e:any) {
      console.error('client-log forward failed', e?.message);
      res.status(400).json({ ok:false });
    }
  });
}

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Centralized error handler (must have 4 params for Express to recognize it)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Always log the full error on the server
  console.error('[ERROR]', err);

  if (res.headersSent) return;
  res.status(err.status || 500).json({ message: 'Internal server error' });
});

// Start after DB is ready
connectMongo()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT} (DB ready)`));
  })
  .catch(err => {
    console.error('[startup] FATAL Mongo connection failure');
    console.error(err);
    process.exit(1);
  });