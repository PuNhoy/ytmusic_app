import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDatabase = process.env.PGDATABASE || 'beatstream_db';
const user = process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD || '';
const host = process.env.PGHOST || 'localhost';
const port = parseInt(process.env.PGPORT || '5432', 10);

async function initDatabase() {
  console.log('🔄 Initializing PostgreSQL database for BeatStream...');

  // Step 1: Connect to default 'postgres' database to ensure target database exists
  const rootClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    console.log(`✅ Connected to PostgreSQL server on ${host}:${port}`);

    // Check if target database already exists
    const checkDb = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );

    if (checkDb.rows.length === 0) {
      console.log(`📦 Database "${targetDatabase}" does not exist. Creating...`);
      await rootClient.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✅ Database "${targetDatabase}" created successfully.`);
    } else {
      console.log(`ℹ️  Database "${targetDatabase}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Error during database creation check:', err.message);
    if (err.code === '28P01') {
      console.error(
        '\n👉 Password authentication failed. Please set your correct PGPASSWORD in server/.env\n'
      );
    }
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect to the target database and execute schema.sql
  const dbClient = new Client({
    host,
    port,
    user,
    password,
    database: targetDatabase,
  });

  try {
    await dbClient.connect();
    console.log(`🔗 Connected to database "${targetDatabase}". Applying schema...`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await dbClient.query(schemaSql);
    console.log('✅ All tables, indexes, and seed records applied successfully!');
    console.log('🎉 PostgreSQL setup for BeatStream is complete and ready to use!');
  } catch (err) {
    console.error('❌ Error executing schema.sql:', err.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

initDatabase();
