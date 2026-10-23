import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Determine configuration: connection string or individual environment variables
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL.includes('localhost') ||
        process.env.DATABASE_URL.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'beatstream_db',
      max: 20, // Max clients in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Helper query function
export const query = (text, params) => pool.query(text, params);

/**
 * Checks connection status to PostgreSQL
 * @returns {Promise<{ ok: boolean, error?: string, database?: string }>}
 */
export async function checkDbConnection() {
  try {
    const res = await pool.query('SELECT current_database() as db, NOW() as time');
    return {
      ok: true,
      database: res.rows[0].db,
      timestamp: res.rows[0].time,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    };
  }
}

export default pool;
