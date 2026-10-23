import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import searchRouter from './routes/search.js';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers (Helmet)
// Configured to permit YouTube embedded player iframes and cross-origin resource requests
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
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // Allow localhost Vite dev server or configured CLIENT_URL
      if (
        origin === CLIENT_URL ||
        origin === 'http://localhost:5173' ||
        origin === 'http://127.0.0.1:5173'
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for local development
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body parser
app.use(express.json());

// 4. Rate Limiting (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please wait a few minutes before trying again.',
  },
});

app.use('/api/', apiLimiter);

// 5. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(
      process.env.YOUTUBE_API_KEY &&
      process.env.YOUTUBE_API_KEY !== 'your_youtube_api_key_here'
    ),
  });
});

// 6. Search Routes
app.use('/api/search', searchRouter);

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
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎵 BeatStream Music API running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}/api/search`);
  console.log(`💓 Health: http://localhost:${PORT}/api/health`);
  if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    console.warn(`⚠️  WARNING: YOUTUBE_API_KEY is not set in server/.env.`);
    console.warn(`   Get one from https://console.cloud.google.com/apis/credentials`);
  } else {
    console.log(`🔑 YouTube API key detected.`);
  }
  console.log(`===============================================`);
});

export default app;
