import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import pool from '../config/db.js';

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000; // 3 seconds

async function waitForDatabase() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connected');
      return;
    } catch (err) {
      console.log(`Database not ready, retrying... (${MAX_RETRIES - i} attempts left)`);
      if (err.code) console.log(`   Error: ${err.code} - ${err.message}`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
    }
  }
  throw new Error('Could not connect to database after multiple retries');
}

async function tableExists(tableName) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `;

  const { rows } = await pool.query(query, [tableName]);
  return rows[0].exists;
}

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
}

async function createDatabase() {
  const filePath = path.join(__dirname, '../../database/migrations/001_create_tables.sql');
  console.log('Creating database tables...');
  await runSqlFile(filePath);
}

async function populateDatabase() {
  const filePath = path.join(__dirname, '../../database/seeds/seed_data.sql');
  console.log('Populating database with initial data...');
  await runSqlFile(filePath);
}

async function bootstrapDatabase() {
  console.log('Initializing database...');
  await waitForDatabase();

  const exists = await tableExists('trains');

  if (exists) {
    console.log('Database already initialized. Skipping bootstrap.');
    return;
  }

  console.log('First-time setup detected.');
  await createDatabase();
  await populateDatabase();
  console.log('Database setup complete.');
}

export {
  bootstrapDatabase,
  createDatabase,
  populateDatabase
};
