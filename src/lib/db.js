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
`);

export default db;
