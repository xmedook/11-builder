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

// ─── Avatar de jugador ─────────────────────────────────────────────────────
function PlayerAvatar({ player, size = 40 }) {
  const [imgError, setImgError] = useState(false);
  const label = player.jersey_number ? `#${player.jersey_number}` : player.first_name[0];

  if (player.photo_url && !imgError) {
    return (
      <img
        src={player.photo_url}
        alt={player.first_name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', display: 'block',
          border: '2px solid rgba(255,255,255,0.8)',
          flexShrink: 0
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563eb, #1e40af)',
      border: '2px solid rgba(255,255,255,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, color: '#fff', flexShrink: 0
    }}>
      {label}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function Lineup({ players, nextMatch, isCoach, coachPin }) {
  const pitchRef = useRef(null);
  const dragRef = useRef(null); // { playerId, startX%, startY% }

  if (!nextMatch) return <p style={{ color: 'var(--text-secondary)' }}>Sin partido programado.</p>;

  const lineupData = nextMatch.lineup || [];
  const confirmedPlayers = players.filter(p =>
    nextMatch.attendance?.some(a => a.player_id === p.id && a.status === 'yes')
  ).map(p => {
    const l = lineupData.find(l => l.player_id === p.id);
    const def = getDefaultPos(p.position);
    return {
      ...p,
      status: l?.status || 'bench',
      x_pos: l?.x_pos ?? def.x,
      y_pos: l?.y_pos ?? def.y,
    };
  });

  const [lineup, setLineup] = useState(confirmedPlayers);

  const fieldPlayers = lineup.filter(p => p.status === 'field');
  const benchPlayers = lineup.filter(p => p.status === 'bench');
  const fieldCount = fieldPlayers.length;

  // ─── Persistir al servidor ───────────────────────────────────────────────
  const saveLineup = useCallback(async (newLineup) => {
    if (!isCoach || !coachPin) return;
    const payload = newLineup.map(p => ({
      player_id: p.id,
      x_pos: Math.round(p.x_pos * 10) / 10,
      y_pos: Math.round(p.y_pos * 10) / 10,
      status: p.status
    }));
    await updateLineup(nextMatch.id, payload, coachPin);
  }, [isCoach, coachPin, nextMatch.id]);

  // ─── Banca → Cancha ─────────────────────────────────────────────────────
  function moveToField(playerId) {
    if (!isCoach) return;
    if (fieldCount >= 11) {
      alert('Ya hay 11 jugadores en la cancha. Saca uno primero.');
      return;
    }
    const def = getDefaultPos(lineup.find(p => p.id === playerId)?.position);
    const updated = lineup.map(p =>
      p.id === playerId ? { ...p, status: 'field', x_pos: def.x, y_pos: def.y } : p
    );
    setLineup(updated);
    saveLineup(updated);
  }

  // ─── Cancha → Banca ─────────────────────────────────────────────────────
  function moveToBench(playerId) {
    if (!isCoach) return;
    const updated = lineup.map(p =>
      p.id === playerId ? { ...p, status: 'bench' } : p
    );
    setLineup(updated);
    saveLineup(updated);
  }

  // ─── Drag en la cancha (pointer events — funciona en iOS) ────────────────
  function onPointerDown(e, playerId) {
    if (!isCoach) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { playerId };
  }

  function onPointerMove(e, playerId) {
    if (!isCoach || !dragRef.current || dragRef.current.playerId !== playerId) return;
    const pitch = pitchRef.current;
    if (!pitch) return;
    const rect = pitch.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100));
    setLineup(prev =>
      prev.map(p => p.id === playerId ? { ...p, x_pos: x, y_pos: y } : p)
    );
  }

  function onPointerUp(e, playerId) {
    if (!dragRef.current) return;
    dragRef.current = null;
    saveLineup(lineup);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0 }}>Alineación</h3>
        <span style={{
          background: fieldCount === 11 ? '#16a34a' : fieldCount > 11 ? '#dc2626' : '#2563eb',
          color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700
        }}>
          {fieldCount}/11 en cancha
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px' }}>

        {/* ── PITCH ─────────────────────────────────────────────────── */}
        <div
          ref={pitchRef}
          className="pitch-container"
          style={{
            background: 'linear-gradient(180deg, #1a6b1a 0%, #1e7a1e 50%, #1a6b1a 100%)',
            position: 'relative', borderRadius: '8px', overflow: 'hidden',
            aspectRatio: '2/3', width: '100%',
            border: '3px solid rgba(255,255,255,0.6)',
            userSelect: 'none', touchAction: 'none'
          }}
        >
          {/* Líneas de la cancha */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 150" preserveAspectRatio="none">
            {/* Línea del medio */}
            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            {/* Círculo central */}
            <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            {/* Punto central */}
            <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.5)"/>
            {/* Área grande superior */}
            <rect x="20" y="0" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            {/* Área chica superior */}
            <rect x="34" y="0" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            {/* Área grande inferior */}
            <rect x="20" y="130" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            {/* Área chica inferior */}
            <rect x="34" y="142" width="32" height="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
            {/* Punto penal superior */}
            <circle cx="50" cy="13" r="1" fill="rgba(255,255,255,0.5)"/>
            {/* Punto penal inferior */}
            <circle cx="50" cy="137" r="1" fill="rgba(255,255,255,0.5)"/>
          </svg>

          {/* Jugadores en cancha */}
          {fieldPlayers.map(p => (
            <div
              key={p.id}
              onPointerDown={e => onPointerDown(e, p.id)}
              onPointerMove={e => onPointerMove(e, p.id)}
              onPointerUp={e => onPointerUp(e, p.id)}
              onDoubleClick={() => moveToBench(p.id)}
              style={{
                position: 'absolute',
                left: `${p.x_pos}%`,
                top: `${p.y_pos}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: isCoach ? 'grab' : 'default',
                zIndex: 10,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
              }}
              title={isCoach ? 'Arrastra para mover • Doble click para sacar' : `${p.first_name} ${p.last_name}`}
            >
              <PlayerAvatar player={p} size={36} />
              <span style={{
                fontSize: '10px', fontWeight: 700, color: '#fff',
                background: 'rgba(0,0,0,0.65)', padding: '1px 5px',
                borderRadius: '4px', marginTop: '3px', whiteSpace: 'nowrap',
                maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {p.first_name}
              </span>
            </div>
          ))}

          {/* Hint si cancha vacía */}
          {fieldCount === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', fontSize: '14px', textAlign: 'center', padding: '16px'
            }}>
              {isCoach ? 'Toca un jugador de la banca para añadirlo' : 'Alineación pendiente'}
            </div>
          )}
        </div>

        {/* ── BANCA ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Banca ({benchPlayers.length})
          </h4>

          {benchPlayers.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {fieldCount >= 11 ? '✅ 11 titulares completos' : 'Nadie en la banca'}
            </p>
          )}

          {benchPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => moveToField(p.id)}
              disabled={!isCoach}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--surface-border)',
                borderRadius: '8px', padding: '8px 10px',
                cursor: isCoach ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background 0.15s',
                textAlign: 'left', color: '#fff', width: '100%'
              }}
              onMouseEnter={e => isCoach && (e.currentTarget.style.background = 'rgba(37,99,235,0.2)')}
              onMouseLeave={e => isCoach && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <PlayerAvatar player={p} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.first_name} {p.last_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.position}</div>
              </div>
              {isCoach && fieldCount < 11 && <span style={{ fontSize: '14px', opacity: 0.6 }}>→</span>}
              {isCoach && fieldCount >= 11 && <span style={{ fontSize: '12px', opacity: 0.4 }}>🔒</span>}
            </button>
          ))}

          {isCoach && fieldCount > 0 && (
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
              💡 Arrastra en la cancha para reposicionar.<br/>Doble click para enviar a banca.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
