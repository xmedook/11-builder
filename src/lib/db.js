import Database from 'better-sqlite3';
import path from 'path';

// Allow overriding the database path for platforms like Render using Persistent Disks
// For example: DB_PATH=/data/database.sqlite
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT,
    photo_url TEXT,
    jersey_number INTEGER UNIQUE,
    device_id TEXT
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    opponent TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS attendance (
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    status TEXT NOT NULL, /* 'yes', 'no' */
    PRIMARY KEY (match_id, player_id),
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS lineup (
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    x_pos REAL,
    y_pos REAL,
    status TEXT DEFAULT 'bench', /* 'field', 'bench' */
    PRIMARY KEY (match_id, player_id),
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Agregar jersey_number si no existe (migración segura para DBs existentes)
try {
  db.exec(`ALTER TABLE players ADD COLUMN jersey_number INTEGER UNIQUE`);
} catch (_) { /* columna ya existe */ }

// PIN del coach por defecto: 1234
const existingPin = db.prepare(`SELECT value FROM settings WHERE key = 'coach_pin'`).get();
if (!existingPin) {
  db.prepare(`INSERT INTO settings (key, value) VALUES ('coach_pin', '1234')`).run();
}

export default db;
