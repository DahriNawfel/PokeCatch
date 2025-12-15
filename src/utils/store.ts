import type { Pokemon } from './pokeapi';

const KEYS = {
  team: 'pokecatch-team',
  pokedex: 'pokecatch-pokedex',
  encounters: 'pokecatch-encounters',
  favorites: 'pokecatch-favorites',
  theme: 'pokecatch-theme',
  stats: 'pokecatch-stats'
} as const;

export type Stats = { captures: number; encounters: number };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export const store = {
  getTeam(): Pokemon[] { return read(KEYS.team, []); },
  setTeam(team: Pokemon[]) {
    const next = team.slice(0, 6);
    return write(KEYS.team, next);
  },

  getPokedex(): Pokemon[] { return read(KEYS.pokedex, []); },
  upsertPokedex(current: Pokemon[], p: Pokemon) {
    const exists = current.find(x => x.id === p.id);
    const next = exists ? current.map(x => x.id === p.id ? p : x) : [...current, p];
    return write(KEYS.pokedex, next);
  },

  getEncounters(): Pokemon[] { return read(KEYS.encounters, []); },
  upsertEncounter(current: Pokemon[], p: Pokemon) {
    const exists = current.find(x => x.id === p.id);
    const next = exists ? current : [...current, p];
    return write(KEYS.encounters, next);
  },

  getFavorites(): Record<number, boolean> { return read(KEYS.favorites, {}); },
  setFavorites(map: Record<number, boolean>) { return write(KEYS.favorites, map); },

  getTheme(): 'light' | 'dark' { return read(KEYS.theme, 'light'); },
  setTheme(t: 'light' | 'dark') { return write(KEYS.theme, t); },

  getStats(): Stats { return read(KEYS.stats, { captures: 0, encounters: 0 }); },
  setStats(s: Stats) { return write(KEYS.stats, s); }
};
