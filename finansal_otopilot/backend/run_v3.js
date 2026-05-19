import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finansal_otopilot',
  port: Number(process.env.DB_PORT) || 3306,
  multipleStatements: true
});

async function run() {
  try {
    const v3 = fs.readFileSync('migration_v3.sql', 'utf8');
    // Using multiple statements is dangerous if not enabled, let's just create them one by one or enable it.
    // Actually mysql2 pool with `multipleStatements: true` isn't supported like this directly in pool config sometimes, but it works in `createConnection`.
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'finansal_otopilot',
      port: Number(process.env.DB_PORT) || 3306,
      multipleStatements: true
    });
    console.log('Running v3...');
    await conn.query(v3);
    console.log('v3 ok, re-running multiuser migrations...');
    const tables = ['subscriptions', 'fixed_expenses', 'goals', 'niko_messages'];
    for (const t of tables) {
      try {
        await conn.query(`ALTER TABLE ${t} ADD COLUMN user_id INT NOT NULL DEFAULT 1`);
        console.log(`Added user_id to ${t}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log(`user_id already exists in ${t}`);
        else console.error(`Error adding user_id to ${t}:`, e.message);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
