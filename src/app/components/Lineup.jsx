'use client';

import { useState } from 'react';
import { updateLineup } from '../actions';

export default function Lineup({ players, nextMatch, isCoach, coachPin }) {
  if (!nextMatch) return <p>No hay partido programado para ver la alineación.</p>;

  // Merge player data with lineup data
  const lineupData = nextMatch.lineup || [];
  const activePlayers = players.filter(p => 
    nextMatch.attendance?.some(a => a.player_id === p.id && a.status === 'yes')
  ).map(p => {
    const l = lineupData.find(l => l.player_id === p.id) || { status: 'bench', x_pos: 10, y_pos: 10 };
    return { ...p, ...l };
  });

  const [localLineup, setLocalLineup] = useState(activePlayers);

  // Filter into field and bench
  const fieldPlayers = localLineup.filter(p => p.status === 'field');
  const benchPlayers = localLineup.filter(p => p.status === 'bench');

  async function moveToField(playerId) {
    if (!isCoach) return;
    const updated = localLineup.map(p => p.id === playerId ? { ...p, status: 'field', x_pos: 50, y_pos: 50 } : p);
    setLocalLineup(updated);
    
    // Save to server
    const payload = updated.map(p => ({ player_id: p.id, x_pos: p.x_pos || 0, y_pos: p.y_pos || 0, status: p.status }));
    await updateLineup(nextMatch.id, payload, coachPin);
  }

  async function moveToBench(playerId) {
    if (!isCoach) return;
    const updated = localLineup.map(p => p.id === playerId ? { ...p, status: 'bench' } : p);
    setLocalLineup(updated);
    
    const payload = updated.map(p => ({ player_id: p.id, x_pos: p.x_pos || 0, y_pos: p.y_pos || 0, status: p.status }));
    await updateLineup(nextMatch.id, payload, coachPin);
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <h3>Alineación ({fieldPlayers.length}/11)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px' }}>
        
        {/* PITCH */}
        <div style={{ 
          background: '#2e7d32', 
          border: '2px solid white', 
          height: '400px', 
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {fieldPlayers.map(p => (
            <div 
              key={p.id}
              onClick={() => moveToBench(p.id)}
              style={{
                position: 'absolute',
                left: `${p.x_pos}%`,
                top: `${p.y_pos}%`,
                transform: 'translate(-50%, -50%)',
                background: 'white',
                color: 'black',
                padding: '4px 8px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: isCoach ? 'pointer' : 'default',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                border: '2px solid #1b5e20'
              }}
              title={isCoach ? 'Click para enviar a la banca' : ''}
            >
              {p.first_name} {p.last_name[0]}.
            </div>
          ))}
          {/* Halfway line */}
          <div style={{ position: 'absolute', top: '50%', width: '100%', height: '2px', background: 'rgba(255,255,255,0.4)', transform: 'translateY(-50%)' }} />
          {/* Center circle */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '80px', height: '80px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>

        {/* BENCH */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '12px' }}>Banca</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {benchPlayers.length === 0 && <p style={{ fontSize: '12px', color: 'gray' }}>Nadie en la banca</p>}
            {benchPlayers.map(p => (
              <button 
                key={p.id}
                onClick={() => moveToField(p.id)}
                disabled={!isCoach}
                style={{
                  background: 'var(--surface-color)',
                  border: '1px solid var(--surface-border)',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: isCoach ? 'pointer' : 'default',
                  textAlign: 'left'
                }}
              >
                {p.first_name} {p.last_name} ({p.position})
                {isCoach && <span style={{ float: 'right' }}>➜</span>}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
