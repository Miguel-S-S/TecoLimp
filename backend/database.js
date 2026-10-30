const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'energia_pos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado con éxito a la base de datos SQLite.');
  }
});

db.serialize(() => {
  // Tabla de Productos / Stock
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      stock REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      price REAL DEFAULT 0
    )
  `);

  // Tabla de Ventas
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      customer TEXT DEFAULT 'Cliente Anónimo',
      total REAL NOT NULL,
      method TEXT NOT NULL,
      items_json TEXT NOT NULL
    )
  `);

  // Tabla de Gastos
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      supplier TEXT,
      is_stock_item INTEGER DEFAULT 0,
      method TEXT NOT NULL
    )
  `);
});

module.exports = db;