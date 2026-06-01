import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Player } from '../services/dbService';
import { 
  UserPlus, 
  Trash2, 
  Printer, 
  Save, 
  Plus, 
  FileText,
  RotateCcw,
  UserCheck,
  Users,
  Hand,
  Crown,
  ChevronUp,
  ChevronDown,
  Shield,
  Zap,
  Activity,
  Trophy
} from 'lucide-react';

export const LineupTab: React.FC = () => {
  const {
    players,
    formations,
    activeFormation,
    setActiveFormationById,
    lineups,
    activeLineup,
    currentAssignments,
    saveOrUpdatePlayer,
    deletePlayerById,
    saveOrUpdateLineup,
    deleteLineupById,
    loadLineupById,
    createNewLineupState,
    assignPlayerToPosition,
    autoAssignLineup,
    reorderPlayer,
    sortPlayersAuto
  } = useApp();

  // Form states
  const [lineupNameInput, setLineupNameInput] = useState('');
  const [showSaveLineupModal, setShowSaveLineupModal] = useState(false);
  
  // Add Player Inline States
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<number | ''>('');
  const [newPlayerIsGK, setNewPlayerIsGK] = useState(false);
  const [newPlayerFoot, setNewPlayerFoot] = useState<'links' | 'rechts' | 'beide'>('rechts');
  const [newPlayerS, setNewPlayerS] = useState(5);
  const [newPlayerP, setNewPlayerP] = useState(5);
  const [newPlayerD, setNewPlayerD] = useState(5);
  const [newPlayerT, setNewPlayerT] = useState(5);
  const [newPlayerG, setNewPlayerG] = useState(5);
  const [newPlayerGkReflexes, setNewPlayerGkReflexes] = useState(5);

  // Selector state for assigning players via click
  const [activeSelectPositionId, setActiveSelectPositionId] = useState<string | null>(null);

  // Helper to find the next free jersey number
  const getNextAvailableNumber = (): number => {
    const activeNumbers = new Set(players.map((p) => p.number));
    let candidate = 1;
    while (activeNumbers.has(candidate)) {
      candidate++;
    }
    return candidate;
  };

  // Handle Player Save/Add
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const num = newPlayerNumber === '' ? getNextAvailableNumber() : Number(newPlayerNumber);
    
    // Check for duplicates if manually entered
    if (newPlayerNumber !== '') {
      if (isNaN(num) || num <= 0) {
        alert('Bitte gib eine gültige Trikotnummer ein.');
        return;
      }
      const exists = players.some((p) => p.number === num);
      if (exists) {
        alert(`Die Trikotnummer ${num} ist bereits an einen anderen Spieler vergeben!`);
        return;
      }
    }

    const newPlayer: Omit<Player, 'teamId'> = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newPlayerName.trim(),
      number: num,
      isGoalkeeper: newPlayerIsGK,
      preferredFoot: newPlayerFoot,
      ratings: {
        schuss: newPlayerS,
        pass: newPlayerP,
        dribbling: newPlayerD,
        tackling: newPlayerT,
        speed: newPlayerG,
        ...(newPlayerIsGK ? { gkReflexes: newPlayerGkReflexes } : {})
      }
    };

    await saveOrUpdatePlayer(newPlayer);
    
    // Reset Form
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerIsGK(false);
    setNewPlayerFoot('rechts');
    setNewPlayerS(5);
    setNewPlayerP(5);
    setNewPlayerD(5);
    setNewPlayerT(5);
    setNewPlayerG(5);
    setNewPlayerGkReflexes(5);
  };

  // Inline edit handler for player ratings
  const handleUpdateRating = async (player: Player, stat: string, val: number) => {
    const updated = {
      ...player,
      ratings: {
        ...player.ratings,
        [stat]: val
      }
    };
    await saveOrUpdatePlayer(updated);
  };

  // Inline edit toggle for Goalkeeper flag
  const handleToggleGK = async (player: Player) => {
    const updated = {
      ...player,
      isGoalkeeper: !player.isGoalkeeper,
      ratings: {
        ...player.ratings,
        gkReflexes: player.ratings.gkReflexes || 5
      }
    };
    await saveOrUpdatePlayer(updated);
  };

  // Inline edit handler for name, number and preferred foot fields
  const handleUpdateField = async (player: Player, field: 'name' | 'number' | 'preferredFoot', val: any): Promise<boolean> => {
    if (field === 'number') {
      const num = Number(val);
      if (isNaN(num) || num <= 0) {
        alert('Bitte gib eine gültige Trikotnummer ein.');
        return false;
      }
      const exists = players.some((p) => p.id !== player.id && p.number === num);
      if (exists) {
        alert(`Die Trikotnummer ${num} ist bereits an einen anderen Spieler vergeben!`);
        return false;
      }
    }
    const updated = {
      ...player,
      [field]: val
    };
    await saveOrUpdatePlayer(updated);
    return true;
  };

  // Inline edit toggle for Captain flag
  const handleToggleCaptain = async (player: Player) => {
    const wasCaptain = !!player.isCaptain;
    const promises = players.map(async (p) => {
      if (p.id === player.id) {
        await saveOrUpdatePlayer({
          ...p,
          isCaptain: !wasCaptain
        });
      } else if (p.isCaptain) {
        await saveOrUpdatePlayer({
          ...p,
          isCaptain: false
        });
      }
    });
    await Promise.all(promises);
  };

  // Handle Lineup Save
  const handleSaveLineupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = lineupNameInput.trim() || activeLineup?.name || `Aufstellung vom ${new Date().toLocaleDateString()}`;
    try {
      await saveOrUpdateLineup(name, currentAssignments);
      setShowSaveLineupModal(false);
      setLineupNameInput('');
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern der Aufstellung.');
    }
  };

  // Helper to calculate category ratings
  const getTeamAnalysis = () => {
    if (!activeFormation) return { gk: 0, def: 0, mid: 0, fwd: 0, overall: 0 };

    const assignedGk: Player[] = [];
    const assignedDef: Player[] = [];
    const assignedMid: Player[] = [];
    const assignedFwd: Player[] = [];

    activeFormation.positions.forEach((pos) => {
      const player = getAssignedPlayer(pos.id);
      if (player) {
        if (pos.zone === 'goalkeeper') assignedGk.push(player);
        else if (pos.zone === 'defense') assignedDef.push(player);
        else if (pos.zone === 'midfield') assignedMid.push(player);
        else if (pos.zone === 'forward') assignedFwd.push(player);
      }
    });

    const getAverage = (playersList: Player[], keys: (keyof Player['ratings'])[]) => {
      if (playersList.length === 0) return 0;
      let sum = 0;
      playersList.forEach((p) => {
        let playerSum = 0;
        keys.forEach((key) => {
          playerSum += p.ratings[key] || 0;
        });
        sum += playerSum / keys.length;
      });
      return sum / playersList.length;
    };

    const gkScore = assignedGk.length > 0 
      ? (assignedGk[0].ratings.gkReflexes || (assignedGk[0].ratings.tackling + assignedGk[0].ratings.pass) / 2 || 5)
      : 0;

    const defScore = getAverage(assignedDef, ['tackling', 'speed', 'pass']);
    const midScore = getAverage(assignedMid, ['pass', 'dribbling', 'tackling']);
    const fwdScore = getAverage(assignedFwd, ['schuss', 'speed', 'dribbling']);

    const allAssigned = [...assignedGk, ...assignedDef, ...assignedMid, ...assignedFwd];
    let overallScore = 0;
    if (allAssigned.length > 0) {
      let sum = 0;
      allAssigned.forEach((p) => {
        const stats = [p.ratings.schuss, p.ratings.pass, p.ratings.dribbling, p.ratings.tackling, p.ratings.speed];
        if (p.isGoalkeeper && p.ratings.gkReflexes) {
          stats.push(p.ratings.gkReflexes);
        }
        sum += stats.reduce((a, b) => a + b, 0) / stats.length;
      });
      overallScore = sum / allAssigned.length;
    }

    return {
      gk: Math.round(gkScore * 10) / 10,
      def: Math.round(defScore * 10) / 10,
      mid: Math.round(midScore * 10) / 10,
      fwd: Math.round(fwdScore * 10) / 10,
      overall: Math.round(overallScore * 10) / 10
    };
  };

  const renderStrengthRow = (label: string, score: number, color: string, bgColor: string, icon: React.ReactNode) => {
    const percentage = score * 10;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: bgColor, 
              color: color 
            }}>
              {icon}
            </span>
            <span>{label}</span>
          </div>
          <span style={{ fontWeight: 600, color: score > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {score > 0 ? `${score.toFixed(1)} / 10` : '-'}
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.02)'
        }}>
          <div style={{ 
            width: `${percentage}%`, 
            height: '100%', 
            background: `linear-gradient(90deg, ${color}cc, ${color})`, 
            borderRadius: '10px',
            boxShadow: `0 0 8px ${color}aa`,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
      </div>
    );
  };

  // Trigger print dialog
  const handlePrint = () => {
    window.print();
  };

  // Get assigned player for a position
  const getAssignedPlayer = (posId: string): Player | undefined => {
    const playerId = currentAssignments[posId];
    return players.find((p) => p.id === playerId);
  };

  // Get list of unassigned players
  const getUnassignedPlayers = (): Player[] => {
    const assignedPlayerIds = new Set(Object.values(currentAssignments));
    return players.filter((p) => !assignedPlayerIds.has(p.id));
  };

  const analysis = getTeamAnalysis();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Print-only Container (Visible only under @media print) */}
      <div className="print-container" style={{ display: 'none' }}>
        <div className="print-title-section">
          <h1>Easy Soccer Aufstellungsblatt</h1>
          <p style={{ fontSize: '12pt', color: '#555' }}>
            Aufstellung: <strong>{activeLineup?.name || 'Unbenannte Aufstellung'}</strong> &bull; Formation: <strong>{activeFormation?.name}</strong>
          </p>
        </div>
        
        {/* Pitch on top for printing */}
        <div className="football-pitch">
          <div className="pitch-lines">
            <div className="pitch-center-circle" />
            <div className="pitch-penalty-top" />
            <div className="pitch-penalty-bottom" />
            <div className="pitch-goal-top" />
            <div className="pitch-goal-bottom" />
          </div>
          {activeFormation?.positions.map((pos) => {
            const player = getAssignedPlayer(pos.id);
            return (
              <div 
                key={pos.id} 
                className={`player-dot ${pos.zone === 'goalkeeper' ? 'gk' : ''}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {player ? player.number : '?'}
                
                {player && player.isCaptain && (
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'white',
                    border: '1px solid #eab308',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#eab308',
                    zIndex: 15
                  }}>
                    <Crown size={8} fill="#eab308" />
                  </div>
                )}
                
                <div className="player-label">
                  {player ? `${player.name}${player.isCaptain ? ' (C)' : ''}` : '(Frei)'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Players List Table for printing */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Nr.</th>
              <th>Name</th>
              <th style={{ width: '80px' }}>Position</th>
              <th style={{ width: '50px' }}>Schuss</th>
              <th style={{ width: '50px' }}>Pass</th>
              <th style={{ width: '50px' }}>Dribbling</th>
              <th style={{ width: '50px' }}>Tackling</th>
              <th style={{ width: '50px' }}>Speed</th>
              <th style={{ width: '50px' }}>Reflexe</th>
            </tr>
          </thead>
          <tbody>
            {activeFormation?.positions.map((pos) => {
              const player = getAssignedPlayer(pos.id);
              const zoneNames = { goalkeeper: 'Torwart', defense: 'Abwehr', midfield: 'Mittelfeld', forward: 'Sturm' };
              return (
                <tr key={pos.id}>
                  <td><strong>{player ? player.number : '-'}</strong></td>
                  <td>{player ? `${player.name}${player.isCaptain ? ' (Kapitän)' : ''}` : <em style={{ color: '#aaa' }}>(Kein Spieler zugewiesen)</em>}</td>
                  <td>{zoneNames[pos.zone]}</td>
                  <td>{player ? player.ratings.schuss : '-'}</td>
                  <td>{player ? player.ratings.pass : '-'}</td>
                  <td>{player ? player.ratings.dribbling : '-'}</td>
                  <td>{player ? player.ratings.tackling : '-'}</td>
                  <td>{player ? player.ratings.speed : '-'}</td>
                  <td>{player && player.isGoalkeeper ? player.ratings.gkReflexes || '5' : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Substitute Players List (Ersatzbank / Wechselspieler) for printing */}
        {getUnassignedPlayers().length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <h2 style={{ 
              fontSize: '13pt', 
              fontWeight: 600, 
              borderBottom: '1.5px solid #475569', 
              paddingBottom: '0.3rem', 
              marginBottom: '0.75rem', 
              color: '#1e293b' 
            }}>
              Wechselspieler (Ersatzbank)
            </h2>
            <table className="print-table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Nr.</th>
                  <th>Name</th>
                  <th style={{ width: '120px' }}>Rolle</th>
                  <th style={{ width: '50px' }}>Schuss</th>
                  <th style={{ width: '50px' }}>Pass</th>
                  <th style={{ width: '50px' }}>Dribbling</th>
                  <th style={{ width: '50px' }}>Tackling</th>
                  <th style={{ width: '50px' }}>Speed</th>
                  <th style={{ width: '50px' }}>Reflexe</th>
                </tr>
              </thead>
              <tbody>
                {getUnassignedPlayers().map((player) => (
                  <tr key={player.id}>
                    <td><strong>{player.number}</strong></td>
                    <td>{player.name}</td>
                    <td>{player.isGoalkeeper ? 'Ersatz-Torwart' : 'Feldspieler'}</td>
                    <td>{player.ratings.schuss}</td>
                    <td>{player.ratings.pass}</td>
                    <td>{player.ratings.dribbling}</td>
                    <td>{player.ratings.tackling}</td>
                    <td>{player.ratings.speed}</td>
                    <td>{player.isGoalkeeper ? player.ratings.gkReflexes || '5' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- NORMAL SCREEN BROWSER VIEW --- */}
      
      {/* 1. Header Toolbar (Lineup selector, active formation selector) */}
      <div className="glass-panel no-print" style={{
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Left: Active Lineup Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Aufstellung laden
            </label>
            <select
              value={activeLineup?.id || ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  createNewLineupState();
                } else {
                  loadLineupById(e.target.value);
                }
              }}
              className="glass-input"
              style={{ padding: '0.4rem 2rem 0.4rem 0.8rem', fontSize: '0.85rem', width: '200px' }}
            >
              <option value="">-- Neue Aufstellung --</option>
              {lineups.map((l) => (
                <option key={l.id} value={l.id} style={{ background: '#1f2937' }}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '2.5rem', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setLineupNameInput(activeLineup?.name || '');
                setShowSaveLineupModal(true);
              }}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              <Save size={16} /> Speichern
            </button>

            {activeLineup && (
              <button
                onClick={() => {
                  if (window.confirm(`Möchtest du die Aufstellung "${activeLineup.name}" wirklich löschen?`)) {
                    deleteLineupById(activeLineup.id);
                  }
                }}
                className="btn btn-secondary btn-icon"
                style={{ color: 'var(--danger)', height: '2.3rem', width: '2.3rem' }}
                title="Aufstellung löschen"
              >
                <Trash2 size={16} />
              </button>
            )}

            {activeLineup && (
              <button
                onClick={createNewLineupState}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                <RotateCcw size={16} /> Neu
              </button>
            )}
          </div>
        </div>

        {/* Right: Active Formation Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Spielsystem / Formation
          </label>
          <select
            value={activeFormation?.id || ''}
            onChange={(e) => setActiveFormationById(e.target.value)}
            className="glass-input"
            style={{ padding: '0.4rem 2rem 0.4rem 0.8rem', fontSize: '0.85rem', width: '220px' }}
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id} style={{ background: '#1f2937' }}>
                {f.name} {f.isCustom ? '(Custom)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Left and Right Panel Layout */}
      <div className="no-print lineup-grid">
        
        {/* LEFT PANEL: Players Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
                Spielerkader ({players.length} Spieler)
              </h2>

              <button
                onClick={autoAssignLineup}
                disabled={players.length === 0}
                className="btn btn-primary"
                style={{
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.8rem',
                  boxShadow: 'none',
                  opacity: players.length === 0 ? 0.5 : 1
                }}
                title="Bestmögliche Spieler automatisch auf Positionen verteilen"
              >
                <UserCheck size={14} /> Auto-Aufstellung
              </button>
            </div>

            {/* Players Table */}
            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '450px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <th className="no-print" style={{ padding: '0.5rem 0.15rem', width: '35px', textAlign: 'center' }} />
                    <th 
                      onClick={() => sortPlayersAuto('number')} 
                      style={{ 
                        padding: '0.5rem 0.25rem', 
                        width: '45px', 
                        cursor: 'pointer', 
                        userSelect: 'none',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      title="Automatisch nach Trikotnummer sortieren"
                    >
                      Nr. <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>↕</span>
                    </th>
                    <th 
                      onClick={() => sortPlayersAuto('name')} 
                      style={{ 
                        padding: '0.5rem 0.5rem', 
                        cursor: 'pointer', 
                        userSelect: 'none',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      title="Automatisch alphabetisch nach Name sortieren"
                    >
                      Name <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>↕</span>
                    </th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Torwart">TW</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Kapitän">K</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Torwart-Reflexe">R</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '55px', textAlign: 'center' }} title="Starker Fuß">Fuß</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Schuss">S</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Passen">P</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Dribbling">D</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Tackling">T</th>
                    <th style={{ padding: '0.5rem 0.25rem', width: '40px', textAlign: 'center' }} title="Geschwindigkeit">G</th>
                    <th style={{ padding: '0.5rem 0.5rem', width: '40px', textAlign: 'center' }} />
                  </tr>
                </thead>
                <tbody>
                  {players.length === 0 ? (
                    <tr>
                      <td colSpan={13} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Noch keine Spieler im Kader. Füge unten neue Spieler hinzu!
                      </td>
                    </tr>
                  ) : (
                    players.map((p, index) => {
                      const isAssigned = Object.values(currentAssignments).includes(p.id);
                      return (
                        <tr 
                          key={p.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '0.85rem',
                            opacity: isAssigned ? 0.65 : 1,
                            background: isAssigned ? 'rgba(16, 185, 129, 0.02)' : 'none'
                          }}
                        >
                          {/* Reorder Arrows */}
                          <td style={{ padding: '0.1rem', textAlign: 'center', verticalAlign: 'middle' }} className="no-print">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                              <button
                                type="button"
                                onClick={() => reorderPlayer(p.id, 'up')}
                                disabled={index === 0}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                                  opacity: index === 0 ? 0.2 : 0.7,
                                  padding: 0,
                                  lineHeight: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { if (index !== 0) e.currentTarget.style.color = 'var(--primary)'; }}
                                onMouseLeave={(e) => { if (index !== 0) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                title="Spieler nach oben verschieben"
                              >
                                <ChevronUp size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => reorderPlayer(p.id, 'down')}
                                disabled={index === players.length - 1}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: index === players.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                                  cursor: index === players.length - 1 ? 'not-allowed' : 'pointer',
                                  opacity: index === players.length - 1 ? 0.2 : 0.7,
                                  padding: 0,
                                  lineHeight: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { if (index !== players.length - 1) e.currentTarget.style.color = 'var(--primary)'; }}
                                onMouseLeave={(e) => { if (index !== players.length - 1) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                title="Spieler nach unten verschieben"
                              >
                                <ChevronDown size={15} />
                              </button>
                            </div>
                          </td>
                          {/* Number */}
                          <td style={{ padding: '0.25rem 0.25rem' }}>
                            <input
                              type="number"
                              key={p.id + '-' + p.number}
                              defaultValue={p.number}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid transparent',
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                width: '38px',
                                padding: '0.25rem 0',
                                textAlign: 'left',
                                fontSize: '0.85rem'
                              }}
                              onFocus={(e) => e.target.style.borderBottom = '1px solid var(--primary)'}
                              onBlur={async (e) => {
                                e.target.style.borderBottom = '1px solid transparent';
                                const val = Number(e.target.value);
                                if (val === p.number) return;
                                const success = await handleUpdateField(p, 'number', val);
                                if (!success) {
                                  e.target.value = String(p.number);
                                }
                              }}
                            />
                          </td>
                          {/* Name */}
                          <td style={{ padding: '0.25rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => handleUpdateField(p, 'name', e.target.value)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: '1px solid transparent',
                                  color: 'var(--text-primary)',
                                  fontWeight: 500,
                                  flex: 1,
                                  padding: '0.25rem 0',
                                  fontSize: '0.85rem'
                                }}
                                onFocus={(e) => e.target.style.borderBottom = '1px solid var(--primary)'}
                                onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
                              />
                              {isAssigned && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontStyle: 'italic', flexShrink: 0 }}>(Aufgestellt)</span>}
                            </div>
                          </td>
                          {/* Goalkeeper Toggle Icon */}
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleGK(p)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: p.isGoalkeeper ? '#ffffff' : 'var(--text-muted)',
                                transition: 'color 0.2s ease',
                              }}
                              title={p.isGoalkeeper ? 'Ist Torwart (Klicken zum Ändern)' : 'Als Torwart festlegen'}
                            >
                              <Hand size={18} fill={p.isGoalkeeper ? '#ffffff' : 'transparent'} />
                            </button>
                          </td>
                          {/* Captain Toggle Icon */}
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleCaptain(p)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: p.isCaptain ? '#eab308' : 'var(--text-muted)',
                                transition: 'color 0.2s ease',
                              }}
                              title={p.isCaptain ? 'Ist Kapitän (Klicken zum Ändern)' : 'Als Kapitän festlegen'}
                            >
                              <Crown size={18} fill={p.isCaptain ? '#eab308' : 'transparent'} />
                            </button>
                          </td>
                          {/* Torwart-Reflexe Column */}
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                            {p.isGoalkeeper ? (
                              <select
                                value={p.ratings.gkReflexes || 5}
                                onChange={(e) => handleUpdateRating(p, 'gkReflexes', Number(e.target.value))}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--accent)',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.85rem'
                                }}
                              >
                                {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                                  <option key={num} value={num} style={{ background: '#1f2937' }}>{num}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          {/* Preferred Foot Column */}
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                            <select
                              value={p.preferredFoot || 'rechts'}
                              onChange={(e) => handleUpdateField(p, 'preferredFoot', e.target.value)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                              }}
                            >
                              <option value="links" style={{ background: '#1f2937' }}>Links</option>
                              <option value="rechts" style={{ background: '#1f2937' }}>Rechts</option>
                              <option value="beide" style={{ background: '#1f2937' }}>Beide</option>
                            </select>
                          </td>
                          {/* Ratings: S P D T G */}
                          {['schuss', 'pass', 'dribbling', 'tackling', 'speed'].map((stat) => {
                            const val = p.ratings[stat as keyof typeof p.ratings] || 5;
                            return (
                              <td key={stat} style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                                <select
                                  value={val}
                                  onChange={(e) => handleUpdateRating(p, stat, Number(e.target.value))}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                >
                                  {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                                    <option key={num} value={num} style={{ background: '#1f2937' }}>{num}</option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}
                          {/* Delete Player */}
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                if (window.confirm(`Spieler "${p.name}" wirklich löschen?`)) {
                                  deletePlayerById(p.id);
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              className="btn-danger-hover"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick-Add Player Form */}
            <form onSubmit={handleAddPlayer} className="glass-panel" style={{
              padding: '1rem',
              borderStyle: 'dashed',
              borderWidth: '1.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserPlus size={14} style={{ color: 'var(--primary)' }} /> Spieler hinzufügen
              </h4>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Nr."
                  value={newPlayerNumber}
                  onChange={(e) => setNewPlayerNumber(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '55px' }}
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="Spielername"
                  required
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  style={{ flex: 1 }}
                  className="glass-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                {/* Torwart Selector */}
                <button
                  type="button"
                  onClick={() => setNewPlayerIsGK(!newPlayerIsGK)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: newPlayerIsGK ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                    fontWeight: 500,
                    fontSize: '0.8rem'
                  }}
                >
                  <Hand size={16} fill={newPlayerIsGK ? '#ffffff' : 'transparent'} />
                  <span>{newPlayerIsGK ? 'Torwart (Aktiv)' : 'Torwart'}</span>
                </button>

                {/* Preferred Foot Selector Segment */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ color: 'var(--text-secondary)', marginRight: '0.2rem' }}>Starker Fuß:</span>
                  {(['links', 'rechts', 'beide'] as const).map((foot) => (
                    <button
                      key={foot}
                      type="button"
                      onClick={() => setNewPlayerFoot(foot)}
                      style={{
                        background: newPlayerFoot === foot ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid ' + (newPlayerFoot === foot ? 'var(--primary)' : 'var(--border-color)'),
                        color: newPlayerFoot === foot ? '#ffffff' : 'var(--text-muted)',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'capitalize'
                      }}
                    >
                      {foot === 'beide' ? 'Beide' : (foot === 'links' ? 'Links' : 'Rechts')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider for stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                <div>
                  <label style={{ display: 'block' }}>Schuss: {newPlayerS}</label>
                  <input type="range" min="1" max="10" value={newPlayerS} onChange={(e) => setNewPlayerS(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block' }}>Pass: {newPlayerP}</label>
                  <input type="range" min="1" max="10" value={newPlayerP} onChange={(e) => setNewPlayerP(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block' }}>Dribbl: {newPlayerD}</label>
                  <input type="range" min="1" max="10" value={newPlayerD} onChange={(e) => setNewPlayerD(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block' }}>Tackl: {newPlayerT}</label>
                  <input type="range" min="1" max="10" value={newPlayerT} onChange={(e) => setNewPlayerT(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block' }}>Speed: {newPlayerG}</label>
                  <input type="range" min="1" max="10" value={newPlayerG} onChange={(e) => setNewPlayerG(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                {newPlayerIsGK && (
                  <div>
                    <label style={{ display: 'block' }}>Reflexe: {newPlayerGkReflexes}</label>
                    <input type="range" min="1" max="10" value={newPlayerGkReflexes} onChange={(e) => setNewPlayerGkReflexes(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.25rem' }}
              >
                <Plus size={14} /> Spieler speichern
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: Football Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Spielfeld</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                System: <strong>{activeFormation?.name.split(':')[1]?.trim() || activeFormation?.name}</strong>
              </span>
            </div>

            {/* The Football Pitch Graphic */}
            <div className="football-pitch">
              {/* Markings */}
              <div className="pitch-lines">
                <div className="pitch-center-circle" />
                <div className="pitch-penalty-top" />
                <div className="pitch-penalty-bottom" />
                <div className="pitch-goal-top" />
                <div className="pitch-goal-bottom" />
              </div>

              {/* Zones labels background indicators */}
              <div className="pitch-zone pitch-zone-sturm">Sturm</div>
              <div className="pitch-zone pitch-zone-mittelfeld">Mittelfeld</div>
              <div className="pitch-zone pitch-zone-abwehr">Abwehr</div>
              <div className="pitch-zone pitch-zone-torwart">Torwart</div>

              {/* Placed Player Pins */}
              {activeFormation?.positions.map((pos) => {
                const player = getAssignedPlayer(pos.id);
                
                if (player) {
                  return (
                    <div
                      key={pos.id}
                      className={`player-dot ${pos.zone === 'goalkeeper' ? 'gk' : ''}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      onClick={() => assignPlayerToPosition(pos.id, null)} // click to remove player from position
                      title="Klicke zum Entfernen"
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
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                          zIndex: 15
                        }}>
                          <Crown size={10} fill="#eab308" />
                        </div>
                      )}
                      
                      <div className="player-label">
                        {player.name}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={pos.id}>
                      <div 
                        className="player-dot-empty"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        onClick={() => {
                          if (activeSelectPositionId === pos.id) {
                            setActiveSelectPositionId(null);
                          } else {
                            setActiveSelectPositionId(pos.id);
                          }
                        }}
                      >
                        +
                        <div className="player-label" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.6)' }}>
                          {pos.zone === 'goalkeeper' ? 'Torwart' : 'Frei'}
                        </div>
                      </div>

                      {/* Dropdown list to pick player */}
                      {activeSelectPositionId === pos.id && (
                        <div className="glass-panel-glow" style={{
                          position: 'absolute',
                          left: `${pos.x}%`,
                          top: `${pos.y + 7}%`,
                          transform: 'translateX(-50%)',
                          zIndex: 100,
                          minWidth: '150px',
                          maxWidth: '220px',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          padding: '0.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          boxShadow: 'var(--shadow-lg)'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                            Spieler auswählen:
                          </div>
                          {getUnassignedPlayers().length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>
                              Keine freien Spieler vorhanden.
                            </div>
                          ) : (
                            getUnassignedPlayers().map((freePlayer) => (
                              <button
                                key={freePlayer.id}
                                onClick={() => {
                                  assignPlayerToPosition(pos.id, freePlayer.id);
                                  setActiveSelectPositionId(null);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-primary)',
                                  textAlign: 'left',
                                  padding: '0.35rem 0.5rem',
                                  fontSize: '0.8rem',
                                  borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer',
                                  width: '100%',
                                }}
                                className="btn-secondary"
                              >
                                <strong>{freePlayer.number}</strong> {freePlayer.name} {freePlayer.isGoalkeeper ? '(TW)' : ''}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>

            {/* Bottom Actions of the Pitch: Print Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={handlePrint}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <Printer size={16} /> Drucken / PDF exportieren
              </button>
            </div>

          </div>

          {/* TEAM STRENGTH ANALYSIS CARD */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} style={{ color: 'var(--primary)' }} />
                Mannschaftsanalyse
              </h3>
              <div style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.2rem 0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }} title="Durchschnittliche Gesamtstärke">
                <span>GESAMT:</span>
                <span style={{ fontSize: '0.95rem' }}>{analysis.overall > 0 ? analysis.overall.toFixed(1) : '-'}</span>
              </div>
            </div>

            {/* Ratings Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Category: Torwart */}
              {renderStrengthRow('Torwart', analysis.gk, '#3b82f6', 'rgba(59, 130, 246, 0.1)', <Hand size={14} fill="#3b82f6" />)}
              
              {/* Category: Abwehr */}
              {renderStrengthRow('Abwehr', analysis.def, '#10b981', 'rgba(16, 185, 129, 0.1)', <Shield size={14} />)}
              
              {/* Category: Mittelfeld */}
              {renderStrengthRow('Mittelfeld', analysis.mid, '#8b5cf6', 'rgba(139, 92, 246, 0.1)', <Activity size={14} />)}
              
              {/* Category: Sturm */}
              {renderStrengthRow('Sturm', analysis.fwd, '#f97316', 'rgba(249, 115, 22, 0.1)', <Zap size={14} fill="#f97316" />)}
            </div>
          </div>

        </div>

      </div>

      {/* Save Lineup Overlay Modal */}
      {showSaveLineupModal && (
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
            onSubmit={handleSaveLineupSubmit} 
            className="glass-panel-glow" 
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              Aufstellung speichern
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Titel der Aufstellung
              </label>
              <input
                type="text"
                required
                value={lineupNameInput}
                onChange={(e) => setLineupNameInput(e.target.value)}
                placeholder="z.B. Hinrunde gegen TSV"
                className="glass-input"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSaveLineupModal(false);
                }}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
