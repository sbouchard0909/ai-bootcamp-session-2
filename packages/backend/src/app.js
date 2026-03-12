const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];
const seedStmt = db.prepare('INSERT INTO items (name, position) VALUES (?, ?)');

initialItems.forEach((item, index) => {
  seedStmt.run(item, index + 1);
});

console.log('In-memory database initialized with sample data');

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY position ASC').all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name, description, due_date } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const maxPositionRow = db.prepare('SELECT COALESCE(MAX(position), 0) AS max_pos FROM items').get();
    const nextPosition = maxPositionRow.max_pos + 1;

    const insertStmt = db.prepare('INSERT INTO items (name, description, due_date, position) VALUES (?, ?, ?, ?)');
    const result = insertStmt.run(name.trim(), description || null, due_date || null, nextPosition);
    const id = result.lastInsertRowid;

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, due_date } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Item name must be a non-empty string' });
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ error: 'description must be a string or null' });
    }

    if (due_date !== undefined && due_date !== null && typeof due_date !== 'string') {
      return res.status(400).json({ error: 'due_date must be a string or null' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updatedName = name !== undefined ? name.trim() : existingItem.name;
    const updatedDescription = description !== undefined ? (description || null) : existingItem.description;
    const updatedDueDate = due_date !== undefined ? (due_date || null) : existingItem.due_date;

    db.prepare('UPDATE items SET name = ?, description = ?, due_date = ? WHERE id = ?')
      .run(updatedName, updatedDescription, updatedDueDate, id);

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.patch('/api/items/:id/position', (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    if (direction !== 'up' && direction !== 'down') {
      return res.status(400).json({ error: 'direction must be "up" or "down"' });
    }

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const neighbor = direction === 'up'
      ? db.prepare('SELECT * FROM items WHERE position < ? ORDER BY position DESC LIMIT 1').get(item.position)
      : db.prepare('SELECT * FROM items WHERE position > ? ORDER BY position ASC LIMIT 1').get(item.position);

    if (!neighbor) {
      return res.status(400).json({ error: `Item is already at the ${direction === 'up' ? 'top' : 'bottom'}` });
    }

    const swap = db.transaction(() => {
      db.prepare('UPDATE items SET position = ? WHERE id = ?').run(neighbor.position, item.id);
      db.prepare('UPDATE items SET position = ? WHERE id = ?').run(item.position, neighbor.id);
    });
    swap();

    const items = db.prepare('SELECT * FROM items ORDER BY position ASC').all();
    res.json(items);
  } catch (error) {
    console.error('Error reordering item:', error);
    res.status(500).json({ error: 'Failed to reorder item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db };