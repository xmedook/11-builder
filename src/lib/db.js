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
    time TEXT,
    location TEXT,
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

// Migración segura: agregar columnas nuevas a matches si no existen
try { db.exec(`ALTER TABLE matches ADD COLUMN time TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE matches ADD COLUMN location TEXT`); } catch (_) {}

// Migración segura: agregar jersey_number si no existe
// NOTA: SQLite no permite UNIQUE en ALTER TABLE ADD COLUMN
// Se crea la columna sin constraint y luego el índice por separado
try {
  db.exec(`ALTER TABLE players ADD COLUMN jersey_number INTEGER`);
} catch (_) { /* columna ya existe — ignorar */ }

// Índice único (permite múltiples NULL, solo restringe valores reales)
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_players_jersey
  ON players(jersey_number)
  WHERE jersey_number IS NOT NULL
`);

// PIN del coach por defecto: 1234
const existingPin = db.prepare(`SELECT value FROM settings WHERE key = 'coach_pin'`).get();
if (!existingPin) {
  db.prepare(`INSERT INTO settings (key, value) VALUES ('coach_pin', '1234')`).run();
}

export default db;

// ─── Seed inicial de jugadores ────────────────────────────────────────────
// Solo corre si la tabla está completamente vacía (primer deploy)
const playerCount = db.prepare('SELECT COUNT(*) as c FROM players').get();
if (playerCount.c === 0) {
  const seedPlayers = [
    { first_name: 'Erik',   last_name: 'Ramírez', position: 'MC',  jersey_number: 1  },
    { first_name: 'Marte',  last_name: '',         position: 'DC',  jersey_number: 2  },
    { first_name: 'Jufrad', last_name: '',         position: 'MC',  jersey_number: 3  },
    { first_name: 'JP',     last_name: '',         position: 'MC',  jersey_number: 4  },
    { first_name: 'Alex',   last_name: '',         position: 'EI',  jersey_number: 5  },
    { first_name: 'Andrés', last_name: 'B',        position: 'DC',  jersey_number: 6  },
    { first_name: 'Jesús',  last_name: 'MC',       position: 'MCO', jersey_number: 7  },
    { first_name: 'Pichi',  last_name: '',         position: 'SD',  jersey_number: 8  },
    { first_name: 'Kareem', last_name: '',         position: 'ED',  jersey_number: 9  },
    { first_name: 'Aldo',   last_name: 'R.',       position: 'ATT', jersey_number: 10 },
    { first_name: 'Laurent',last_name: '',         position: 'DD',  jersey_number: 11 },
    { first_name: 'Warren', last_name: '',         position: 'DG',  jersey_number: 12 },
  ];

  const insertPlayer = db.prepare(
    `INSERT INTO players (first_name, last_name, position, jersey_number) VALUES (?, ?, ?, ?)`
  );
  const seedTx = db.transaction((players) => {
    for (const p of players) {
      insertPlayer.run(p.first_name, p.last_name, p.position, p.jersey_number);
    }
  });
  seedTx(seedPlayers);
}
