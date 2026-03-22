'use server';

import db from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

// --- PLAYERS ---

export async function getPlayers() {
  const stmt = db.prepare('SELECT * FROM players ORDER BY first_name ASC');
  return stmt.all();
}

export async function addPlayer(formData, isCoachToken) {
  if (!isCoachToken) throw new Error("Unauthorized");
  const firstName = formData.get('first_name');
  const lastName = formData.get('last_name');
  const position = formData.get('position') || '';

  const stmt = db.prepare('INSERT INTO players (first_name, last_name, position) VALUES (?, ?, ?)');
  stmt.run(firstName, lastName, position);
  revalidatePath('/');
}

export async function updatePlayerProfile(playerId, formData) {
  const firstName = formData.get('first_name');
  const lastName = formData.get('last_name');
  // Photo URL could be handled here if it's a file upload, or just a URL string for MVP.
  
  const stmt = db.prepare('UPDATE players SET first_name = ?, last_name = ? WHERE id = ?');
  stmt.run(firstName, lastName, playerId);
  revalidatePath('/');
}

export async function deletePlayer(playerId, isCoachToken) {
  if (!isCoachToken) throw new Error("Unauthorized");
  db.prepare('DELETE FROM players WHERE id = ?').run(playerId);
  revalidatePath('/');
}

export async function claimPlayer(playerId) {
  const deviceId = randomUUID();
  // Assign this device_id to the player
  const stmt = db.prepare('UPDATE players SET device_id = ? WHERE id = ? AND device_id IS NULL');
  const result = stmt.run(deviceId, playerId);
  
  if (result.changes === 0) {
    throw new Error('Profile already claimed or does not exist');
  }

  // Set the cookie for 1 year
  const cookieStore = await cookies();
  cookieStore.set('player_device_id', deviceId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true });
  revalidatePath('/');
}

export async function unlinkPlayer(playerId, isCoachToken) {
  if (!isCoachToken) throw new Error("Unauthorized");
  const stmt = db.prepare('UPDATE players SET device_id = NULL WHERE id = ?');
  stmt.run(playerId);
  revalidatePath('/');
}

export async function getCurrentPlayer() {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get('player_device_id')?.value;
  if (!deviceId) return null;
  const stmt = db.prepare('SELECT * FROM players WHERE device_id = ?');
  return stmt.get(deviceId) || null;
}

// --- MATCH & LINEUP ---

export async function getNextMatch() {
  // We'll just assume the only active match is the next one for MVP
  let match = db.prepare('SELECT * FROM matches WHERE is_active = 1 LIMIT 1').get();
  
  if (!match) {
    // Return a dummy empty object or null
    return null;
  }

  const attendance = db.prepare('SELECT * FROM attendance WHERE match_id = ?').all(match.id);
  const lineup = db.prepare('SELECT * FROM lineup WHERE match_id = ?').all(match.id);
  
  return { ...match, attendance, lineup };
}

export async function createOrUpdateMatch(formData, isCoachToken) {
  if (!isCoachToken) throw new Error("Unauthorized");
  const date = formData.get('date');
  const opponent = formData.get('opponent');
  
  const existing = db.prepare('SELECT * FROM matches WHERE is_active = 1').get();
  
  if (existing) {
    db.prepare('UPDATE matches SET date = ?, opponent = ? WHERE id = ?').run(date, opponent, existing.id);
  } else {
    db.prepare('INSERT INTO matches (date, opponent, is_active) VALUES (?, ?, 1)').run(date, opponent);
  }
  revalidatePath('/');
}

export async function submitRSVP(matchId, playerId, status) {
  // status: 'yes', 'no'
  const stmt = db.prepare(`
    INSERT INTO attendance (match_id, player_id, status)
    VALUES (?, ?, ?)
    ON CONFLICT(match_id, player_id) DO UPDATE SET status = ?
  `);
  stmt.run(matchId, playerId, status, status);

  // If yes, we can implicitly add to lineup as 'bench'
  if (status === 'yes') {
    db.prepare(`
      INSERT OR IGNORE INTO lineup (match_id, player_id, status)
      VALUES (?, ?, 'bench')
    `).run(matchId, playerId);
  }
  
  revalidatePath('/');
}

export async function updateLineup(matchId, lineupPositions, isCoachToken) {
  if (!isCoachToken) throw new Error("Unauthorized");
  
  // lineupPositions: array of { player_id, x_pos, y_pos, status }
  const stmt = db.prepare(`
    INSERT INTO lineup (match_id, player_id, x_pos, y_pos, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(match_id, player_id) DO UPDATE SET
      x_pos = excluded.x_pos,
      y_pos = excluded.y_pos,
      status = excluded.status
  `);
  
  const tx = db.transaction((positions) => {
    for (const pos of positions) {
      stmt.run(matchId, pos.player_id, pos.x_pos, pos.y_pos, pos.status);
    }
  });
  
  tx(lineupPositions);
  revalidatePath('/');
}
