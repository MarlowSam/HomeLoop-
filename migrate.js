import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

connection.connect((err) => {
  if (err) {
    console.log('❌ Connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to:', process.env.DB_HOST);
  
  connection.query(`
    ALTER TABLE users 
    ADD COLUMN reset_token VARCHAR(64) NULL,
    ADD COLUMN reset_token_expiry DATETIME NULL
  `, (err) => {
    if (err) {
      console.log('❌ Error:', err.message);
    } else {
      console.log('✅ Columns added successfully to Aiven!');
    }
    connection.end();
    process.exit();
  });
});