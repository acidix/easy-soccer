import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Formation, Position } from '../services/dbService';
import { Plus, Save, Trash2, Sliders } from 'lucide-react';

export const FormationTab: React.FC = () => {
  const {
    formations,
    activeFormation,
    saveOrUpdateFormation,
    deleteFormationById,
    setActiveFormationById
  } = useApp();

  const [sliderPlayerCount, setSliderPlayerCount] = useState(7); // default to 7-a-side
  const [formationName, setFormationName] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  
  // Track currently dragged position
  const [draggedPosId, setDraggedPosId] = useState<string | null>(null);
  
  const pitchRef = useRef<HTMLDivElement>(null);

  // Initialize/Sync editing positions when activeFormation changes
  useEffect(() => {
    if (activeFormation) {
      setSliderPlayerCount(activeFormation.playerCount);
      setFormationName(activeFormation.isCustom ? activeFormation.name : `Kopie von ${activeFormation.name}`);
      setPositions(activeFormation.positions);
    }
  }, [activeFormation]);

  // Adjust number of position nodes when player count slider changes
  const handlePlayerCountChange = (newCount: number) => {
    setSliderPlayerCount(newCount);
    
    // Adjust position list to match newCount (which includes Goalkeeper)
    let updatedPositions = [...positions];
    
    if (updatedPositions.length < newCount) {
      // Add positions
      const toAdd = newCount - updatedPositions.length;
      for (let i = 0; i < toAdd; i++) {
        // Place new players in midfield or default coordinates
        const id = `custom-p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        // Alternate placements
        const offset = (i * 15) % 40;
        updatedPositions.push({
          id,
          x: 30 + offset,
          y: 45 + (i % 2 === 0 ? -5 : 5),
          zone: 'midfield'
        });
      }
    } else if (updatedPositions.length > newCount) {
      // Remove positions (keep goalkeeper and oldest outfielders)
      const gk = updatedPositions.find((p) => p.zone === 'goalkeeper');
      const outfielders = updatedPositions.filter((p) => p.zone !== 'goalkeeper');
      const neededOutfielders = newCount - (gk ? 1 : 0);
      
      const slicedOutfielders = outfielders.slice(0, neededOutfielders);
      updatedPositions = gk ? [gk, ...slicedOutfielders] : slicedOutfielders;
    }

    // Ensure there is exactly 1 Goalkeeper
    const gkIndex = updatedPositions.findIndex((p) => p.zone === 'goalkeeper');
    if (gkIndex === -1 && updatedPositions.length > 0) {
      updatedPositions[0] = {
        ...updatedPositions[0],
        x: 50,
        y: 88,
        zone: 'goalkeeper'
      };
    }

    setPositions(updatedPositions);
  };

  // Drag handlers
  const handleDragStart = (id: string, _e: React.MouseEvent | React.TouchEvent) => {
    // Goalkeeper is fixed at 50, 88 to avoid sliding keeper away
    const pos = positions.find((p) => p.id === id);
    if (pos?.zone === 'goalkeeper') return;
    
    setDraggedPosId(id);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!draggedPosId || !pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    
    // Get mouse/touch coordinates
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate percentage coordinates (0 to 100) inside pitch
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Boundary constraints (pad slightly so dots don't overflow the lines)
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(85, y)); // Keep outfielders above goalkeeper line (88)

    // Determine zone based on vertical y percentage
    let zone: Position['zone'] = 'midfield';
    if (y < 33.33) {
      zone = 'forward';
    } else if (y >= 66.66) {
      zone = 'defense';
    }

    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === draggedPosId
          ? { ...pos, x: Math.round(x), y: Math.round(y), zone }
          : pos
      )
    );
  };

  const handleDragEnd = () => {
    setDraggedPosId(null);
  };

  // Attach global mouse listeners for smooth drag-and-drop outside element
  useEffect(() => {
    if (draggedPosId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [draggedPosId]);

  // Reset to create a brand new custom formation
  const handleNewFormationClick = () => {
    const initialPositions: Position[] = [
      { id: 'gk', x: 50, y: 88, zone: 'goalkeeper' },
      { id: 'p2', x: 30, y: 70, zone: 'defense' },
      { id: 'p3', x: 70, y: 70, zone: 'defense' },
      { id: 'p4', x: 50, y: 48, zone: 'midfield' },
      { id: 'p5', x: 20, y: 48, zone: 'midfield' },
      { id: 'p6', x: 80, y: 48, zone: 'midfield' },
      { id: 'p7', x: 50, y: 22, zone: 'forward' }
    ];
    
    setSliderPlayerCount(7);
    setFormationName('Meine neue 2-3-1');
    setPositions(initialPositions);
    setActiveFormationById(''); // deselect active list item
  };

  // Save/Update Formation in DB
  const handleSaveFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationName.trim()) return;

    const newFormation: Formation = {
      id: activeFormation?.isCustom ? activeFormation.id : `formation-${Date.now()}`,
      name: formationName.trim(),
      playerCount: sliderPlayerCount,
      positions,
      isCustom: true
    };

    await saveOrUpdateFormation(newFormation);
  };

  // Delete Custom Formation
  const handleDeleteFormation = async () => {
    if (!activeFormation || !activeFormation.isCustom) return;
    if (window.confirm(`Möchtest du die Formation "${activeFormation.name}" wirklich löschen?`)) {
      await deleteFormationById(activeFormation.id);
    }
  };

  // Calculate Zone Code dynamically (e.g. counts players in Defense, Midfield, Sturm)
  const calculateFormationCode = (): string => {
    let defenseCount = 0;
    let midfieldCount = 0;
    let forwardCount = 0;

    positions.forEach((pos) => {
      if (pos.zone === 'defense') defenseCount++;
      if (pos.zone === 'midfield') midfieldCount++;
      if (pos.zone === 'forward') forwardCount++;
    });

    return `${defenseCount}-${midfieldCount}-${forwardCount}`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
      
      {/* LEFT PANEL: Controls (Slider, Name, Add/Save) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Loader list */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Bestehende Formation laden / als Vorlage nutzen:
          </label>
          <select
            value={activeFormation?.id || ''}
            onChange={(e) => setActiveFormationById(e.target.value)}
            className="glass-input"
            style={{ padding: '0.5rem 2rem 0.5rem 1rem' }}
          >
            <option value="">-- Neue leere Formation --</option>
            {formations.map((f) => (
              <option key={f.id} value={f.id} style={{ background: '#1f2937' }}>
                {f.name} {f.isCustom ? '(Custom)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Formation Configurator Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
            Formations-Designer
          </h2>

          <form onSubmit={handleSaveFormation} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Slider for player count: 2 to 11 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Anzahl der Spieler:</span>
                <strong style={{ color: 'var(--primary)' }}>{sliderPlayerCount} Spieler</strong>
              </div>
              <input
                type="range"
                min="2"
                max="11"
                value={sliderPlayerCount}
                onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Regler verschieben, um Spieler im System hinzuzufügen/zu entfernen (inkl. Torwart).
              </span>
            </div>

            {/* Formation Title Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Name der Formation (Titel)
              </label>
              <input
                type="text"
                required
                value={formationName}
                onChange={(e) => setFormationName(e.target.value)}
                placeholder="z.B. Mein 2-3-1 Tannenbaum"
                className="glass-input"
              />
            </div>

            {/* Actions: Save, Delete, New */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '130px' }}
              >
                <Save size={18} />
                Speichern
              </button>

              <button
                type="button"
                onClick={handleNewFormationClick}
                className="btn btn-secondary"
                title="Neue leere Formation erstellen"
              >
                <Plus size={18} /> Neu
              </button>

              {activeFormation && activeFormation.isCustom && (
                <button
                  type="button"
                  onClick={handleDeleteFormation}
                  className="btn btn-secondary btn-icon"
                  style={{ color: 'var(--danger)' }}
                  title="Formation löschen"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Informational Hint panel */}
        <div className="glass-panel" style={{ padding: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>💡 Anleitung zur Bedienung:</h4>
          <p>1. Nutze den Regler, um die Anzahl der Feldspieler zu bestimmen.</p>
          <p>2. Ziehe (Drag-and-Drop) die blauen Kreise auf dem Spielfeld frei auf deine gewünschten Positionen.</p>
          <p>3. Die Zonen (Abwehr, Mittelfeld, Sturm) werden automatisch erkannt und unten als Formations-Code (z.B. "2-3-1") angezeigt.</p>
          <p>4. Klicke auf <strong>Speichern</strong>, um deine Formation dauerhaft zu sichern.</p>
        </div>

      </div>

      {/* RIGHT PANEL: The Interactive Zone-based Field */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Taktiktafel</h3>

        {/* Pitch with Dashed Lines */}
        <div className="football-pitch" ref={pitchRef}>
          <div className="pitch-lines">
            <div className="pitch-center-circle" />
            <div className="pitch-penalty-top" />
            <div className="pitch-penalty-bottom" />
            <div className="pitch-goal-top" />
            <div className="pitch-goal-bottom" />
          </div>

          {/* Dash Zones Overlay */}
          <div className="pitch-zone pitch-zone-sturm">Sturm (Z/3)</div>
          <div className="pitch-zone pitch-zone-mittelfeld">Mittelfeld (Z/2)</div>
          <div className="pitch-zone pitch-zone-abwehr">Abwehr (Z/1)</div>
          <div className="pitch-zone pitch-zone-torwart">Torwart</div>

          {/* Position Circles (Draggable Outfielders, Fixed Goalkeeper) */}
          {positions.map((pos) => {
            const isGK = pos.zone === 'goalkeeper';
            
            return (
              <div
                key={pos.id}
                className={`player-dot ${isGK ? 'gk' : ''}`}
                style={{ 
                  left: `${pos.x}%`, 
                  top: `${pos.y}%`,
                  cursor: isGK ? 'default' : (draggedPosId === pos.id ? 'grabbing' : 'grab'),
                  border: draggedPosId === pos.id ? '3px solid var(--primary)' : '3px solid white',
                  transform: draggedPosId === pos.id ? 'translate(-50%, -50%) scale(1.15)' : 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => handleDragStart(pos.id, e)}
                onTouchStart={(e) => handleDragStart(pos.id, e)}
              >
                {isGK ? 'TW' : '•'}
                
                <div className="player-label" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.65)' }}>
                  {isGK ? 'Torwart' : `${pos.x}%, ${pos.y}%`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom indicator of dynamic formation code: matches "2-3-1" sketch label exactly! */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          padding: '0.8rem 1.2rem',
          borderRadius: 'var(--radius-sm)',
          marginTop: '0.5rem'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Berechnetes System:
          </span>
          <strong style={{ 
            fontSize: '1.4rem', 
            fontWeight: 700, 
            color: 'var(--primary)',
            letterSpacing: '0.05em'
          }}>
            {calculateFormationCode()}
          </strong>
        </div>

      </div>

    </div>
  );
};
