import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
   ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : false
});

async function resetDatabase() {
    let client;
    try {
        console.log('Connecting to database...');
        client = await pool.connect();
        console.log('Connected.');

        // Get all table names in public schema
        const res = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `);

        const tables = res.rows.map(row => row.tablename);

        if (tables.length === 0) {
            console.log('No tables found to delete.');
        } else {
            console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
            
            for (const table of tables) {
                console.log(`Dropping table: ${table}...`);
                // Using CASCADE to handle foreign key constraints
                await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
            }
            console.log('All tables dropped successfully.');
        }

    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

resetDatabase();
