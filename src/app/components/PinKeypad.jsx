'use client';

import { useState } from 'react';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinKeypad({ title, subtitle, onSubmit, loading, error }) {
  const [pin, setPin] = useState('');

  function handleKey(k) {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (k === '') {
      // vacío — spacer
    } else if (pin.length < 4) {
      const next = pin + k;
      setPin(next);
      if (next.length === 4) {
        // Auto-submit al completar 4 dígitos
        setTimeout(() => onSubmit(next), 100);
      }
    }
  }

  return (
    <div className="pin-overlay">
      <div className="pin-card glass-panel">
        <h2 className="pin-title">{title}</h2>
        {subtitle && <p className="pin-subtitle">{subtitle}</p>}

        {/* Dots */}
        <div className="pin-dots">
          {[0,1,2,3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
          ))}
        </div>

        {error && <p className="pin-error">{error}</p>}

        {/* Keypad */}
        <div className="pin-grid">
          {KEYS.map((k, i) => (
            <button
              key={i}
              className={`pin-key ${k === '' ? 'pin-key-empty' : ''} ${k === '⌫' ? 'pin-key-del' : ''}`}
              onClick={() => handleKey(k)}
              disabled={loading || k === ''}
              type="button"
            >
              {loading && pin.length === 4 && k !== '⌫' ? '' : k}
            </button>
          ))}
        </div>

        {loading && <p className="pin-loading">Verificando…</p>}
      </div>
    </div>
  );
}
