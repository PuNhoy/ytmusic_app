import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'beatstream_super_secret_jwt_key_2026';

/**
 * POST /api/auth/signup
 * Register a new user account
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Username is required.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'Validation Error', message: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 6 characters long.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query(
      `SELECT id, username, email FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2`,
      [cleanUsername, cleanEmail]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.username.toLowerCase() === cleanUsername) {
        return res.status(409).json({ error: 'Conflict', message: 'This username is already taken. Please choose another.' });
      }
      return res.status(409).json({ error: 'Conflict', message: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertRes = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at AS "createdAt"`,
      [cleanUsername, cleanEmail, passwordHash]
    );

    const newUser = insertRes.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Log in with username or email and password
 */
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email or username is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Password is required.' });
    }

    const cleanId = identifier.trim().toLowerCase();

    // Query user by username or email
    const userRes = await query(
      `SELECT id, username, email, password_hash
       FROM users
       WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
      [cleanId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No account found with this username or email.' });
    }

    const user = userRes.rows[0];

    // Check if password hash exists (e.g. for seeded guest user)
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Unauthorized', message: 'This account cannot be signed into with a password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Incorrect password. Please try again.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userRes = await query(
      `SELECT id, username, email, created_at AS "createdAt" FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    res.status(200).json({
      user: userRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
