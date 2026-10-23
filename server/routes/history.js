import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();
const DEFAULT_USER_ID = 1;

/**
 * GET /api/history
 * Fetch the latest 10 unique search queries for the user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.id || (req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID);

    // Distinct query on latest searched_at
    const result = await query(
      `SELECT DISTINCT ON (LOWER(query)) query, searched_at
       FROM search_history
       WHERE user_id = $1
       ORDER BY LOWER(query), searched_at DESC
       LIMIT 10`,
      [userId]
    );

    // Re-sort chronologically desc
    const sorted = result.rows
      .sort((a, b) => new Date(b.searched_at) - new Date(a.searched_at))
      .map((row) => row.query);

    res.status(200).json({
      history: sorted,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/history
 * Save a search query to history
 */
router.post('/', async (req, res, next) => {
  try {
    const { query: searchQuery } = req.body;
    const userId = req.user?.id || (req.body.userId ? parseInt(req.body.userId, 10) : DEFAULT_USER_ID);

    if (!searchQuery || !searchQuery.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query is required.',
      });
    }

    const trimmed = searchQuery.trim();

    await query(
      `INSERT INTO search_history (user_id, query) VALUES ($1, $2)`,
      [userId, trimmed]
    );

    res.status(201).json({
      message: 'Recorded search query',
      query: trimmed,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history/:term
 * Delete a specific search query term
 */
router.delete('/:term', async (req, res, next) => {
  try {
    const { term } = req.params;
    const userId = req.user?.id || (req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID);

    await query(
      `DELETE FROM search_history WHERE user_id = $1 AND LOWER(query) = LOWER($2)`,
      [userId, term]
    );

    res.status(200).json({
      message: 'Search query deleted',
      term,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history
 * Clear all search history
 */
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.user?.id || (req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID);

    await query(`DELETE FROM search_history WHERE user_id = $1`, [userId]);

    res.status(200).json({
      message: 'Search history cleared',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
