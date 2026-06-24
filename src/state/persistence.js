// Chargement / sauvegarde de l'état dans localStorage, avec versioning et migration.
// Toute erreur de lecture => état vide neuf (l'app ne crashe jamais au démarrage).
import { CURRENT_SCHEMA, DEFAULT_SETTINGS, migrate, legacyToV2 } from "./migrations.js";

const KEY = "roundouble_state_v1";
const LEGACY_KEY = "tournoi_pmbb_html_v1";

export function defaultUi() {
  return { tab: "rondes", confirmDel: null, newComp: false };
}

export function emptyState() {
  return {
    schemaVersion: CURRENT_SCHEMA,
    activeTournamentId: null,
    tournaments: {},
    ui: defaultUi()
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(migrate(JSON.parse(raw)));
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return normalize(legacyToV2(JSON.parse(legacy)));
  } catch (e) {
    /* sauvegarde corrompue : on repart proprement */
  }
  return emptyState();
}

export function save(state) {
  try {
    const { ui, ...rest } = state; // l'UI transitoire n'est pas persistée
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch (e) {
    /* quota plein ou stockage indisponible : on ignore */
  }
}

// Garantit la cohérence d'un état chargé (champs manquants, tournoi actif valide...).
function normalize(state) {
  const s = state || {};
  s.schemaVersion = CURRENT_SCHEMA;
  s.tournaments = s.tournaments || {};
  if (s.activeTournamentId && !s.tournaments[s.activeTournamentId]) {
    s.activeTournamentId = null;
  }
  Object.values(s.tournaments).forEach((t) => {
    t.settings = { ...DEFAULT_SETTINGS, ...(t.settings || {}) };
    t.players = t.players || [];
    t.rounds = t.rounds || [];
    if (t.nextPlayerId == null) {
      t.nextPlayerId = t.players.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    }
    t.rounds.forEach((rd) => {
      rd.bench = rd.bench || [];
      (rd.courts || []).forEach((ct) => {
        ct.sets = ct.sets || [];
      });
    });
  });
  s.ui = defaultUi();
  return s;
}
