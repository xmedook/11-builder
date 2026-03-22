'use client';

import { deletePlayer, unlinkPlayer, claimPlayer } from '../actions';

export default function PlayerList({ players, isCoach, coachToken }) {
  if (!players || players.length === 0) return <p>No hay jugadores en la plantilla.</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {players.map(p => (
        <li key={p.id} style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{p.first_name} {p.last_name}</strong> - <span>{p.position}</span>
            {isCoach && <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>
              Dispositivo: {p.device_id ? 'Vinculado' : 'Libre'}
            </div>}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {isCoach && (
              <>
                {p.device_id && (
                  <button onClick={() => unlinkPlayer(p.id, coachToken)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>Desvincular</button>
                )}
                <button onClick={() => deletePlayer(p.id, coachToken)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>X</button>
              </>
            )}
            
            {!isCoach && !p.device_id && (
              <button 
                onClick={async () => {
                  try {
                    await claimPlayer(p.id);
                  } catch (e) {
                    alert(e.message);
                  }
                }} 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Soy Yo
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
