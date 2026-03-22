'use client';

import PlayerList from './PlayerList';
import Lineup from './Lineup';

export default function PublicDashboard({ players, nextMatch }) {
  return (
    <div className="animate-in">
      <div className="glass-panel" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2>Bienvenido Visitante</h2>
        <p>Si eres jugador del equipo, busca tu nombre abajo y presiona "Soy Yo" para reclamar tu perfil en este dispositivo.</p>
      </div>

      <div className="grid-2">
        {/* Next Match */}
        <div className="glass-panel">
          <h3>Próximo Partido</h3>
          {nextMatch ? (
            <div>
              <p><strong>Rival:</strong> {nextMatch.opponent}</p>
              <p><strong>Fecha:</strong> {nextMatch.date}</p>
              
              <h4 style={{ marginTop: '16px' }}>Asistencia Confirmada:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {players.map(p => {
                  const rsvp = nextMatch.attendance?.find(a => a.player_id === p.id);
                  if (rsvp?.status === 'yes') {
                    return <li key={p.id}>✅ {p.first_name} {p.last_name}</li>;
                  }
                  return null;
                })}
              </ul>
            </div>
          ) : (
            <p>No hay partidos programados.</p>
          )}
        </div>

        {/* Players List */}
        <div className="glass-panel">
          <h3>Plantilla del Equipo</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <PlayerList players={players} isCoach={false} />
          </div>
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
