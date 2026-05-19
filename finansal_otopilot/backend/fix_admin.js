import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finansal_otopilot',
  port: Number(process.env.DB_PORT) || 3306,
});

async function run() {
  const hash = await bcrypt.hash('123456', 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = 1', [hash]);
  console.log('Password for admin updated to 123456');
  process.exit(0);
}
run();
