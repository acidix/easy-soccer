import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { LineupTab } from './components/LineupTab';
import { FormationTab } from './components/FormationTab';
import { CompareTab } from './components/CompareTab';
import { AuthModal } from './components/AuthModal';
import { Sparkles } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, loadingAuth } = useApp();
  const [activeTab, setActiveTab] = useState<'lineup' | 'formation' | 'compare'>('lineup');
  const [bypassAuth, setBypassAuth] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  if (loadingAuth) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 0 20px var(--primary-glow)',
          animation: 'pulse 1.5s infinite'
        }}>
          <Sparkles size={40} />
        </div>
        <span style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.05em' }}>
          Easy Soccer lädt...
        </span>
      </div>
    );
  }

  // Show login screen if not logged in and not bypassed
  if (!user && !bypassAuth) {
    return <AuthModal onBypass={() => setBypassAuth(true)} />;
  }

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onShowAuth={() => setBypassAuth(false)}
      >
        {activeTab === 'lineup' && <LineupTab />}
        {activeTab === 'formation' && <FormationTab />}
        {activeTab === 'compare' && <CompareTab />}
      </Layout>

      {/* Force Auth modal from navigation if bypass is true */}
      {showAuthOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11, 15, 25, 0.95)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '480px' }}>
            <AuthModal onBypass={() => {
              setBypassAuth(true);
              setShowAuthOverlay(false);
            }} />
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

export default App;
