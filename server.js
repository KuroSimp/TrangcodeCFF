const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Test database connection on startup
db.testConnection().then(success => {
  if (success) {
    console.log('✅ Database connection test successful on startup');
  } else {
    console.log('❌ Database connection test failed on startup');
  }
}).catch(err => {
  console.error('❌ Database connection error on startup:', err);
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const success = await db.testConnection();
    if (success) {
      res.json({ message: 'Database connection successful!', status: 'connected' });
    } else {
      res.status(500).json({ error: 'Database connection failed' });
    }
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Get all emails from incoming_emails table
app.get('/api/emails', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await db.getEmails(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails', details: error.message });
  }
});

// Get email statistics
app.get('/api/emails/stats', async (req, res) => {
  try {
    const result = await db.getEmailStats();
    res.json(result);
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Failed to fetch email statistics', details: error.message });
  }
});

// Search emails by keyword
app.get('/api/emails/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }
    
    const result = await db.searchEmails(keyword, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails', details: error.message });
  }
});

// Get database tables info
app.get('/api/tables', async (req, res) => {
  try {
    const result = await db.getTables();
    res.json(result);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables', details: error.message });
  }
});

// Get table structure
app.get('/api/tables/:tableName/structure', async (req, res) => {
  try {
    const { tableName } = req.params;
    const result = await db.getTableStructure(tableName);
    res.json(result);
  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ error: 'Failed to fetch table structure', details: error.message });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: 62.146.236.71:3306/cff`);
  console.log(`👤 User: cff`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await db.closeConnection();
    console.log('✅ Server shutdown complete.');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
}); 