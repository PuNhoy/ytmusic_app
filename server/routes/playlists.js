import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();
const DEFAULT_USER_ID = 1;

/**
 * GET /api/playlists
 * List all playlists with track counts
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID;

    const result = await query(
      `SELECT p.id, p.name, p.description, p.created_at AS "createdAt",
              COUNT(pt.id)::int AS "trackCount"
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      playlists: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/playlists
 * Create a new playlist
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.body.userId ? parseInt(req.body.userId, 10) : DEFAULT_USER_ID;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Playlist name is required.',
      });
    }

    const result = await query(
      `INSERT INTO playlists (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_at AS "createdAt"`,
      [userId, name.trim(), (description || '').trim()]
    );

    res.status(201).json({
      message: 'Playlist created',
      playlist: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/playlists/:id
 * Get playlist details and all of its tracks
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID;

    const playlistRes = await query(
      `SELECT id, name, description, created_at AS "createdAt"
       FROM playlists
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (playlistRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Playlist not found.',
      });
    }

    const tracksRes = await query(
      `SELECT video_id AS "videoId", title, channel, thumbnail, duration, duration_seconds AS "durationSeconds", position, added_at AS "addedAt"
       FROM playlist_tracks
       WHERE playlist_id = $1
       ORDER BY position ASC, added_at ASC`,
      [id]
    );

    res.status(200).json({
      ...playlistRes.rows[0],
      tracks: tracksRes.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/playlists/:id/tracks
 * Add a track to a playlist
 */
router.post('/:id/tracks', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { videoId, title, channel, thumbnail, duration, durationSeconds } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'videoId and title are required.',
      });
    }

    // Get max position to append to end of playlist
    const posRes = await query(
      `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM playlist_tracks WHERE playlist_id = $1`,
      [id]
    );
    const nextPos = posRes.rows[0].next_pos;

    const result = await query(
      `INSERT INTO playlist_tracks (playlist_id, video_id, title, channel, thumbnail, duration, duration_seconds, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (playlist_id, video_id) DO NOTHING
       RETURNING video_id AS "videoId", title, channel, thumbnail, duration, position`,
      [
        id,
        videoId,
        title,
        channel || 'Unknown Artist',
        thumbnail || '',
        duration || '0:00',
        durationSeconds || 0,
        nextPos,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message: 'Track is already in this playlist.',
      });
    }

    res.status(201).json({
      message: 'Track added to playlist',
      track: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/playlists/:id/tracks/:videoId
 * Remove a track from a playlist
 */
router.delete('/:id/tracks/:videoId', async (req, res, next) => {
  try {
    const { id, videoId } = req.params;

    const result = await query(
      `DELETE FROM playlist_tracks WHERE playlist_id = $1 AND video_id = $2 RETURNING video_id`,
      [id, videoId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Track not found in playlist',
      });
    }

    res.status(200).json({
      message: 'Track removed from playlist',
      videoId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/playlists/:id
 * Delete a playlist
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : DEFAULT_USER_ID;

    const result = await query(
      `DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Playlist not found',
      });
    }

    res.status(200).json({
      message: 'Playlist deleted',
      id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
