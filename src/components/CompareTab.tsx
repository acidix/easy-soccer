import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getPlayers, getLineups, type Player, type Lineup, type Formation } from '../services/dbService';
import { 
  Users, 
  Sparkles, 
  Scale, 
  Crown
} from 'lucide-react';

export const CompareTab: React.FC = () => {
  const { teams, formations, user } = useApp();
  const uId = user ? user.uid : null;

  // Selection states
  const [selectedTeamAId, setSelectedTeamAId] = useState<string>('');
  const [selectedLineupAId, setSelectedLineupAId] = useState<string>('');
  const [selectedTeamBId, setSelectedTeamBId] = useState<string>('');
  const [selectedLineupBId, setSelectedLineupBId] = useState<string>('');

  // Loaded data states
  const [lineupsA, setLineupsA] = useState<Lineup[]>([]);
  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [lineupA, setLineupA] = useState<Lineup | null>(null);

  const [lineupsB, setLineupsB] = useState<Lineup[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [lineupB, setLineupB] = useState<Lineup | null>(null);

  // Initialize Team selections
  useEffect(() => {
    if (teams.length > 0) {
      if (!selectedTeamAId) setSelectedTeamAId(teams[0].id);
      if (!selectedTeamBId) setSelectedTeamBId(teams[0].id);
    }
  }, [teams]);

  // Fetch Team A details
  useEffect(() => {
    if (!selectedTeamAId) return;
    const fetchTeamADetails = async () => {
      try {
        const fetchedLineups = await getLineups(uId, selectedTeamAId);
        const fetchedPlayers = await getPlayers(uId, selectedTeamAId);
        setLineupsA(fetchedLineups);
        setPlayersA(fetchedPlayers);
        
        // Select first lineup by default if available
        if (fetchedLineups.length > 0) {
          setSelectedLineupAId(fetchedLineups[0].id);
          setLineupA(fetchedLineups[0]);
        } else {
          setSelectedLineupAId('');
          setLineupA(null);
        }
      } catch (err) {
        console.error('Error fetching Team A details:', err);
      }
    };
    fetchTeamADetails();
  }, [selectedTeamAId, uId]);

  // Fetch Team B details
  useEffect(() => {
    if (!selectedTeamBId) return;
    const fetchTeamBDetails = async () => {
      try {
        const fetchedLineups = await getLineups(uId, selectedTeamBId);
        const fetchedPlayers = await getPlayers(uId, selectedTeamBId);
        setLineupsB(fetchedLineups);
        setPlayersB(fetchedPlayers);
        
        // Select first lineup by default if available
        if (fetchedLineups.length > 0) {
          setSelectedLineupBId(fetchedLineups[0].id);
          setLineupB(fetchedLineups[0]);
        } else {
          setSelectedLineupBId('');
          setLineupB(null);
        }
      } catch (err) {
        console.error('Error fetching Team B details:', err);
      }
    };
    fetchTeamBDetails();
  }, [selectedTeamBId, uId]);

  // Update Lineup A state when selectedLineupAId changes
  useEffect(() => {
    const selected = lineupsA.find(l => l.id === selectedLineupAId);
    setLineupA(selected || null);
  }, [selectedLineupAId, lineupsA]);

  // Update Lineup B state when selectedLineupBId changes
  useEffect(() => {
    const selected = lineupsB.find(l => l.id === selectedLineupBId);
    setLineupB(selected || null);
  }, [selectedLineupBId, lineupsB]);

  // Helper to get assigned player on pitch
  const getAssignedPlayer = (assignments: Record<string, string>, playersList: Player[], posId: string): Player | undefined => {
    const playerId = assignments[posId];
    return playersList.find(p => p.id === playerId);
  };

  const activeFormationA = lineupsA.length > 0 && lineupA 
    ? formations.find(f => f.id === lineupA.formationId) || null
    : null;

  const activeFormationB = lineupsB.length > 0 && lineupB 
    ? formations.find(f => f.id === lineupB.formationId) || null
    : null;

  // CALCULATE STRENGTH AVERAGES FOR SPIDER CHART
  const calculateMetrics = (lineup: Lineup | null, playersList: Player[], formation: Formation | null) => {
    if (!lineup || !formation || playersList.length === 0) {
      return { schuss: 0, pass: 0, dribbling: 0, tackling: 0, speed: 0, reflex: 0, overall: 0 };
    }

    const assignedPlayers: Player[] = [];
    const assignments = lineup.assignments || {};

    formation.positions.forEach((pos) => {
      const player = getAssignedPlayer(assignments, playersList, pos.id);
      if (player) {
        assignedPlayers.push(player);
      }
    });

    if (assignedPlayers.length === 0) {
      return { schuss: 0, pass: 0, dribbling: 0, tackling: 0, speed: 0, reflex: 0, overall: 0 };
    }

    const sum = (key: keyof Player['ratings']) => {
      const vals = assignedPlayers.map(p => p.ratings[key] || 0);
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    const schuss = sum('schuss');
    const pass = sum('pass');
    const dribbling = sum('dribbling');
    const tackling = sum('tackling');
    const speed = sum('speed');

    const gk = assignedPlayers.find(p => p.isGoalkeeper);
    const reflex = gk?.ratings.gkReflexes || gk?.ratings.tackling || 5;

    // Overall average
    let totalSum = 0;
    assignedPlayers.forEach((p) => {
      const stats = [p.ratings.schuss, p.ratings.pass, p.ratings.dribbling, p.ratings.tackling, p.ratings.speed];
      if (p.isGoalkeeper && p.ratings.gkReflexes) {
        stats.push(p.ratings.gkReflexes);
      }
      totalSum += stats.reduce((a, b) => a + b, 0) / stats.length;
    });
    const overall = totalSum / assignedPlayers.length;

    return {
      schuss: Math.round(schuss * 10) / 10,
      pass: Math.round(pass * 10) / 10,
      dribbling: Math.round(dribbling * 10) / 10,
      tackling: Math.round(tackling * 10) / 10,
      speed: Math.round(speed * 10) / 10,
      reflex: Math.round(reflex * 10) / 10,
      overall: Math.round(overall * 10) / 10
    };
  };

  const metricsA = calculateMetrics(lineupA, playersA, activeFormationA);
  const metricsB = calculateMetrics(lineupB, playersB, activeFormationB);

  // RADAR CHART SVG COORDINATES GENERATION (Hexagon)
  // Axes order: Schuss, Passen, Dribbling, Tackling, Tempo, Reflexe
  const axes = [
    { label: 'Schuss', key: 'schuss' as const },
    { label: 'Passen', key: 'pass' as const },
    { label: 'Dribbling', key: 'dribbling' as const },
    { label: 'Tackling', key: 'tackling' as const },
    { label: 'Tempo', key: 'speed' as const },
    { label: 'Reflexe', key: 'reflex' as const }
  ];

  const getCoordinates = (metrics: typeof metricsA, scale = 1.0) => {
    const center = 120;
    const rMax = 80;
    const points: string[] = [];

    axes.forEach((axis, idx) => {
      const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
      const score = metrics[axis.key] || 0;
      const val = (score / 10) * rMax * scale;
      const x = center + val * Math.cos(angle);
      const y = center + val * Math.sin(angle);
      points.push(`${x},${y}`);
    });

    return points.join(' ');
  };

  const getGridPoints = (level: number) => {
    const center = 120;
    const r = 80 * (level / 5);
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  // Compare summary text generator
  const getComparisonSummary = () => {
    if (!lineupA || !lineupB) return 'Bitte wähle zwei Aufstellungen aus, um den Vergleich zu starten.';

    const diff = metricsA.overall - metricsB.overall;
    const teamAName = teams.find(t => t.id === selectedTeamAId)?.name || 'Team A';
    const teamBName = teams.find(t => t.id === selectedTeamBId)?.name || 'Team B';
    const lineupAName = lineupA.name;
    const lineupBName = lineupB.name;

    if (Math.abs(diff) < 0.2) {
      return `⚖️ Zwei absolut ebenbürtige Aufstellungen! Gesamtstärke: ${metricsA.overall.toFixed(1)} vs. ${metricsB.overall.toFixed(1)}. Hier entscheiden Nuancen und Tagesform.`;
    }

    const strongerTeam = diff > 0 ? `${teamAName} (${lineupAName})` : `${teamBName} (${lineupBName})`;
    const strongerScore = diff > 0 ? metricsA.overall : metricsB.overall;
    const weakerScore = diff > 0 ? metricsB.overall : metricsA.overall;

    let detail = '';
    const speedDiff = metricsA.speed - metricsB.speed;
    const fwdDiff = metricsA.schuss - metricsB.schuss;
    const defDiff = metricsA.tackling - metricsB.tackling;

    if (diff > 0) {
      if (speedDiff > 1.0) detail += ' vor allem durch höhere Schnelligkeit';
      else if (fwdDiff > 1.0) detail += ' durch stärkere Abschlussqualitäten';
      else if (defDiff > 1.0) detail += ' durch eine robustere Defensive';
    } else {
      if (speedDiff < -1.0) detail += ' vor allem durch höhere Schnelligkeit';
      else if (fwdDiff < -1.0) detail += ' durch stärkere Abschlussqualitäten';
      else if (defDiff < -1.0) detail += ' durch eine robustere Defensive';
    }

    return `📈 Die Aufstellung ${strongerTeam} besitzt mit ${strongerScore.toFixed(1)} zu ${weakerScore.toFixed(1)} im Durchschnitt die höhere Qualität${detail}.`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.25rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Scale size={24} style={{ color: 'var(--primary)' }} />
            Aufstellungs-Vergleich
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Vergleiche die taktische Aufstellung und die Leistungswerte zweier Teams in Echtzeit.
          </p>
        </div>
      </div>

      {/* 1. SELECTION CARD CONTROLS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          
          {/* TEAM & LINEUP A SELECTOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              Team A (Vergleichsseite Links)
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Mannschaft</label>
              <select
                value={selectedTeamAId}
                onChange={(e) => setSelectedTeamAId(e.target.value)}
                className="glass-input"
                style={{ fontSize: '0.85rem', padding: '0.4rem' }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id} style={{ background: '#1f2937' }}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Aufstellung</label>
              <select
                value={selectedLineupAId}
                disabled={lineupsA.length === 0}
                onChange={(e) => setSelectedLineupAId(e.target.value)}
                className="glass-input"
                style={{ fontSize: '0.85rem', padding: '0.4rem' }}
              >
                {lineupsA.length === 0 ? (
                  <option style={{ background: '#1f2937' }}>Keine Aufstellungen</option>
                ) : (
                  lineupsA.map(l => (
                    <option key={l.id} value={l.id} style={{ background: '#1f2937' }}>{l.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* TEAM & LINEUP B SELECTOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              Team B (Vergleichsseite Rechts)
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Mannschaft</label>
              <select
                value={selectedTeamBId}
                onChange={(e) => setSelectedTeamBId(e.target.value)}
                className="glass-input"
                style={{ fontSize: '0.85rem', padding: '0.4rem' }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id} style={{ background: '#1f2937' }}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Aufstellung</label>
              <select
                value={selectedLineupBId}
                disabled={lineupsB.length === 0}
                onChange={(e) => setSelectedLineupBId(e.target.value)}
                className="glass-input"
                style={{ fontSize: '0.85rem', padding: '0.4rem' }}
              >
                {lineupsB.length === 0 ? (
                  <option style={{ background: '#1f2937' }}>Keine Aufstellungen</option>
                ) : (
                  lineupsB.map(l => (
                    <option key={l.id} value={l.id} style={{ background: '#1f2937' }}>{l.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 2. THE RADAR CHART COMPARE PANEL */}
      {lineupA && lineupB && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem'
        }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              Spinnennetz Leistungsvergleich
            </h3>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2.5rem'
            }}>
              
              {/* Radar Chart SVG */}
              <div style={{ position: 'relative', width: '240px', height: '240px' }}>
                <svg width="240" height="240" viewBox="0 0 240 240">
                  {/* Hexagon Grid Background */}
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <polygon
                      key={lvl}
                      points={getGridPoints(lvl)}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Grid Axis Lines */}
                  {axes.map((_, idx) => {
                    const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                    const x = 120 + 80 * Math.cos(angle);
                    const y = 120 + 80 * Math.sin(angle);
                    return (
                      <line
                        key={idx}
                        x1="120"
                        y1="120"
                        x2={x}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Polygon Team A (Emerald) */}
                  <polygon
                    points={getCoordinates(metricsA)}
                    fill="rgba(16, 185, 129, 0.25)"
                    stroke="#10b981"
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(16,185,129,0.3))' }}
                  />

                  {/* Polygon Team B (Gold/Orange) */}
                  <polygon
                    points={getCoordinates(metricsB)}
                    fill="rgba(245, 158, 11, 0.25)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.3))' }}
                  />

                  {/* Axis Labels */}
                  {axes.map((axis, idx) => {
                    const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                    // Offset text slightly further out
                    const x = 120 + 96 * Math.cos(angle);
                    const y = 120 + 96 * Math.sin(angle);
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={y + 3}
                        fill="var(--text-secondary)"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {axis.label}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Averages List Comparison */}
              <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Metric Summary Rows */}
                {axes.map((axis) => {
                  const valA = metricsA[axis.key] || 0;
                  const valB = metricsB[axis.key] || 0;
                  const winner = valA > valB ? 'A' : (valB > valA ? 'B' : 'none');
                  return (
                    <div key={axis.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{axis.label}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600 }}>
                        <span style={{ color: winner === 'A' ? '#10b981' : 'var(--text-muted)' }}>
                          {valA.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>vs</span>
                        <span style={{ color: winner === 'B' ? '#f59e0b' : 'var(--text-muted)' }}>
                          {valB.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Overall Score Box */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.6rem 0.8rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginTop: '0.5rem'
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>Gesamtstärke</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#10b981' }}>{metricsA.overall.toFixed(1)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>vs</span>
                    <span style={{ color: '#f59e0b' }}>{metricsB.overall.toFixed(1)}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Analysis feedback comment box */}
            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
              marginTop: '0.5rem'
            }}>
              {getComparisonSummary()}
            </div>

          </div>

        </div>
      )}

      {/* 3. SIDE-BY-SIDE PITCH COMPARISON */}
      {lineupA && lineupB && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          
          {/* PITCH A (Left) */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                {lineupA.name}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                System: <strong>{activeFormationA?.name.split(':')[1]?.trim() || activeFormationA?.name}</strong>
              </span>
            </div>

            {/* Football Pitch Graphic */}
            <div className="football-pitch" style={{ background: 'radial-gradient(circle, #064e3b 0%, #022c22 100%)' }}>
              {/* Markings */}
              <div className="pitch-lines" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="pitch-center-circle" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-penalty-top" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-penalty-bottom" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-goal-top" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-goal-bottom" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              </div>

              {/* Player Pins */}
              {activeFormationA?.positions.map((pos) => {
                const player = getAssignedPlayer(lineupA.assignments || {}, playersA, pos.id);
                if (player) {
                  return (
                    <div
                      key={pos.id}
                      className={`player-dot ${pos.zone === 'goalkeeper' ? 'gk' : ''}`}
                      style={{ 
                        left: `${pos.x}%`, 
                        top: `${pos.y}%`,
                        background: '#10b981',
                        border: '2.5px solid #ffffff',
                        boxShadow: '0 0 10px rgba(16,185,129,0.5)'
                      }}
                    >
                      {player.number}
                      {player.isCaptain && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#0b0f19',
                          border: '1.5px solid #eab308',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#eab308',
                          zIndex: 15
                        }}>
                          <Crown size={10} fill="#eab308" />
                        </div>
                      )}
                      <div className="player-label" style={{ fontSize: '0.62rem' }}>
                        {player.name}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div 
                      key={pos.id}
                      className="player-dot-empty"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%`, opacity: 0.3 }}
                    >
                      +
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* PITCH B (Right) */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                {lineupB.name}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                System: <strong>{activeFormationB?.name.split(':')[1]?.trim() || activeFormationB?.name}</strong>
              </span>
            </div>

            {/* Football Pitch Graphic */}
            <div className="football-pitch" style={{ background: 'radial-gradient(circle, #78350f 0%, #451a03 100%)' }}>
              {/* Markings */}
              <div className="pitch-lines" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="pitch-center-circle" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-penalty-top" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-penalty-bottom" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-goal-top" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="pitch-goal-bottom" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              </div>

              {/* Player Pins */}
              {activeFormationB?.positions.map((pos) => {
                const player = getAssignedPlayer(lineupB.assignments || {}, playersB, pos.id);
                if (player) {
                  return (
                    <div
                      key={pos.id}
                      className={`player-dot ${pos.zone === 'goalkeeper' ? 'gk' : ''}`}
                      style={{ 
                        left: `${pos.x}%`, 
                        top: `${pos.y}%`,
                        background: '#f59e0b',
                        border: '2.5px solid #ffffff',
                        boxShadow: '0 0 10px rgba(245,158,11,0.5)'
                      }}
                    >
                      {player.number}
                      {player.isCaptain && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#0b0f19',
                          border: '1.5px solid #eab308',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#eab308',
                          zIndex: 15
                        }}>
                          <Crown size={10} fill="#eab308" />
                        </div>
                      )}
                      <div className="player-label" style={{ fontSize: '0.62rem' }}>
                        {player.name}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div 
                      key={pos.id}
                      className="player-dot-empty"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%`, opacity: 0.3 }}
                    >
                      +
                    </div>
                  );
                }
              })}
            </div>
          </div>

        </div>
      )}

      {/* Warnings if lineups are not fully configured */}
      {(!lineupA || !lineupB) && (
        <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ color: 'var(--border-color)', animation: 'pulse 2s infinite' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Aufstellungsauswahl erforderlich</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '400px' }}>
              Bitte wähle oben für Team A und Team B jeweils eine Mannschaft und eine Aufstellung aus, um den detaillierten Stärken- und Taktik-Vergleich anzuzeigen.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
