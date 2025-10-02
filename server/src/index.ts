import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import authRoutes from './routes/auth';
import testRoutes from './routes/tests';
import resultRoutes from './routes/results';
import supportRoutes from './routes/support';
import paymentRoutes from './routes/payments';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

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

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gmat-practice', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err: unknown) => console.error('MongoDB connection error:', err));

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

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});