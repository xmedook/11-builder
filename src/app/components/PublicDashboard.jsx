'use client';

import Lineup from './Lineup';

export default function PublicDashboard({ players, nextMatch, onCoachLogin, onPlayerSelect }) {
  const confirmed = players.filter(p =>
    nextMatch?.attendance?.some(a => a.player_id === p.id && a.status === 'yes')
  );

  return (
    <div className="animate-in">
      {/* Bienvenida + acceso */}
      <div className="glass-panel" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          ¿Eres jugador? Busca tu nombre abajo y toca <strong>"Soy yo"</strong>.<br />
          ¿Eres el coach?
        </p>
        <button className="btn btn-primary" onClick={onCoachLogin}>
          👑 Entrar como Coach
        </button>
      </div>

      <div className="grid-2">
        {/* Próximo partido */}
        <div className="glass-panel">
          <h3>Próximo Partido</h3>
          {nextMatch ? (
            <>
              <p><strong>Rival:</strong> {nextMatch.opponent}</p>
              <p><strong>Fecha:</strong> {nextMatch.date}</p>
              {confirmed.length > 0 && (
                <>
                  <h4 style={{ marginTop: '16px' }}>Confirmados ({confirmed.length}):</h4>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px' }}>
                    {confirmed.map(p => (
                      <li key={p.id} style={{ padding: '3px 0', fontSize: '14px' }}>
                        ✅ {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.first_name} {p.last_name}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Sin partido programado.</p>
          )}
        </div>

        {/* Lista de jugadores con "Soy yo" */}
        <div className="glass-panel">
          <h3>Plantilla ({players.length})</h3>
          {players.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No hay jugadores registrados.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {players.map(p => (
                <li key={p.id} className="player-row" style={{ padding: '10px 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>
                      {p.jersey_number ? <span style={{ color: 'var(--primary-color)', marginRight: '6px' }}>#{p.jersey_number}</span> : null}
                      {p.first_name} {p.last_name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{p.position}</span>
                  </div>
                  {p.jersey_number ? (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px', minHeight: '36px', width: 'auto' }}
                      onClick={() => onPlayerSelect(p)}
                    >
                      Soy yo
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sin dorsal</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Alineación pública (read-only) */}
      {nextMatch && (
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          <h3>Alineación</h3>
          <Lineup players={players} nextMatch={nextMatch} isCoach={false} />
        </div>
      )}
    </div>
  );
}
