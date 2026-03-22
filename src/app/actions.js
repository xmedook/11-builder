'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── AUTH ──────────────────────────────────────────────────────────────────

/**
 * Verifica el PIN del coach contra la DB.
 * @returns {{ ok: boolean }}
 */
export async function verifyCoachPin(pin) {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'coach_pin'`).get();
  return { ok: row?.value === String(pin) };
}

/**
 * Verifica que el número de dorsal corresponda al jugador.
 * @returns {{ ok: boolean, player: object|null }}
 */
export async function verifyPlayerDorsal(playerId, jerseyNumber) {
  const player = db.prepare(
    `SELECT * FROM players WHERE id = ? AND jersey_number = ?`
  ).get(playerId, jerseyNumber);
  return { ok: !!player, player: player || null };
}

/**
 * Cambia el PIN del coach (requiere PIN actual para confirmar).
 */
export async function updateCoachPin(currentPin, newPin) {
  const { ok } = await verifyCoachPin(currentPin);
  if (!ok) throw new Error('PIN actual incorrecto');
  if (!newPin || String(newPin).length !== 4 || isNaN(newPin))
    throw new Error('El nuevo PIN debe ser 4 dígitos numéricos');
  db.prepare(`UPDATE settings SET value = ? WHERE key = 'coach_pin'`).run(String(newPin));
  return { ok: true };
}

// ─── PLAYERS ───────────────────────────────────────────────────────────────

export async function getPlayers() {
  return db.prepare('SELECT * FROM players ORDER BY jersey_number ASC, first_name ASC').all();
}

export async function addPlayer(formData, pin) {
  const { ok } = await verifyCoachPin(pin);
  if (!ok) throw new Error('No autorizado');

  const firstName    = formData.get('first_name');
  const lastName     = formData.get('last_name');
  const position     = formData.get('position') || '';
  const jerseyNumber = formData.get('jersey_number') ? parseInt(formData.get('jersey_number'), 10) : null;

  db.prepare(
    `INSERT INTO players (first_name, last_name, position, jersey_number) VALUES (?, ?, ?, ?)`
  ).run(firstName, lastName, position, jerseyNumber);
  revalidatePath('/');
}

export async function updatePlayer(playerId, formData, pin) {
  const { ok } = await verifyCoachPin(pin);
  if (!ok) throw new Error('No autorizado');

  const firstName    = formData.get('first_name');
  const lastName     = formData.get('last_name');
  const position     = formData.get('position') || '';
  const jerseyNumber = formData.get('jersey_number') ? parseInt(formData.get('jersey_number'), 10) : null;

  db.prepare(
    `UPDATE players SET first_name = ?, last_name = ?, position = ?, jersey_number = ? WHERE id = ?`
  ).run(firstName, lastName, position, jerseyNumber, playerId);
  revalidatePath('/');
}

export async function updatePlayerProfile(playerId, formData) {
  // Jugadores pueden editar solo su nombre (no requiere PIN)
  const firstName = formData.get('first_name');
  const lastName  = formData.get('last_name');
  db.prepare(`UPDATE players SET first_name = ?, last_name = ? WHERE id = ?`)
    .run(firstName, lastName, playerId);
  revalidatePath('/');
}

export async function deletePlayer(playerId, pin) {
  const { ok } = await verifyCoachPin(pin);
  if (!ok) throw new Error('No autorizado');
  db.prepare('DELETE FROM players WHERE id = ?').run(playerId);
  revalidatePath('/');
}

export async function resetPlayerDorsal(playerId, pin) {
  // Permite al coach quitar el dorsal (el jugador pierde su "acceso")
  const { ok } = await verifyCoachPin(pin);
  if (!ok) throw new Error('No autorizado');
  db.prepare(`UPDATE players SET jersey_number = NULL WHERE id = ?`).run(playerId);
  revalidatePath('/');
}

// ─── MATCH & LINEUP ────────────────────────────────────────────────────────

export async function getNextMatch() {
  const match = db.prepare('SELECT * FROM matches WHERE is_active = 1 LIMIT 1').get();
  if (!match) return null;

  const attendance = db.prepare('SELECT * FROM attendance WHERE match_id = ?').all(match.id);
  const lineup     = db.prepare('SELECT * FROM lineup WHERE match_id = ?').all(match.id);
  return { ...match, attendance, lineup };
}

export async function createOrUpdateMatch(formData, pin) {
  const { ok } = await verifyCoachPin(pin);
  if (!ok) throw new Error('No autorizado');

  const date     = formData.get('date');
  const opponent = formData.get('opponent');

  const existing = db.prepare('SELECT id FROM matches WHERE is_active = 1 LIMIT 1').get();
  if (existing) {
    db.prepare('UPDATE matches SET date = ?, opponent = ? WHERE id = ?')
      .run(date, opponent, existing.id);
  } else {
    db.prepare('INSERT INTO matches (date, opponent) VALUES (?, ?)').run(date, opponent);
  }
  revalidatePath('/');
}

export async function submitRSVP(matchId, playerId, status) {
  // Cualquier jugador puede hacer RSVP (verificado por playerId)
  db.prepare(
    `INSERT INTO attendance (match_id, player_id, status)
     VALUES (?, ?, ?)
     ON CONFLICT(match_id, player_id) DO UPDATE SET status = excluded.status`
  ).run(matchId, playerId, status);
  revalidatePath('/');
}

export async function updateLineup(matchId, lineupData, pin) {
  const { ok } = await verifyCoachPin(pin);
  if (!ok) throw new Error('No autorizado');

  const insert = db.prepare(
    `INSERT INTO lineup (match_id, player_id, x_pos, y_pos, status)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(match_id, player_id)
     DO UPDATE SET x_pos = excluded.x_pos, y_pos = excluded.y_pos, status = excluded.status`
  );
  const transaction = db.transaction((items) => {
    for (const item of items) {
      insert.run(matchId, item.player_id, item.x_pos, item.y_pos, item.status);
    }
  });
  transaction(lineupData);
  revalidatePath('/');
}
