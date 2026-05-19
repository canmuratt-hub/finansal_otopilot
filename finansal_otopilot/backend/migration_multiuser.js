import mysql from 'mysql2/promise';
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
  try {
    console.log('Migrating database for multi-user support...');
    
    // 1. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Add user_id column to existing tables
    const tables = ['transactions', 'ai_insights', 'user_profile', 'subscriptions', 'fixed_expenses', 'goals', 'niko_messages'];
    for (const t of tables) {
      try {
        await pool.query(`ALTER TABLE ${t} ADD COLUMN user_id INT NOT NULL DEFAULT 1`);
        console.log(`Added user_id to ${t}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log(`user_id already exists in ${t}`);
        else console.error(`Error adding user_id to ${t}:`, e.message);
      }
    }
    
    // 3. Optional: Create a dummy admin user so default records belong to someone valid
    // We won't strictly enforce foreign key immediately to prevent crashes with existing data, 
    // but we can insert an admin just in case.
    try {
      await pool.query(`INSERT INTO users (id, name, email, password_hash) VALUES (1, 'Murat Can', 'admin@finansal.com', 'admin_placeholder')`);
      console.log('Created placeholder user (id=1)');
    } catch(e) {
      if(e.code === 'ER_DUP_ENTRY') console.log('Placeholder user already exists');
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
