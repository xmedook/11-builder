'use client';

import { useState, useEffect } from 'react';
import { verifyCoachPin, verifyPlayerDorsal } from '../actions';
import PinKeypad from './PinKeypad';
import CoachDashboard from './CoachDashboard';
import PlayerDashboard from './PlayerDashboard';
import PublicDashboard from './PublicDashboard';

const LS_KEY = 'esc_auth';
const COACH_EXP_HOURS = 12;
const PLAYER_EXP_DAYS = 365;

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw);
    if (auth.exp && Date.now() > auth.exp) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return auth;
  } catch { return null; }
}

function storeAuth(auth) {
  localStorage.setItem(LS_KEY, JSON.stringify(auth));
}

export default function AuthGate({ players, nextMatch }) {
  const [auth, setAuth] = useState(null);
  const [screen, setScreen] = useState('public'); // 'public' | 'coach-pin' | 'player-dorsal'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [dorsalInput, setDorsalInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [dorsalError, setDorsalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) setAuth(stored);
    setHydrated(true);
  }, []);

  // ─── Coach PIN flow ───────────────────────────────────────────────────────

  async function handleCoachPin(pin) {
    setLoading(true);
    setPinError('');
    try {
      const { ok } = await verifyCoachPin(pin);
      if (ok) {
        const authData = {
          role: 'coach',
          pin,
          exp: Date.now() + COACH_EXP_HOURS * 3600 * 1000,
        };
        storeAuth(authData);
        setAuth(authData);
        setScreen('public');
      } else {
        setPinError('PIN incorrecto. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Player dorsal flow ───────────────────────────────────────────────────

  function handleSelectPlayer(player) {
    setSelectedPlayer(player);
    setDorsalInput('');
    setDorsalError('');
    setScreen('player-dorsal');
  }

  async function handleDorsalSubmit(e) {
    e.preventDefault();
    if (!dorsalInput) return;
    setLoading(true);
    setDorsalError('');
    try {
      const { ok, player } = await verifyPlayerDorsal(selectedPlayer.id, parseInt(dorsalInput, 10));
      if (ok) {
        const authData = {
          role: 'player',
          playerId: player.id,
          firstName: player.first_name,
          lastName: player.last_name,
          exp: Date.now() + PLAYER_EXP_DAYS * 24 * 3600 * 1000,
        };
        storeAuth(authData);
        setAuth(authData);
        setScreen('public');
      } else {
        setDorsalError('Dorsal incorrecto. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(LS_KEY);
    setAuth(null);
    setScreen('public');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // Evitar hydration mismatch
  if (!hydrated) return null;

  // Coach PIN screen
  if (screen === 'coach-pin') {
    return (
      <PinKeypad
        title="👑 Acceso Coach"
        subtitle="Ingresa tu PIN de 4 dígitos"
        onSubmit={handleCoachPin}
        loading={loading}
        error={pinError}
      />
    );
  }

  // Player dorsal screen
  if (screen === 'player-dorsal') {
    return (
      <div className="pin-overlay">
        <div className="pin-card glass-panel">
          <h2 className="pin-title">👟 Confirmar identidad</h2>
          <p className="pin-subtitle">
            ¿Eres <strong>{selectedPlayer?.first_name} {selectedPlayer?.last_name}</strong>?<br />
            Ingresa tu número de dorsal.
          </p>
          <form onSubmit={handleDorsalSubmit} className="dorsal-form">
            <input
              type="number"
              min="1"
              max="99"
              placeholder="# Dorsal"
              value={dorsalInput}
              onChange={e => setDorsalInput(e.target.value)}
              className="input-field dorsal-input"
              autoFocus
            />
            {dorsalError && <p className="pin-error">{dorsalError}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verificando…' : 'Confirmar'}
            </button>
            <button
              type="button"
              className="btn btn-block"
              style={{ marginTop: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}
              onClick={() => { setScreen('public'); setSelectedPlayer(null); }}
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated: Coach
  if (auth?.role === 'coach') {
    return (
      <CoachDashboard
        players={players}
        nextMatch={nextMatch}
        coachPin={auth.pin}
        onLogout={handleLogout}
      />
    );
  }

  // Authenticated: Player
  if (auth?.role === 'player') {
    const currentPlayer = players.find(p => p.id === auth.playerId) || null;
    // Si el jugador ya no existe en DB (borrado), limpiar sesión y mostrar público
    if (!currentPlayer) {
      localStorage.removeItem(LS_KEY);
      return (
        <PublicDashboard
          players={players}
          nextMatch={nextMatch}
          onCoachLogin={() => { setPinError(''); setScreen('coach-pin'); }}
          onPlayerSelect={handleSelectPlayer}
        />
      );
    }
    return (
      <PlayerDashboard
        currentPlayer={currentPlayer}
        nextMatch={nextMatch}
        players={players}
        onLogout={handleLogout}
      />
    );
  }

  // Public / not authenticated
  return (
    <PublicDashboard
      players={players}
      nextMatch={nextMatch}
      onCoachLogin={() => { setPinError(''); setScreen('coach-pin'); }}
      onPlayerSelect={handleSelectPlayer}
    />
  );
}
