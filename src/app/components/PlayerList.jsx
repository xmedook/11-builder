'use client';

import { deletePlayer, resetPlayerDorsal } from '../actions';

export default function PlayerList({ players, isCoach, coachPin }) {
  if (!players || players.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No hay jugadores en la plantilla.</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {players.map(p => (
        <li key={p.id} className="player-row" style={{ padding: '10px 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {p.jersey_number
              ? <span style={{ color: 'var(--primary-color)', fontWeight: 700, marginRight: '6px' }}>#{p.jersey_number}</span>
              : <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginRight: '6px' }}>S/D</span>
            }
            <strong>{p.first_name} {p.last_name}</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>{p.position}</span>
          </div>
          
          <div className="player-actions" style={{ display: 'flex', gap: '6px' }}>
            {isCoach && (
              <>
                {p.jersey_number && (
                  <button onClick={() => resetPlayerDorsal(p.id, coachPin)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px', minHeight: '32px', width: 'auto' }}>↩ Dorsal</button>
                )}
                <button onClick={() => deletePlayer(p.id, coachPin)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px', minHeight: '32px', width: 'auto' }}>✕</button>
              </>
            )}
            
            {/* "Soy yo" se maneja desde PublicDashboard / AuthGate */}
          </div>
        </li>
      ))}
    </ul>
  );
}
