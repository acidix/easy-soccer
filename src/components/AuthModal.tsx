import React from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, Sparkles, User, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  onBypass: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onBypass }) => {
  const { loginWithGoogle, firebaseEnabled } = useApp();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      position: 'relative',
    }}>
      <div className="glass-panel-glow" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 5
      }}>
        {/* Subtle decorative glows */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70px',
          height: '70px',
          background: 'var(--primary)',
          borderRadius: '50%',
          filter: 'blur(35px)',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          width: '4.5rem',
          height: '4.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          boxShadow: '0 0 20px var(--primary-glow)'
        }}>
          <Sparkles size={36} />
        </div>

        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(to right, #ffffff, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Easy Soccer
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Mühelose Jugendfußball-Verwaltung. Erstelle Teams, passe Formationen flexibel an und berechne ideale Aufstellungen mit einem Klick.
        </p>

        <div style={{
          textAlign: 'left',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.2rem',
          marginBottom: '2.5rem'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--text-primary)' }}>
            Funktionen im Überblick:
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} className="text-primary" style={{ color: 'var(--primary)', flexShrink: 0 }} />
              Formationen frei auf virtuellem Spielfeld erstellen
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} className="text-primary" style={{ color: 'var(--primary)', flexShrink: 0 }} />
              Spielerdaten mit S-P-D-T-G Stärkewerten pflegen
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} className="text-primary" style={{ color: 'var(--primary)', flexShrink: 0 }} />
              Intelligenter Auto-Aufstellungs-Algorithmus
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} className="text-primary" style={{ color: 'var(--primary)', flexShrink: 0 }} />
              Vektor-PDF-Export für das Spielfeld & Tabellen
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {firebaseEnabled ? (
            <button
              onClick={loginWithGoogle}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <LogIn size={20} />
              Mit Google anmelden
            </button>
          ) : (
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-glow)',
              padding: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-light)',
              marginBottom: '0.5rem'
            }}>
              Firebase ist nicht konfiguriert. Du läufst vollautomatisch im Offline-Modus.
            </div>
          )}

          <button
            onClick={onBypass}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem'
            }}
          >
            <User size={18} />
            Lokal ohne Anmeldung fortfahren
          </button>
        </div>

        <div style={{
          marginTop: '2.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          Deine Daten werden bei Google-Anmeldung sicher in der Cloud, andernfalls sicher im lokalen Speicher deines Browsers abgelegt.
        </div>
      </div>
    </div>
  );
};
