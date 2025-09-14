import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import authRoutes from './routes/auth';
import testRoutes from './routes/tests';
import resultRoutes from './routes/results';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gmat-practice', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose v5 option to use createIndex instead of ensureIndex
      useCreateIndex: true as any,
    } as any);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
})();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);

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