const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// --- PRODUCTOS (STOCK) ---
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', (req, res) => {
  const { type, name, category, unit, stock, cost, price } = req.body;
  const sql = 'INSERT INTO products (type, name, category, unit, stock, cost, price) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [type, name, category, unit, stock, cost, price], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, type, name, category, unit, stock, cost, price });
  });
});

app.put('/api/products/:id', (req, res) => {
  const { type, name, category, unit, stock, cost, price } = req.body;
  const sql = 'UPDATE products SET type=?, name=?, category=?, unit=?, stock=?, cost=?, price=? WHERE id=?';
  db.run(sql, [type, name, category, unit, stock, cost, price, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- VENTAS ---
app.get('/api/sales', (req, res) => {
  db.all('SELECT * FROM sales ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => ({ ...r, items: JSON.parse(r.items_json) }));
    res.json(formatted);
  });
});

app.post('/api/sales', (req, res) => {
  const { customer, total, method, items } = req.body;
  const date = new Date().toISOString();
  const itemsJson = JSON.stringify(items);

  db.serialize(() => {
    items.forEach(item => {
      db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.qty, item.id]);
    });

    const sql = 'INSERT INTO sales (date, customer, total, method, items_json) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [date, customer, total, method, itemsJson], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, date, customer, total, method, items });
    });
  });
});

// --- GASTOS ---
app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/expenses', (req, res) => {
  const { category, description, amount, supplier, is_stock_item, method } = req.body;
  const date = new Date().toISOString();
  const sql = 'INSERT INTO expenses (date, category, description, amount, supplier, is_stock_item, method) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [date, category, description, amount, supplier, is_stock_item ? 1 : 0, method], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, date, category, description, amount, supplier, is_stock_item, method });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de Energía + corriendo en http://localhost:${PORT}`);
});