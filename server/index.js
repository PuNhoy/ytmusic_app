import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import searchRouter from './routes/search.js';
import favoritesRouter from './routes/favorites.js';
import historyRouter from './routes/history.js';
import playlistsRouter from './routes/playlists.js';
import { checkDbConnection } from './db/index.js';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === CLIENT_URL ||
        origin === 'http://localhost:5173' ||
        origin === 'http://127.0.0.1:5173'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body parser
app.use(express.json());

// 4. Rate Limiting (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please wait a few minutes before trying again.',
  },
});

app.use('/api/', apiLimiter);

// 5. Health Check Endpoint (Includes PostgreSQL status)
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDbConnection();

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(
      process.env.YOUTUBE_API_KEY &&
      process.env.YOUTUBE_API_KEY !== 'your_youtube_api_key_here'
    ),
    database: {
      connected: dbStatus.ok,
      ...(dbStatus.ok
        ? { database: dbStatus.database, time: dbStatus.timestamp }
        : { error: dbStatus.error, hint: 'Run `npm run db:init` after setting PGPASSWORD in server/.env' }),
    },
  });
});

// 6. Application Routes
app.use('/api/search', searchRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/history', historyRouter);
app.use('/api/playlists', playlistsRouter);

// 7. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const errorTitle = err.code || (status === 500 ? 'Internal Server Error' : 'Error');
  const message = err.message || 'An unexpected error occurred.';

  console.error(`[Error ${status}] ${errorTitle}: ${message}`);

  res.status(status).json({
    error: errorTitle,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🎵 BeatStream Music API running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}/api/search`);
  console.log(`💓 Health: http://localhost:${PORT}/api/health`);

  // YouTube API Check
  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    console.warn(`⚠️  WARNING: YOUTUBE_API_KEY is not set in server/.env.`);
    console.warn(`   Get one from https://console.cloud.google.com/apis/credentials`);
  } else {
    console.log(`🔑 YouTube API key detected.`);
  }

  // Database Connection Check
  const dbStatus = await checkDbConnection();
  if (dbStatus.ok) {
    console.log(`🐘 PostgreSQL connected: ${dbStatus.database}`);
  } else {
    console.warn(`⚠️  PostgreSQL not connected (${dbStatus.error}).`);
    console.warn(`   To connect: set PGPASSWORD in server/.env, then run: npm run db:init`);
  }
  console.log(`===============================================`);
});

export default app;
