import { Router } from 'express';
import NodeCache from 'node-cache';
import { searchMusic } from '../services/youtube.js';

const router = Router();

// In-memory cache with 10-minute TTL (600 seconds) and cleanup check every 2 minutes
const searchCache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // 2 minutes
  maxKeys: 500, // Prevent unbounded memory growth
});

/**
 * Sanitizes search input by removing control characters, trimming,
 * and capping length.
 * @param {string} input
 * @returns {string}
 */
function sanitizeQuery(input) {
  if (typeof input !== 'string') return '';
  // Remove ASCII control characters and trim excess whitespace
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Sanitizes page token (should be base64url-like or alphanumeric string).
 * @param {string} token
 * @returns {string|null}
 */
function sanitizePageToken(token) {
  if (!token || typeof token !== 'string') return null;
  const cleaned = token.trim();
  // Valid YouTube page tokens are alphanumeric with underscores, hyphens, and equals
  if (/^[A-Za-z0-9_\-=]+$/.test(cleaned) && cleaned.length <= 100) {
    return cleaned;
  }
  return null;
}

/**
 * GET /api/search?q=...&pageToken=...
 * Query YouTube for music videos with caching and input validation.
 */
router.get('/', async (req, res, next) => {
  try {
    const rawQuery = req.query.q;
    const rawPageToken = req.query.pageToken;

    // 1. Validate 'q' parameter presence
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: "The search query parameter 'q' is required and cannot be empty.",
      });
    }

    // 2. Sanitize query
    const query = sanitizeQuery(rawQuery);

    if (query.length < 1) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query must contain at least one valid character.',
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query is too long (maximum 100 characters allowed).',
      });
    }

    // 3. Sanitize pageToken
    const pageToken = sanitizePageToken(rawPageToken);

    // 4. In-memory cache lookup
    const cacheKey = `search:${query.toLowerCase()}:${pageToken || 'first'}`;
    const cachedData = searchCache.get(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedData);
    }

    // 5. Query YouTube Service
    const results = await searchMusic({ query, pageToken });

    // 6. Cache the response (10 minutes)
    searchCache.set(cacheKey, results);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
