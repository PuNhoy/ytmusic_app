import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();
const DEFAULT_USER_ID = 1; // Default guest user

/**
 * GET /api/favorites
 * Fetch all favorites for the active user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID;

    const result = await query(
      `SELECT video_id AS "videoId", title, channel, thumbnail, duration, duration_seconds AS "durationSeconds", created_at AS "createdAt"
       FROM favorites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      items: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/favorites
 * Add a song to favorites
 */
router.post('/', async (req, res, next) => {
  try {
    const { videoId, title, channel, thumbnail, duration, durationSeconds } = req.body;
    const userId = req.body.userId ? parseInt(req.body.userId, 10) : DEFAULT_USER_ID;

    if (!videoId || !title) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'videoId and title are required fields.',
      });
    }

    const result = await query(
      `INSERT INTO favorites (user_id, video_id, title, channel, thumbnail, duration, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, video_id) DO UPDATE
       SET title = EXCLUDED.title,
           thumbnail = EXCLUDED.thumbnail,
           duration = EXCLUDED.duration
       RETURNING video_id AS "videoId", title, channel, thumbnail, duration, duration_seconds AS "durationSeconds"`,
      [
        userId,
        videoId,
        title,
        channel || 'Unknown Artist',
        thumbnail || '',
        duration || '0:00',
        durationSeconds || 0,
      ]
    );

    res.status(201).json({
      message: 'Added to favorites',
      item: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/favorites/:videoId
 * Remove a specific song from favorites
 */
router.delete('/:videoId', async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID;

    const result = await query(
      `DELETE FROM favorites WHERE user_id = $1 AND video_id = $2 RETURNING video_id AS "videoId"`,
      [userId, videoId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Favorite track not found',
      });
    }

    res.status(200).json({
      message: 'Removed from favorites',
      videoId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/favorites
 * Clear all favorites for user
 */
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID;

    await query(`DELETE FROM favorites WHERE user_id = $1`, [userId]);

    res.status(200).json({
      message: 'All favorites cleared',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
