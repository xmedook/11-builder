'use client';

import { useState } from 'react';
import { updatePlayerProfile, submitRSVP } from '../actions';
import Lineup from './Lineup';

export default function PlayerDashboard({ currentPlayer, nextMatch, players }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    first_name: currentPlayer.first_name, 
    last_name: currentPlayer.last_name 
  });

  const rsvp = nextMatch?.attendance?.find(a => a.player_id === currentPlayer.id);

  async function handleSaveProfile(e) {
    e.preventDefault();
    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    await updatePlayerProfile(currentPlayer.id, data);
    setIsEditing(false);
  }

  return (
    <div className="animate-in">
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h2>👟 Perfil de Jugador</h2>
        <p>Has ingresado como: <strong>{currentPlayer.first_name} {currentPlayer.last_name}</strong></p>
        
        {isEditing ? (
          <form onSubmit={handleSaveProfile} style={{ marginTop: '16px' }}>
            <input type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required className="input-field" />
            <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required className="input-field" />
            <button type="submit" className="btn btn-primary">Guardar Perfil</button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-danger" style={{ marginLeft: '8px' }}>Cancelar</button>
          </form>
        ) : (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ marginTop: '16px' }}>Editar Mi Info</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Next Match */}
        <div className="glass-panel">
          <h3>Próximo Partido</h3>
          {nextMatch ? (
            <div>
              <p><strong>Rival:</strong> {nextMatch.opponent}</p>
              <p><strong>Fecha:</strong> {nextMatch.date}</p>
              
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '12px' }}>¿Asistirás?</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => submitRSVP(nextMatch.id, currentPlayer.id, 'yes')}
                    className="btn" 
                    style={{ background: rsvp?.status === 'yes' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', color: 'white', flex: 1 }}
                  >
                    ⚽ Sí, voy
                  </button>
                  <button 
                    onClick={() => submitRSVP(nextMatch.id, currentPlayer.id, 'no')}
                    className="btn" 
                    style={{ background: rsvp?.status === 'no' ? 'var(--danger-color)' : 'rgba(255,255,255,0.1)', color: 'white', flex: 1 }}
                  >
                    ❌ No puedo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p>No hay partidos programados en este momento.</p>
          )}
        </div>

        {/* Squad Status */}
        <div className="glass-panel">
          <h3>Convocatoria</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map(p => {
              const pRSVP = nextMatch?.attendance?.find(a => a.player_id === p.id);
              return (
                <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--surface-border)' }}>
                  {p.first_name} {p.last_name}: {pRSVP ? (pRSVP.status === 'yes' ? '✅' : '❌') : '⏳'}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Full width Lineup section */}
      {nextMatch && (
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          <Lineup players={players} nextMatch={nextMatch} isCoach={false} />
        </div>
      )}
    </div>
  );
}
