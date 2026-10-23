import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'beatstream_super_secret_jwt_key_2026';

/**
 * Middleware that authenticates JWT tokens.
 * If a valid token is provided in the Authorization header, it sets `req.user`.
 * If no token is provided, it falls back to the default guest user (id: 1).
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = { id: 1, username: 'guest' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // If token expired or invalid, default to guest
    req.user = { id: 1, username: 'guest' };
    next();
  }
}

/**
 * Strict authentication middleware: requires a valid JWT token.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}
