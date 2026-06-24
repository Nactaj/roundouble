// Source de vérité de l'application : état en mémoire + abonnement + actions.
// Chaque action mute l'état puis commit() (sauvegarde + notifie les abonnés -> re-render).
import { load, save, defaultUi } from "./persistence.js";
import { getMode } from "../modes/index.js";
import { computeStats } from "../core/stats.js";

let state = load();
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit() {
  save(state);
  listeners.forEach((fn) => fn(state));
}

export function activeTournament() {
  return state.activeTournamentId ? state.tournaments[state.activeTournamentId] : null;
}

// Construit le contexte passé aux modes (joueurs/rounds/réglages + stats précalculées).
export function ctxFor(t) {
  return {
    players: t.players,
    rounds: t.rounds,
    settings: t.settings,
    stats: computeStats(t.players, t.rounds, t.settings)
  };
}

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `t-${crypto.randomUUID()}`;
  return `t-${Date.now()}-${Object.keys(state.tournaments).length}`;
}

/* ---------- Actions : navigation ---------- */
export function setTab(tab) {
  state.ui.tab = tab;
  state.ui.confirmDel = null;
  commit();
}

/* ---------- Actions : cycle de vie du tournoi ---------- */
export function createTournament({ name, modeId, settings, players }) {
  const id = genId();
  state.tournaments[id] = {
    id,
    name,
    modeId,
    settings,
    createdAt: Date.now(),
    players,
    rounds: [],
    nextPlayerId: players.reduce((m, p) => Math.max(m, p.id), 0) + 1
  };
  state.activeTournamentId = id;
  state.ui = defaultUi();
  commit();
}

export function closeTournament() {
  state.activeTournamentId = null;
  state.ui = defaultUi();
  commit();
}

/* ---------- Actions : joueurs (tournoi actif) ---------- */
export function addPlayer(prenom, nom) {
  const t = activeTournament();
  if (!t) return;
  t.players.push({ id: t.nextPlayerId++, prenom, nom, comp: state.ui.newComp });
  state.ui.newComp = false;
  commit();
}

export function toggleNewComp() {
  state.ui.newComp = !state.ui.newComp;
  commit();
}

export function toggleComp(id) {
  const t = activeTournament();
  const p = t && t.players.find((x) => x.id === id);
  if (p) p.comp = !p.comp;
  commit();
}

export function delPlayer(id) {
  const t = activeTournament();
  if (!t) return;
  t.players = t.players.filter((p) => p.id !== id);
  commit();
}

/* ---------- Actions : rondes & scores ---------- */
export function generer() {
  const t = activeTournament();
  if (!t) return;
  const mode = getMode(t.modeId);
  const ctx = ctxFor(t);
  if (!mode.canGenerateNext(ctx).ok) return;
  t.rounds.push(mode.generateRound(ctx));
  state.ui.confirmDel = null;
  commit();
}

export function setScore(ri, ci, si, side, value) {
  const t = activeTournament();
  if (!t) return;
  const ct = t.rounds[ri].courts[ci];
  if (!ct.sets[si]) ct.sets[si] = [null, null];
  ct.sets[si][side === "A" ? 0 : 1] = value === "" ? null : Math.max(0, Number(value));
  commit();
}

export function askCancel(ri) {
  state.ui.confirmDel = ri;
  commit();
}

export function cancelCancel() {
  state.ui.confirmDel = null;
  commit();
}

export function doCancel(ri) {
  const t = activeTournament();
  if (!t) return;
  t.rounds.splice(ri, 1);
  state.ui.confirmDel = null;
  commit();
}
