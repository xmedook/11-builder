'use client';

import { useState, useRef, useCallback } from 'react';
import { updateLineup } from '../actions';

// ─── Posición por defecto en la cancha (x%, y%) ───────────────────────────
const POSITION_DEFAULTS = {
  PO:  { x: 50, y: 88 },
  DC:  { x: 50, y: 72 }, DC1: { x: 35, y: 72 }, DC2: { x: 65, y: 72 },
  DG:  { x: 12, y: 72 }, DD:  { x: 88, y: 72 },
  DLG: { x: 20, y: 60 }, DLD: { x: 80, y: 60 },
  MDC: { x: 50, y: 55 },
  MC:  { x: 38, y: 45 }, MOC: { x: 62, y: 45 },
  MCO: { x: 50, y: 38 },
  MG:  { x: 18, y: 45 }, MD:  { x: 82, y: 45 },
  EI:  { x: 14, y: 26 }, ED:  { x: 86, y: 26 },
  BU:  { x: 38, y: 18 }, SD:  { x: 62, y: 18 },
  ATT: { x: 50, y: 14 },
};

function getDefaultPos(position) {
  return POSITION_DEFAULTS[position] || { x: 50, y: 50 };
}

// ─── Avatar ────────────────────────────────────────────────────────────────
function PlayerAvatar({ player, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  const label = player.jersey_number ? `#${player.jersey_number}` : (player.first_name?.[0] ?? '?');
  if (player.photo_url && !imgError) {
    return (
      <img
        src={player.photo_url}
        alt={player.first_name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '2px solid rgba(255,255,255,0.8)', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563eb, #1e40af)',
      border: '2px solid rgba(255,255,255,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, color: '#fff', flexShrink: 0, userSelect: 'none'
    }}>
      {label}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function Lineup({ players, nextMatch, isCoach, coachPin }) {
  const pitchRef = useRef(null);
  // dragRef.current = { playerId } while dragging, null otherwise
  const dragRef = useRef(null);
  // lineupRef stays in sync with state to avoid stale closures in event handlers
  const lineupRef = useRef([]);

  if (!nextMatch) return <p style={{ color: 'var(--text-secondary)' }}>Sin partido programado.</p>;

  const lineupData = nextMatch.lineup || [];
  const confirmedPlayers = players.filter(p =>
    nextMatch.attendance?.some(a => a.player_id === p.id && a.status === 'yes')
  ).map(p => {
    const l = lineupData.find(l => l.player_id === p.id);
    const def = getDefaultPos(p.position);
    return { ...p, status: l?.status || 'bench', x_pos: l?.x_pos ?? def.x, y_pos: l?.y_pos ?? def.y };
  });

  const [lineup, _setLineup] = useState(confirmedPlayers);
  lineupRef.current = lineup;

  // Wrapper que mantiene ref y state sincronizados
  function setLineup(updater) {
    _setLineup(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      lineupRef.current = next;
      return next;
    });
  }

  const fieldPlayers = lineup.filter(p => p.status === 'field');
  const benchPlayers = lineup.filter(p => p.status === 'bench');
  const fieldCount = fieldPlayers.length;

  // ─── Persistir ────────────────────────────────────────────────────────
  async function saveLineup(currentLineup) {
    if (!isCoach || !coachPin) return;
    const payload = currentLineup.map(p => ({
      player_id: p.id,
      x_pos: Math.round(p.x_pos * 10) / 10,
      y_pos: Math.round(p.y_pos * 10) / 10,
      status: p.status
    }));
    await updateLineup(nextMatch.id, payload, coachPin);
  }

  // ─── Banca → Cancha ──────────────────────────────────────────────────
  function moveToField(playerId) {
    if (!isCoach) return;
    if (lineupRef.current.filter(p => p.status === 'field').length >= 11) {
      alert('Ya hay 11 jugadores en la cancha. Saca uno primero.');
      return;
    }
    const player = lineupRef.current.find(p => p.id === playerId);
    const def = getDefaultPos(player?.position);
    setLineup(prev => prev.map(p => p.id === playerId ? { ...p, status: 'field', x_pos: def.x, y_pos: def.y } : p));
    setTimeout(() => saveLineup(lineupRef.current), 0);
  }

  // ─── Cancha → Banca ──────────────────────────────────────────────────
  function moveToBench(playerId) {
    if (!isCoach) return;
    setLineup(prev => prev.map(p => p.id === playerId ? { ...p, status: 'bench' } : p));
    setTimeout(() => saveLineup(lineupRef.current), 0);
  }

  // ─── DRAG: inicia en el jugador (pointer capture en el PITCH) ────────
  function onPlayerPointerDown(e, playerId) {
    if (!isCoach) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { playerId };
    // Capturar el puntero en el PITCH para recibir todos los eventos aunque salga del jugador
    try { pitchRef.current?.setPointerCapture(e.pointerId); } catch (_) {}
  }

  // ─── DRAG: movimiento (en el PITCH) ──────────────────────────────────
  function onPitchPointerMove(e) {
    if (!dragRef.current || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left)  / rect.width)  * 100));
    const y = Math.max(4, Math.min(96, ((e.clientY - rect.top)   / rect.height) * 100));
    const { playerId } = dragRef.current;
    setLineup(prev => prev.map(p => p.id === playerId ? { ...p, x_pos: x, y_pos: y } : p));
  }

  // ─── DRAG: fin (en el PITCH) ─────────────────────────────────────────
  function onPitchPointerUp(e) {
    if (!dragRef.current) return;
    dragRef.current = null;
    saveLineup(lineupRef.current);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0 }}>Alineación</h3>
        <span style={{
          background: fieldCount === 11 ? '#16a34a' : fieldCount > 11 ? '#dc2626' : '#2563eb',
          color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700
        }}>
          {fieldCount}/11 en cancha
        </span>
      </div>

      {/* Pitch a ancho completo */}
      <div
          ref={pitchRef}
          onPointerMove={onPitchPointerMove}
          onPointerUp={onPitchPointerUp}
          onPointerCancel={onPitchPointerUp}
          style={{
            background: 'linear-gradient(180deg, #1a6b1a 0%, #1e7a1e 50%, #1a6b1a 100%)',
            position: 'relative', borderRadius: '8px', overflow: 'hidden',
            aspectRatio: '3/4', width: '100%',
            border: '3px solid rgba(255,255,255,0.6)',
            userSelect: 'none', touchAction: 'none', cursor: 'default',
            marginBottom: '16px'
          }}
        >
          {/* SVG líneas */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 150" preserveAspectRatio="none">
            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.5)"/>
            <rect x="20" y="0" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            <rect x="34" y="0" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            <rect x="20" y="130" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            <rect x="34" y="142" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            <circle cx="50" cy="13" r="1" fill="rgba(255,255,255,0.5)"/>
            <circle cx="50" cy="137" r="1" fill="rgba(255,255,255,0.5)"/>
          </svg>

          {/* Jugadores */}
          {fieldPlayers.map(p => (
            <div
              key={p.id}
              onPointerDown={e => onPlayerPointerDown(e, p.id)}
              onDoubleClick={() => moveToBench(p.id)}
              style={{
                position: 'absolute',
                left: `${p.x_pos}%`,
                top: `${p.y_pos}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: isCoach ? 'grab' : 'default',
                zIndex: 10,
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))',
                WebkitUserSelect: 'none', userSelect: 'none',
              }}
              title={isCoach ? 'Arrastra para mover • 2× click → banca' : `${p.first_name} ${p.last_name}`}
            >
              <PlayerAvatar player={p} size={36} />
              <span style={{
                fontSize: '10px', fontWeight: 700, color: '#fff',
                background: 'rgba(0,0,0,0.7)', padding: '2px 5px',
                borderRadius: '4px', marginTop: '3px',
                whiteSpace: 'nowrap', maxWidth: '70px',
                overflow: 'hidden', textOverflow: 'ellipsis',
                pointerEvents: 'none'
              }}>
                {p.first_name}
              </span>
            </div>
          ))}

          {fieldCount === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', padding: '16px', pointerEvents: 'none' }}>
              {isCoach ? 'Toca un jugador de la banca\npara añadirlo' : 'Alineación pendiente'}
            </div>
          )}
        </div>

      {/* ── BANCA — tira horizontal ───────────────────────────────── */}
      <div>
        <h4 style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Banca ({benchPlayers.length})
          {isCoach && fieldCount > 0 && <span style={{ marginLeft: '12px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>💡 Arrastra en cancha · 2× toque → banca</span>}
        </h4>

        {benchPlayers.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {fieldCount >= 11 ? '✅ 11 titulares completos' : 'Vacía — confirma asistencia de jugadores'}
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
            {benchPlayers.map(p => (
              <button
                key={p.id}
                onClick={() => moveToField(p.id)}
                disabled={!isCoach || fieldCount >= 11}
                style={{
                  background: fieldCount >= 11 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '10px', padding: '10px 12px',
                  cursor: isCoach && fieldCount < 11 ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  color: '#fff', flexShrink: 0, minWidth: '72px',
                  opacity: fieldCount >= 11 ? 0.5 : 1,
                  transition: 'background 0.15s, transform 0.1s',
                }}
                onMouseEnter={e => isCoach && fieldCount < 11 && (e.currentTarget.style.background = 'rgba(37,99,235,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = fieldCount >= 11 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)')}
              >
                <PlayerAvatar player={p} size={40} />
                <div style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.first_name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{p.position}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
