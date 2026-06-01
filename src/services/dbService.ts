import { db, firebaseAvailable } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  isGoalkeeper: boolean;
  isCaptain?: boolean;
  preferredFoot?: 'links' | 'rechts' | 'beide';
  sortOrder?: number;
  ratings: {
    schuss: number;      // S
    pass: number;        // P
    dribbling: number;   // D
    tackling: number;    // T
    speed: number;       // G
    gkReflexes?: number; // T-Reflexe (für Torhüter)
  };
}

export interface Position {
  id: string;
  x: number; // 0-100 percentage width on vertical pitch
  y: number; // 0-100 percentage height on vertical pitch
  zone: 'goalkeeper' | 'defense' | 'midfield' | 'forward';
}

export interface Formation {
  id: string;
  name: string;
  playerCount: number; // e.g. 5, 7, 9, 11 (includes Goalkeeper)
  positions: Position[];
  isCustom?: boolean;
}

export interface Lineup {
  id: string;
  teamId: string;
  name: string;
  formationId: string;
  assignments: Record<string, string>; // positionId -> playerId
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  createdAt: number;
}

// Check if we should use Firebase or LocalStorage
const useFirebase = (userId: string | null): boolean => {
  return firebaseAvailable && userId !== null;
};

// --- TEAMS SERVICE ---

export const getTeams = async (userId: string | null): Promise<Team[]> => {
  if (useFirebase(userId)) {
    try {
      const q = query(
        collection(db, 'users', userId!, 'teams'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Team);
    } catch (error) {
      console.error('Error getting teams from Firestore:', error);
      return getLocalStorageTeams();
    }
  } else {
    return getLocalStorageTeams();
  }
};

export const saveTeam = async (userId: string | null, team: Team): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await setDoc(doc(db, 'users', userId!, 'teams', team.id), team);
    } catch (error) {
      console.error('Error saving team to Firestore:', error);
      saveLocalStorageTeam(team);
    }
  } else {
    saveLocalStorageTeam(team);
  }
};

export const deleteTeam = async (userId: string | null, teamId: string): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await deleteDoc(doc(db, 'users', userId!, 'teams', teamId));
    } catch (error) {
      console.error('Error deleting team from Firestore:', error);
      deleteLocalStorageTeam(teamId);
    }
  } else {
    deleteLocalStorageTeam(teamId);
  }
};

// --- PLAYERS SERVICE ---

export const getPlayers = async (userId: string | null, teamId: string): Promise<Player[]> => {
  if (useFirebase(userId)) {
    try {
      const q = query(
        collection(db, 'users', userId!, 'teams', teamId, 'players')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Player);
    } catch (error) {
      console.error('Error getting players from Firestore:', error);
      return getLocalStoragePlayers(teamId);
    }
  } else {
    return getLocalStoragePlayers(teamId);
  }
};

export const savePlayer = async (userId: string | null, player: Player): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await setDoc(
        doc(db, 'users', userId!, 'teams', player.teamId, 'players', player.id),
        player
      );
    } catch (error) {
      console.error('Error saving player to Firestore:', error);
      saveLocalStoragePlayer(player);
    }
  } else {
    saveLocalStoragePlayer(player);
  }
};

export const deletePlayer = async (
  userId: string | null,
  teamId: string,
  playerId: string
): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await deleteDoc(doc(db, 'users', userId!, 'teams', teamId, 'players', playerId));
    } catch (error) {
      console.error('Error deleting player from Firestore:', error);
      deleteLocalStoragePlayer(teamId, playerId);
    }
  } else {
    deleteLocalStoragePlayer(teamId, playerId);
  }
};

// --- FORMATIONS SERVICE ---

export const getFormations = async (userId: string | null): Promise<Formation[]> => {
  if (useFirebase(userId)) {
    try {
      const q = query(collection(db, 'users', userId!, 'formations'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Formation);
    } catch (error) {
      console.error('Error getting formations from Firestore:', error);
      return getLocalStorageFormations();
    }
  } else {
    return getLocalStorageFormations();
  }
};

export const saveFormation = async (
  userId: string | null,
  formation: Formation
): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await setDoc(doc(db, 'users', userId!, 'formations', formation.id), formation);
    } catch (error) {
      console.error('Error saving formation to Firestore:', error);
      saveLocalStorageFormation(formation);
    }
  } else {
    saveLocalStorageFormation(formation);
  }
};

export const deleteFormation = async (
  userId: string | null,
  formationId: string
): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await deleteDoc(doc(db, 'users', userId!, 'formations', formationId));
    } catch (error) {
      console.error('Error deleting formation from Firestore:', error);
      deleteLocalStorageFormation(formationId);
    }
  } else {
    deleteLocalStorageFormation(formationId);
  }
};

// --- LINEUPS SERVICE ---

export const getLineups = async (userId: string | null, teamId: string): Promise<Lineup[]> => {
  if (useFirebase(userId)) {
    try {
      const q = query(
        collection(db, 'users', userId!, 'teams', teamId, 'lineups'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Lineup);
    } catch (error) {
      console.error('Error getting lineups from Firestore:', error);
      return getLocalStorageLineups(teamId);
    }
  } else {
    return getLocalStorageLineups(teamId);
  }
};

export const saveLineup = async (userId: string | null, lineup: Lineup): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await setDoc(
        doc(db, 'users', userId!, 'teams', lineup.teamId, 'lineups', lineup.id),
        lineup
      );
    } catch (error) {
      console.error('Error saving lineup to Firestore:', error);
      saveLocalStorageLineup(lineup);
    }
  } else {
    saveLocalStorageLineup(lineup);
  }
};

export const deleteLineup = async (
  userId: string | null,
  teamId: string,
  lineupId: string
): Promise<void> => {
  if (useFirebase(userId)) {
    try {
      await deleteDoc(doc(db, 'users', userId!, 'teams', teamId, 'lineups', lineupId));
    } catch (error) {
      console.error('Error deleting lineup from Firestore:', error);
      deleteLocalStorageLineup(teamId, lineupId);
    }
  } else {
    deleteLocalStorageLineup(teamId, lineupId);
  }
};

// --- LOCAL STORAGE HELPERS ---

const getLocalStorageTeams = (): Team[] => {
  const teamsJson = localStorage.getItem('easy-soccer:teams');
  return teamsJson ? JSON.parse(teamsJson) : [];
};

const saveLocalStorageTeam = (team: Team): void => {
  const teams = getLocalStorageTeams();
  const index = teams.findIndex((t) => t.id === team.id);
  if (index >= 0) {
    teams[index] = team;
  } else {
    teams.push(team);
  }
  localStorage.setItem('easy-soccer:teams', JSON.stringify(teams));
};

const deleteLocalStorageTeam = (teamId: string): void => {
  const teams = getLocalStorageTeams().filter((t) => t.id !== teamId);
  localStorage.setItem('easy-soccer:teams', JSON.stringify(teams));
  
  // Clean up associated players & lineups in localStorage as well
  const players = getLocalStorageAllPlayers().filter((p) => p.teamId !== teamId);
  localStorage.setItem('easy-soccer:players', JSON.stringify(players));
  
  const lineups = getLocalStorageAllLineups().filter((l) => l.teamId !== teamId);
  localStorage.setItem('easy-soccer:lineups', JSON.stringify(lineups));
};

const getLocalStorageAllPlayers = (): Player[] => {
  const playersJson = localStorage.getItem('easy-soccer:players');
  return playersJson ? JSON.parse(playersJson) : [];
};

const getLocalStoragePlayers = (teamId: string): Player[] => {
  return getLocalStorageAllPlayers().filter((p) => p.teamId === teamId);
};

const saveLocalStoragePlayer = (player: Player): void => {
  const players = getLocalStorageAllPlayers();
  const index = players.findIndex((p) => p.id === player.id);
  if (index >= 0) {
    players[index] = player;
  } else {
    players.push(player);
  }
  localStorage.setItem('easy-soccer:players', JSON.stringify(players));
};

const deleteLocalStoragePlayer = (teamId: string, playerId: string): void => {
  const players = getLocalStorageAllPlayers().filter(
    (p) => !(p.teamId === teamId && p.id === playerId)
  );
  localStorage.setItem('easy-soccer:players', JSON.stringify(players));
};

const getLocalStorageFormations = (): Formation[] => {
  const formationsJson = localStorage.getItem('easy-soccer:formations');
  return formationsJson ? JSON.parse(formationsJson) : [];
};

const saveLocalStorageFormation = (formation: Formation): void => {
  const formations = getLocalStorageFormations();
  const index = formations.findIndex((f) => f.id === formation.id);
  if (index >= 0) {
    formations[index] = formation;
  } else {
    formations.push(formation);
  }
  localStorage.setItem('easy-soccer:formations', JSON.stringify(formations));
};

const deleteLocalStorageFormation = (formationId: string): void => {
  const formations = getLocalStorageFormations().filter((f) => f.id !== formationId);
  localStorage.setItem('easy-soccer:formations', JSON.stringify(formations));
};

const getLocalStorageAllLineups = (): Lineup[] => {
  const lineupsJson = localStorage.getItem('easy-soccer:lineups');
  return lineupsJson ? JSON.parse(lineupsJson) : [];
};

const getLocalStorageLineups = (teamId: string): Lineup[] => {
  return getLocalStorageAllLineups().filter((l) => l.teamId === teamId);
};

const saveLocalStorageLineup = (lineup: Lineup): void => {
  const lineups = getLocalStorageAllLineups();
  const index = lineups.findIndex((l) => l.id === lineup.id);
  if (index >= 0) {
    lineups[index] = lineup;
  } else {
    lineups.push(lineup);
  }
  localStorage.setItem('easy-soccer:lineups', JSON.stringify(lineups));
};

const deleteLocalStorageLineup = (teamId: string, lineupId: string): void => {
  const lineups = getLocalStorageAllLineups().filter(
    (l) => !(l.teamId === teamId && l.id === lineupId)
  );
  localStorage.setItem('easy-soccer:lineups', JSON.stringify(lineups));
};
