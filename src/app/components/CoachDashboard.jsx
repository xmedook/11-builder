'use client';

import { useState } from 'react';
import { addPlayer, createOrUpdateMatch, deletePlayer, unlinkPlayer } from '../actions';
import PlayerList from './PlayerList';
import Lineup from './Lineup';

export default function CoachDashboard({ players, nextMatch, coachToken }) {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', position: 'MC' });
  const [isAdding, setIsAdding] = useState(false);

  async function handleAddPlayer(e) {
    e.preventDefault();
    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('position', formData.position);
    await addPlayer(data, coachToken);
    setFormData({ first_name: '', last_name: '', position: 'MC' });
    setIsAdding(false);
  }

  return (
    <div className="animate-in">
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2>👑 Coach Dashboard</h2>
        <p>Bienvenido al panel de control. Usa este token secreto en tu URL siempre: <code>?coach=secret-coach</code></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Match Settings */}
        <div className="glass-panel">
          <h3>Siguiente Partido</h3>
          {nextMatch ? (
            <div>
              <p><strong>Rival:</strong> {nextMatch.opponent}</p>
              <p><strong>Fecha:</strong> {nextMatch.date}</p>
              <h4>Asistencia:</h4>
              <ul>
                {players.map(p => {
                  const rsvp = nextMatch.attendance?.find(a => a.player_id === p.id);
                  return (
                    <li key={p.id}>
                      {p.first_name} {p.last_name}: 
                      {rsvp ? (rsvp.status === 'yes' ? ' ✅ Sí' : ' ❌ No') : ' ⏳ Pendiente'}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p>Aún no has creado un partido.</p>
          )}
          
          <form action={(data) => createOrUpdateMatch(data, coachToken)} style={{ marginTop: '20px' }}>
            <input type="date" name="date" required className="input-field" />
            <input type="text" name="opponent" required placeholder="Nombre del rival" className="input-field" />
            <button type="submit" className="btn btn-primary">Guardar Partido</button>
          </form>
        </div>

        {/* Players List */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Plantilla ({players?.length})</h3>
            <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>➕ Jugador</button>
          </div>
          
          {isAdding && (
            <form onSubmit={handleAddPlayer} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <input type="text" placeholder="Nombre" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required className="input-field" />
              <input type="text" placeholder="Apellido" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required className="input-field" />
              <button type="submit" className="btn btn-primary">Guardar</button>
            </form>
          )}

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <PlayerList players={players} isCoach={true} coachToken={coachToken} />
          </div>
        </div>
      </div>

      {/* Full width Lineup section */}
      {nextMatch && (
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          <Lineup players={players} nextMatch={nextMatch} isCoach={true} coachToken={coachToken} />
        </div>
      )}
    </div>
  );
}
