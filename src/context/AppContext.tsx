import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider, firebaseAvailable } from '../services/firebase';
import type {
  Team,
  Player,
  Formation,
  Lineup,
  Position
} from '../services/dbService';
import {
  getTeams,
  saveTeam as dbSaveTeam,
  deleteTeam as dbDeleteTeam,
  getPlayers,
  savePlayer as dbSavePlayer,
  deletePlayer as dbDeletePlayer,
  getFormations,
  saveFormation as dbSaveFormation,
  deleteFormation as dbDeleteFormation,
  getLineups,
  saveLineup as dbSaveLineup,
  deleteLineup as dbDeleteLineup
} from '../services/dbService';

// Built-in standard formations
export const BUILT_IN_FORMATIONS: Formation[] = [
  {
    id: 'builtin-5-1-2-1',
    name: '5er: 1-2-1 (Diamant)',
    playerCount: 5,
    isCustom: false,
    positions: [
      { id: 'p1', x: 50, y: 88, zone: 'goalkeeper' },
      { id: 'p2', x: 50, y: 68, zone: 'defense' },
      { id: 'p3', x: 20, y: 46, zone: 'midfield' },
      { id: 'p4', x: 80, y: 46, zone: 'midfield' },
      { id: 'p5', x: 50, y: 22, zone: 'forward' }
    ]
  },
  {
    id: 'builtin-7-2-3-1',
    name: '7er: 2-3-1 (Standard)',
    playerCount: 7,
    isCustom: false,
    positions: [
      { id: 'p1', x: 50, y: 88, zone: 'goalkeeper' },
      { id: 'p2', x: 25, y: 68, zone: 'defense' },
      { id: 'p3', x: 75, y: 68, zone: 'defense' },
      { id: 'p4', x: 15, y: 46, zone: 'midfield' },
      { id: 'p5', x: 50, y: 46, zone: 'midfield' },
      { id: 'p6', x: 85, y: 46, zone: 'midfield' },
      { id: 'p7', x: 50, y: 22, zone: 'forward' }
    ]
  },
  {
    id: 'builtin-7-3-2-1',
    name: '7er: 3-2-1 (Defensiv)',
    playerCount: 7,
    isCustom: false,
    positions: [
      { id: 'p1', x: 50, y: 88, zone: 'goalkeeper' },
      { id: 'p2', x: 20, y: 68, zone: 'defense' },
      { id: 'p3', x: 50, y: 70, zone: 'defense' },
      { id: 'p4', x: 80, y: 68, zone: 'defense' },
      { id: 'p5', x: 30, y: 46, zone: 'midfield' },
      { id: 'p6', x: 70, y: 46, zone: 'midfield' },
      { id: 'p7', x: 50, y: 22, zone: 'forward' }
    ]
  },
  {
    id: 'builtin-9-3-3-2',
    name: '9er: 3-3-2 (Ausgewogen)',
    playerCount: 9,
    isCustom: false,
    positions: [
      { id: 'p1', x: 50, y: 88, zone: 'goalkeeper' },
      { id: 'p2', x: 20, y: 68, zone: 'defense' },
      { id: 'p3', x: 50, y: 70, zone: 'defense' },
      { id: 'p4', x: 80, y: 68, zone: 'defense' },
      { id: 'p5', x: 20, y: 46, zone: 'midfield' },
      { id: 'p6', x: 50, y: 46, zone: 'midfield' },
      { id: 'p7', x: 80, y: 46, zone: 'midfield' },
      { id: 'p8', x: 30, y: 22, zone: 'forward' },
      { id: 'p9', x: 70, y: 22, zone: 'forward' }
    ]
  },
  {
    id: 'builtin-11-4-4-2',
    name: '11er: 4-4-2 (Klassisch)',
    playerCount: 11,
    isCustom: false,
    positions: [
      { id: 'p1', x: 50, y: 88, zone: 'goalkeeper' },
      { id: 'p2', x: 15, y: 68, zone: 'defense' },
      { id: 'p3', x: 38, y: 68, zone: 'defense' },
      { id: 'p4', x: 62, y: 68, zone: 'defense' },
      { id: 'p5', x: 85, y: 68, zone: 'defense' },
      { id: 'p6', x: 15, y: 46, zone: 'midfield' },
      { id: 'p7', x: 38, y: 46, zone: 'midfield' },
      { id: 'p8', x: 62, y: 46, zone: 'midfield' },
      { id: 'p9', x: 85, y: 46, zone: 'midfield' },
      { id: 'p10', x: 35, y: 22, zone: 'forward' },
      { id: 'p11', x: 65, y: 22, zone: 'forward' }
    ]
  }
];

interface AppContextType {
  user: User | null;
  loadingAuth: boolean;
  firebaseEnabled: boolean;
  teams: Team[];
  activeTeam: Team | null;
  players: Player[];
  formations: Formation[];
  lineups: Lineup[];
  activeLineup: Lineup | null;
  activeFormation: Formation | null;
  currentAssignments: Record<string, string>;
  
  // Actions
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  setActiveTeam: (team: Team | null) => void;
  createTeam: (name: string) => Promise<Team>;
  deleteActiveTeam: () => Promise<void>;
  
  saveOrUpdatePlayer: (player: Omit<Player, 'teamId'>) => Promise<void>;
  deletePlayerById: (playerId: string) => Promise<void>;
  reorderPlayer: (playerId: string, direction: 'up' | 'down') => Promise<void>;
  sortPlayersAuto: (sortBy: 'name' | 'number') => Promise<void>;
  
  saveOrUpdateFormation: (formation: Formation) => Promise<void>;
  deleteFormationById: (formationId: string) => Promise<void>;
  setActiveFormationById: (formationId: string) => void;
  
  saveOrUpdateLineup: (name: string, assignments: Record<string, string>) => Promise<Lineup>;
  deleteLineupById: (lineupId: string) => Promise<void>;
  loadLineupById: (lineupId: string) => void;
  createNewLineupState: () => void;
  
  assignPlayerToPosition: (positionId: string, playerId: string | null) => void;
  autoAssignLineup: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [customFormations, setCustomFormations] = useState<Formation[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  
  // Active editing/display states
  const [activeLineup, setActiveLineup] = useState<Lineup | null>(null);
  const [activeFormation, setActiveFormation] = useState<Formation | null>(BUILT_IN_FORMATIONS[1]); // Default to 2-3-1
  const [currentAssignments, setCurrentAssignments] = useState<Record<string, string>>({}); // positionId -> playerId

  const firebaseEnabled = firebaseAvailable;

  // Listen to Auth State
  useEffect(() => {
    if (firebaseAvailable && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoadingAuth(false);
      });
      return unsubscribe;
    } else {
      setLoadingAuth(false);
    }
  }, []);

  // Fetch all initial data when user changes or on load (Local mode)
  useEffect(() => {
    const loadInitialData = async () => {
      const uId = user ? user.uid : null;
      
      // Load Teams
      const fetchedTeams = await getTeams(uId);
      setTeams(fetchedTeams);
      
      // Set Active Team
      if (fetchedTeams.length > 0) {
        setActiveTeamState(fetchedTeams[0]);
      } else {
        setActiveTeamState(null);
        setPlayers([]);
        setLineups([]);
        setActiveLineup(null);
      }

      // Load Formations
      const fetchedFormations = await getFormations(uId);
      setCustomFormations(fetchedFormations);
    };

    loadInitialData();
  }, [user]);

  // Load Players and Lineups when activeTeam changes
  useEffect(() => {
    const loadTeamDetails = async () => {
      if (!activeTeam) {
        setPlayers([]);
        setLineups([]);
        setActiveLineup(null);
        setCurrentAssignments({});
        return;
      }

      const uId = user ? user.uid : null;
      
      const fetchedPlayers = await getPlayers(uId, activeTeam.id);
      const sorted = [...fetchedPlayers].sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? a.sortOrder : fetchedPlayers.indexOf(a);
        const orderB = b.sortOrder !== undefined ? b.sortOrder : fetchedPlayers.indexOf(b);
        return orderA - orderB;
      });
      setPlayers(sorted);

      const fetchedLineups = await getLineups(uId, activeTeam.id);
      setLineups(fetchedLineups);

      // Reset lineup assignment state
      setActiveLineup(null);
      setCurrentAssignments({});
    };

    loadTeamDetails();
  }, [activeTeam, user]);

  // Sync activeLineup with assignments
  useEffect(() => {
    if (activeLineup) {
      setCurrentAssignments(activeLineup.assignments || {});
      const form = [...BUILT_IN_FORMATIONS, ...customFormations].find(
        (f) => f.id === activeLineup.formationId
      );
      if (form) {
        setActiveFormation(form);
      }
    } else {
      setCurrentAssignments({});
    }
  }, [activeLineup, customFormations]);

  // Combine built-in and custom formations
  const formations = [...BUILT_IN_FORMATIONS, ...customFormations];

  // Auth Functions
  const loginWithGoogle = async () => {
    if (firebaseAvailable && auth && googleProvider) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  };

  const logout = async () => {
    if (firebaseAvailable && auth) {
      try {
        await signOut(auth);
        setActiveTeamState(null);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  // Team Functions
  const setActiveTeam = (team: Team | null) => {
    setActiveTeamState(team);
  };

  const createTeam = async (name: string): Promise<Team> => {
    const uId = user ? user.uid : null;
    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: Date.now()
    };
    await dbSaveTeam(uId, newTeam);
    setTeams((prev) => [newTeam, ...prev]);
    setActiveTeamState(newTeam);
    return newTeam;
  };

  const deleteActiveTeam = async () => {
    if (!activeTeam) return;
    const uId = user ? user.uid : null;
    await dbDeleteTeam(uId, activeTeam.id);
    
    const remainingTeams = teams.filter((t) => t.id !== activeTeam.id);
    setTeams(remainingTeams);
    if (remainingTeams.length > 0) {
      setActiveTeamState(remainingTeams[0]);
    } else {
      setActiveTeamState(null);
    }
  };

  // Player Functions
  const saveOrUpdatePlayer = async (playerInput: Omit<Player, 'teamId'>) => {
    if (!activeTeam) return;
    const uId = user ? user.uid : null;

    const existingPlayer = players.find((p) => p.id === playerInput.id);
    const defaultSortOrder = existingPlayer 
      ? (existingPlayer.sortOrder !== undefined ? existingPlayer.sortOrder : players.indexOf(existingPlayer))
      : (players.length > 0 ? Math.max(...players.map(p => p.sortOrder ?? 0)) + 1 : 0);

    const player: Player = {
      ...playerInput,
      sortOrder: (playerInput as any).sortOrder !== undefined 
        ? (playerInput as any).sortOrder 
        : defaultSortOrder,
      teamId: activeTeam.id
    };
    await dbSavePlayer(uId, player);
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.id === player.id);
      let updated = [...prev];
      if (idx >= 0) {
        updated[idx] = player;
      } else {
        updated.push(player);
      }
      return updated.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? a.sortOrder : updated.indexOf(a);
        const orderB = b.sortOrder !== undefined ? b.sortOrder : updated.indexOf(b);
        return orderA - orderB;
      });
    });
  };

  const deletePlayerById = async (playerId: string) => {
    if (!activeTeam) return;
    const uId = user ? user.uid : null;
    await dbDeletePlayer(uId, activeTeam.id, playerId);
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));

    // Remove from active assignments if assigned
    setCurrentAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((posId) => {
        if (next[posId] === playerId) {
          delete next[posId];
        }
      });
      if (activeLineup) {
        setActiveLineup({
          ...activeLineup,
          assignments: next
        });
      }
      return next;
    });
  };

  const reorderPlayer = async (playerId: string, direction: 'up' | 'down') => {
    const index = players.findIndex(p => p.id === playerId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === players.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    const reorderedPlayers = players.map((p, idx) => ({
      ...p,
      sortOrder: p.sortOrder !== undefined ? p.sortOrder : idx
    }));

    const temp = reorderedPlayers[index];
    reorderedPlayers[index] = reorderedPlayers[newIndex];
    reorderedPlayers[newIndex] = temp;

    const updatedPlayers = reorderedPlayers.map((p, idx) => ({
      ...p,
      sortOrder: idx
    }));

    const uId = user ? user.uid : null;
    const playerA = updatedPlayers[index];
    const playerB = updatedPlayers[newIndex];

    await dbSavePlayer(uId, playerA);
    await dbSavePlayer(uId, playerB);

    setPlayers(updatedPlayers);
  };

  const sortPlayersAuto = async (sortBy: 'name' | 'number') => {
    const sorted = [...players].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        return a.number - b.number;
      }
    });

    const updatedPlayers = sorted.map((p, idx) => ({
      ...p,
      sortOrder: idx
    }));

    const uId = user ? user.uid : null;
    const promises = updatedPlayers.map(p => dbSavePlayer(uId, p));
    await Promise.all(promises);

    setPlayers(updatedPlayers);
  };


  // Formation Functions
  const saveOrUpdateFormation = async (formation: Formation) => {
    const uId = user ? user.uid : null;
    const newFormation = { ...formation, isCustom: true };
    await dbSaveFormation(uId, newFormation);
    setCustomFormations((prev) => {
      const idx = prev.findIndex((f) => f.id === formation.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newFormation;
        return updated;
      } else {
        return [...prev, newFormation];
      }
    });
    setActiveFormation(newFormation);
  };

  const deleteFormationById = async (formationId: string) => {
    const uId = user ? user.uid : null;
    await dbDeleteFormation(uId, formationId);
    setCustomFormations((prev) => prev.filter((f) => f.id !== formationId));
    if (activeFormation?.id === formationId) {
      setActiveFormation(BUILT_IN_FORMATIONS[1]); // Reset to default 2-3-1
    }
  };

  const setActiveFormationById = (formationId: string) => {
    const form = formations.find((f) => f.id === formationId);
    if (form) {
      setActiveFormation(form);
      // Filter out invalid position IDs from assignments
      const nextAssignments: Record<string, string> = {};
      form.positions.forEach((pos) => {
        if (currentAssignments[pos.id]) {
          nextAssignments[pos.id] = currentAssignments[pos.id];
        }
      });
      
      setCurrentAssignments(nextAssignments);

      // Update activeLineup formationId so they don't get out of sync
      if (activeLineup) {
        setActiveLineup({
          ...activeLineup,
          formationId: formationId,
          assignments: nextAssignments
        });
      }
    }
  };

  // Lineup Functions
  const createNewLineupState = () => {
    setActiveLineup(null);
    setCurrentAssignments({});
  };

  const saveOrUpdateLineup = async (name: string, assignments: Record<string, string>): Promise<Lineup> => {
    if (!activeTeam || !activeFormation) throw new Error('No active team or formation selected');
    
    const uId = user ? user.uid : null;
    const isNew = !activeLineup;
    const lineup: Lineup = {
      id: isNew ? `lineup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : activeLineup.id,
      teamId: activeTeam.id,
      name,
      formationId: activeFormation.id,
      assignments,
      createdAt: isNew ? Date.now() : activeLineup.createdAt
    };

    await dbSaveLineup(uId, lineup);

    setLineups((prev) => {
      const idx = prev.findIndex((l) => l.id === lineup.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = lineup;
        return updated;
      } else {
        return [lineup, ...prev];
      }
    });

    setActiveLineup(lineup);
    return lineup;
  };

  const deleteLineupById = async (lineupId: string) => {
    if (!activeTeam) return;
    const uId = user ? user.uid : null;
    await dbDeleteLineup(uId, activeTeam.id, lineupId);
    setLineups((prev) => prev.filter((l) => l.id !== lineupId));
    if (activeLineup?.id === lineupId) {
      createNewLineupState();
    }
  };

  const loadLineupById = (lineupId: string) => {
    const found = lineups.find((l) => l.id === lineupId);
    if (found) {
      setActiveLineup(found);
    }
  };

  // Direct manual assignment of a player to a specific position
  const assignPlayerToPosition = (positionId: string, playerId: string | null) => {
    setCurrentAssignments((prev) => {
      const next = { ...prev };
      
      // If player is assigned elsewhere on the field, remove that assignment first! (A player cannot be in two spots)
      if (playerId) {
        Object.keys(next).forEach((posId) => {
          if (next[posId] === playerId) {
            delete next[posId];
          }
        });
        next[positionId] = playerId;
      } else {
        delete next[positionId];
      }
      
      if (activeLineup) {
        setActiveLineup({
          ...activeLineup,
          assignments: next
        });
      }
      
      return next;
    });
  };

  // GREEDY INTELLECTUAL AUTO-ASSIGNMENT ALGORITHM
  const autoAssignLineup = () => {
    if (!activeFormation || players.length === 0) return;

    const assignedPlayers = new Set<string>();
    const assignmentsResult: Record<string, string> = {};

    // Sort positions by specialized roles: Goalkeeper first, Forwards next, Defenders, then Midfielders
    const positionPriority = [...activeFormation.positions].sort((a, b) => {
      const order = { goalkeeper: 0, forward: 1, defense: 2, midfield: 3 };
      return order[a.zone] - order[b.zone];
    });

    // Helper to calculate a player's suitability score for a position zone
    const calculateSuitability = (player: Player, pos: Position): number => {
      const ratings = player.ratings;
      const isGK = player.isGoalkeeper;
      const zone = pos.zone;

      if (zone === 'goalkeeper') {
        // Goalkeeper: reflex-heavy. Massive bonus if marked isGoalkeeper
        const reflex = ratings.gkReflexes || 1;
        const fallback = (ratings.tackling + ratings.pass) / 2;
        const gkScore = reflex * 1.8 + fallback * 0.4;
        return gkScore + (isGK ? 100 : 0);
      }

      // Outfield: penalty if isGoalkeeper to avoid placing keepers on field
      const gkPenalty = isGK ? -50 : 0;

      let baseScore = 0;
      switch (zone) {
        case 'defense':
          // Defender: Tackling & Speed are critical
          baseScore = ratings.tackling * 1.6 + ratings.speed * 1.0 + ratings.pass * 0.6 + gkPenalty;
          break;
        case 'forward':
          // Striker: Shooting & Speed are critical
          baseScore = ratings.schuss * 1.7 + ratings.speed * 1.2 + ratings.dribbling * 0.6 + gkPenalty;
          break;
        case 'midfield':
        default:
          // Midfielder: Passing & Dribbling are critical, plus Tackling
          baseScore = ratings.pass * 1.5 + ratings.dribbling * 1.2 + ratings.tackling * 0.7 + gkPenalty;
          break;
      }

      // Tactical Preferred Foot Matching Bonus & Penalty!
      const foot = player.preferredFoot || 'rechts'; // default to right
      let footBonus = 0;

      if (pos.x < 40) {
        // Left side of the field
        if (foot === 'links') {
          footBonus = 4.0; // Significant tactical bonus for a left-footer on the left wing!
        } else if (foot === 'beide') {
          footBonus = 2.0; // Nice bonus for both-footed versatility
        } else if (foot === 'rechts') {
          footBonus = -15.0; // Heavy penalty for putting a right-footer on the left wing!
        }
      } else if (pos.x > 60) {
        // Right side of the field
        if (foot === 'rechts') {
          footBonus = 4.0; // Significant tactical bonus for a right-footer on the right wing!
        } else if (foot === 'beide') {
          footBonus = 2.0; // Nice bonus for both-footed versatility
        } else if (foot === 'links') {
          footBonus = -15.0; // Heavy penalty for putting a left-footer on the right wing!
        }
      } else {
        // Central position
        if (foot === 'beide') {
          footBonus = 1.0; // Minor bonus for two-footedness in central congestion
        }
      }

      return baseScore + footBonus;
    };

    // Greedily match players to sorted positions
    positionPriority.forEach((pos) => {
      let bestPlayer: Player | null = null;
      let highestScore = -Infinity;

      players.forEach((player) => {
        if (assignedPlayers.has(player.id)) return;

        const score = calculateSuitability(player, pos);
        if (score > highestScore) {
          highestScore = score;
          bestPlayer = player;
        }
      });

      if (bestPlayer) {
        assignmentsResult[pos.id] = (bestPlayer as Player).id;
        assignedPlayers.add((bestPlayer as Player).id);
      }
    });

    setCurrentAssignments(assignmentsResult);
    if (activeLineup) {
      setActiveLineup({
        ...activeLineup,
        assignments: assignmentsResult
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loadingAuth,
        firebaseEnabled,
        teams,
        activeTeam,
        players,
        formations,
        lineups,
        activeLineup,
        activeFormation,
        currentAssignments,
        
        loginWithGoogle,
        logout,
        setActiveTeam,
        createTeam,
        deleteActiveTeam,
        saveOrUpdatePlayer,
        deletePlayerById,
        reorderPlayer,
        sortPlayersAuto,
        saveOrUpdateFormation,
        deleteFormationById,
        setActiveFormationById,
        saveOrUpdateLineup,
        deleteLineupById,
        loadLineupById,
        createNewLineupState,
        assignPlayerToPosition,
        autoAssignLineup
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
