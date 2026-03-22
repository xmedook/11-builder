'use client';

import { useState } from 'react';
import { addPlayer, updatePlayer, createOrUpdateMatch, deletePlayer, resetPlayerDorsal, updateCoachPin, submitRSVP } from '../actions';
import PlayerList from './PlayerList';
import Lineup from './Lineup';

export default function CoachDashboard({ players, nextMatch, coachPin, onLogout }) {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', position: 'MC', jersey_number: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' });
  const [pinMsg, setPinMsg] = useState('');

  async function handleAddPlayer(e) {
    e.preventDefault();
    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('position', formData.position);
    data.append('jersey_number', formData.jersey_number);
    await addPlayer(data, coachPin);
    setFormData({ first_name: '', last_name: '', position: 'MC', jersey_number: '' });
    setIsAdding(false);
  }

  async function handleChangePing(e) {
    e.preventDefault();
    setPinMsg('');
    if (pinForm.next !== pinForm.confirm) { setPinMsg('Los PINs nuevos no coinciden'); return; }
    try {
      await updateCoachPin(pinForm.current, pinForm.next);
      setPinMsg('✅ PIN actualizado. Recarga la página para volver a iniciar sesión.');
      setPinForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPinMsg('❌ ' + err.message);
    }
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}>👑 Coach Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Sesión activa por 12 horas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '13px' }} onClick={() => setShowPinChange(!showPinChange)}>
            🔑 Cambiar PIN
          </button>
          <button className="btn btn-danger" style={{ fontSize: '13px' }} onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Cambiar PIN */}
      {showPinChange && (
        <div className="glass-panel" style={{ marginBottom: '24px' }}>
          <h3>🔑 Cambiar PIN de Coach</h3>
          <form onSubmit={handleChangePing} style={{ maxWidth: '320px', marginTop: '12px' }}>
            <input type="password" inputMode="numeric" maxLength={4} placeholder="PIN actual" value={pinForm.current} onChange={e => setPinForm({...pinForm, current: e.target.value})} className="input-field" />
            <input type="password" inputMode="numeric" maxLength={4} placeholder="Nuevo PIN (4 dígitos)" value={pinForm.next} onChange={e => setPinForm({...pinForm, next: e.target.value})} className="input-field" />
            <input type="password" inputMode="numeric" maxLength={4} placeholder="Confirmar nuevo PIN" value={pinForm.confirm} onChange={e => setPinForm({...pinForm, confirm: e.target.value})} className="input-field" />
            {pinMsg && <p style={{ fontSize: '13px', marginBottom: '12px', color: pinMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{pinMsg}</p>}
            <button type="submit" className="btn btn-primary btn-block">Guardar PIN</button>
          </form>
        </div>
      )}

      <div className="grid-2">
        {/* Partido */}
        <div className="glass-panel">
          <h3>Siguiente Partido</h3>
          {nextMatch ? (
            <div>
              <p><strong>Rival:</strong> {nextMatch.opponent}</p>
              <p><strong>Fecha:</strong> {nextMatch.date}</p>
              <h4 style={{ marginTop: '12px', marginBottom: '8px' }}>
                Asistencia — {nextMatch.attendance?.filter(a => a.status === 'yes').length ?? 0} confirmados
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '16px' }}>
                {players.map(p => {
                  const rsvp = nextMatch.attendance?.find(a => a.player_id === p.id);
                  const status = rsvp?.status;
                  return (
                    <li key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', flex: 1 }}>
                        {p.jersey_number ? <span style={{ color: 'var(--primary-color)', fontWeight: 700, marginRight: '4px' }}>#{p.jersey_number}</span> : null}
                        {p.first_name} {p.last_name}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => submitRSVP(nextMatch.id, p.id, 'yes')}
                          title="Confirmar asistencia"
                          style={{
                            background: status === 'yes' ? '#16a34a' : 'rgba(255,255,255,0.08)',
                            border: '1px solid ' + (status === 'yes' ? '#16a34a' : 'var(--surface-border)'),
                            color: '#fff', borderRadius: '6px', padding: '4px 10px',
                            cursor: 'pointer', fontSize: '14px', minHeight: '32px'
                          }}
                        >✅</button>
                        <button
                          onClick={() => submitRSVP(nextMatch.id, p.id, 'no')}
                          title="Marcar ausencia"
                          style={{
                            background: status === 'no' ? '#dc2626' : 'rgba(255,255,255,0.08)',
                            border: '1px solid ' + (status === 'no' ? '#dc2626' : 'var(--surface-border)'),
                            color: '#fff', borderRadius: '6px', padding: '4px 10px',
                            cursor: 'pointer', fontSize: '14px', minHeight: '32px'
                          }}
                        >❌</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Sin partido programado.</p>
          )}
          <form action={(data) => createOrUpdateMatch(data, coachPin)}>
            <input type="date" name="date" required className="input-field" style={{ colorScheme: 'dark' }} />
            <input type="text" name="opponent" required placeholder="Nombre del rival" className="input-field" />
            <button type="submit" className="btn btn-primary btn-block">Guardar Partido</button>
          </form>
        </div>

        {/* Plantilla */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Plantilla ({players?.length})</h3>
            <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>➕ Jugador</button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddPlayer} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div className="grid-2" style={{ gap: '8px' }}>
                <input type="text" placeholder="Nombre" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required className="input-field" style={{ marginBottom: 0 }} />
                <input type="text" placeholder="Apellido" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required className="input-field" style={{ marginBottom: 0 }} />
              </div>
              <div className="grid-2" style={{ gap: '8px', marginTop: '8px' }}>
                <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="input-field" style={{ marginBottom: 0 }}>
                  {['PO','DC','DG','DD','MC','MCO','MDC','EI','ED','SD','ATT'].map(p => <option key={p}>{p}</option>)}
                </select>
                <input type="number" min="1" max="99" placeholder="# Dorsal" value={formData.jersey_number} onChange={e => setFormData({...formData, jersey_number: e.target.value})} className="input-field" style={{ marginBottom: 0 }} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '12px' }}>Guardar</button>
            </form>
          )}

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <PlayerList players={players} isCoach={true} coachPin={coachPin} />
          </div>
        </div>
      </div>

      {nextMatch && (
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          <Lineup players={players} nextMatch={nextMatch} isCoach={true} coachPin={coachPin} />
        </div>
      )}
    </div>
  );
}
