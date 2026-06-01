import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  LogOut, 
  LogIn, 
  Plus, 
  Trash2, 
  Sparkles, 
  Smartphone
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'lineup' | 'formation' | 'compare';
  setActiveTab: (tab: 'lineup' | 'formation' | 'compare') => void;
  onShowAuth: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onShowAuth 
}) => {
  const { 
    user, 
    logout, 
    teams, 
    activeTeam, 
    setActiveTeam, 
    createTeam, 
    deleteActiveTeam,
    firebaseEnabled 
  } = useApp();

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      await createTeam(newTeamName.trim());
      setNewTeamName('');
      setShowTeamModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <header className="glass-panel no-print" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderRadius: 0,
        padding: '0.8rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--primary)',
              color: '#0b0f19',
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--primary-glow)'
            }}>
              <Sparkles size={20} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Easy Soccer
            </span>
          </div>

          {/* Controls & Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Team Selector */}
            {activeTeam ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={activeTeam.id}
                  onChange={(e) => {
                    const selected = teams.find((t) => t.id === e.target.value);
                    if (selected) setActiveTeam(selected);
                  }}
                  className="glass-input"
                  style={{
                    padding: '0.4rem 2rem 0.4rem 0.8rem',
                    fontSize: '0.9rem',
                    minWidth: '150px',
                    width: 'auto'
                  }}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} style={{ background: '#1f2937' }}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowTeamModal(true)}
                  className="btn btn-secondary btn-icon"
                  title="Team hinzufügen"
                >
                  <Plus size={18} />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Möchtest du das Team "${activeTeam.name}" und all seine Spieler & Aufstellungen wirklich löschen?`)) {
                      deleteActiveTeam();
                    }
                  }}
                  className="btn btn-secondary btn-icon"
                  style={{ color: 'var(--danger)' }}
                  title="Team löschen"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTeamModal(true)}
                className="btn btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Team erstellen
              </button>
            )}

            {/* Auth section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Profil'} 
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }} className="user-name">
                    {user.displayName || 'Trainer'}
                  </span>

                  <button
                    onClick={logout}
                    className="btn btn-secondary btn-icon"
                    title="Abmelden"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <Smartphone size={12} />
                    Lokal
                  </span>
                  {firebaseEnabled && (
                    <button
                      onClick={onShowAuth}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <LogIn size={14} /> Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Controller & Body */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        {/* Sketch Tabs Selection: Spieler | Formation */}
        {activeTeam && (
          <div className="no-print" style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setActiveTab('lineup')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'lineup' ? 'var(--primary)' : 'var(--text-secondary)',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'lineup' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              Spieler & Aufstellung
            </button>
            <button
              onClick={() => setActiveTab('formation')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'formation' ? 'var(--primary)' : 'var(--text-secondary)',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'formation' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              Formations-Konfigurator
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'compare' ? 'var(--primary)' : 'var(--text-secondary)',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'compare' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              Vergleich
            </button>
          </div>
        )}

        {/* Application Content */}
        {activeTeam ? children : (
          <div className="glass-panel no-print" style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            marginTop: '2rem'
          }}>
            <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Willkommen bei Easy Soccer!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Erstelle zuerst eine Mannschaft, um Spieler hinzuzufügen und Aufstellungen zu erstellen.
            </p>
            <button
              onClick={() => setShowTeamModal(true)}
              className="btn btn-primary"
            >
              <Plus size={18} /> Neue Mannschaft erstellen
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print" style={{
        textAlign: 'center',
        padding: '2rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto'
      }}>
        Easy Soccer &copy; {new Date().getFullYear()} &bull; Entwickelt für moderne Jugendfußball-Trainer
      </footer>

      {/* Create Team Overlay Modal */}
      {showTeamModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <form 
            onSubmit={handleCreateTeamSubmit} 
            className="glass-panel-glow" 
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              Neue Mannschaft anlegen
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Name der Mannschaft (z.B. U11 Junioren)
              </label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="z.B. E-Jugend TSV"
                className="glass-input"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setNewTeamName('');
                  setShowTeamModal(false);
                }}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Erstellen
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
