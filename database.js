const mysql = require('mysql2');
const fs = require('fs');

// Load configuration from environment variables or config file
const config = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME
};

// If environment variables are not set, try to load from config file
if (!config.DB_HOST) {
  try {
    const configFile = fs.readFileSync('./config.env', 'utf8');
    configFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        config[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.error('Warning: config.env file not found. Using environment variables.');
  }
}

// Create connection pool for better performance
const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Get a promise wrapper for the pool
const promisePool = pool.promise();

// Test database connection
async function testConnection() {
  try {
    const [rows] = await promisePool.query('SELECT 1 as test');
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Get all emails with pagination
async function getEmails(page = 1, limit = 2000) {
  try {
    const offset = (page - 1) * limit;
    const [rows] = await promisePool.query(
      'SELECT * FROM incoming_emails ORDER BY received_time DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    // Get total count
    const [countResult] = await promisePool.query('SELECT COUNT(*) as total FROM incoming_emails');
    const total = countResult[0].total;
    
    return {
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

// Search emails
async function searchEmails(keyword, page = 1, limit = 50) {
  try {
    const offset = (page - 1) * limit;
    const searchTerm = `%${keyword}%`;
    
    const [rows] = await promisePool.query(
      `SELECT * FROM incoming_emails 
       WHERE title LIKE ? OR content LIKE ? OR from_email LIKE ? OR to_email LIKE ?
       ORDER BY received_time DESC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]
    );
    
    // Get total count for search
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM incoming_emails 
       WHERE title LIKE ? OR content LIKE ? OR from_email LIKE ? OR to_email LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    const total = countResult[0].total;
    
    return {
      success: true,
      keyword,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

// Get email statistics
async function getEmailStats() {
  try {
    const [rows] = await promisePool.query(`
      SELECT 
        COUNT(*) as total_emails,
        COUNT(DISTINCT from_email) as unique_senders,
        COUNT(DISTINCT to_email) as unique_recipients,
        DATE(received_time) as date,
        COUNT(*) as daily_count
      FROM incoming_emails 
      GROUP BY DATE(received_time)
      ORDER BY date DESC
      LIMIT 30
    `);
    
    return {
      success: true,
      data: rows
    };
  } catch (error) {
    console.error('Error fetching email stats:', error);
    throw error;
  }
}

// Get database tables
async function getTables() {
  try {
    const [rows] = await promisePool.query('SHOW TABLES');
    return {
      success: true,
      tables: rows.map(row => Object.values(row)[0])
    };
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
}

// Get table structure
async function getTableStructure(tableName) {
  try {
    const [rows] = await promisePool.query('DESCRIBE ??', [tableName]);
    return {
      success: true,
      tableName,
      structure: rows
    };
  } catch (error) {
    console.error('Error fetching table structure:', error);
    throw error;
  }
}

// Close database connection
async function closeConnection() {
  try {
    await promisePool.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

module.exports = {
  testConnection,
  getEmails,
  searchEmails,
  getEmailStats,
  getTables,
  getTableStructure,
  closeConnection,
  pool: promisePool
}; 