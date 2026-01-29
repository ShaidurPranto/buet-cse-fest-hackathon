import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
console.log('PG Import successful');

if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is missing');
} else {
    console.log('DATABASE_URL is present');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
   ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : false
});

try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Connected successfully');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    client.release();
    process.exit(0);
} catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
}
