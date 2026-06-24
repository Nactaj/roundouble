// Migrations de schéma + conversion de l'ancien format monolithe.
// Chaque évolution future ajoute une étape ici, en incrémentant CURRENT_SCHEMA.
import { DEFAULT_MODE_ID } from "../modes/index.js";

export const CURRENT_SCHEMA = 2;

const DEFAULT_SETTINGS = { pointsMax: 21, setsCount: 1 };

// Convertit l'ancienne sauvegarde monolithe { players, rounds, nextId }
// (clé localStorage "tournoi_pmbb_html_v1") en état v2 à un seul tournoi.
// Les anciennes rondes stockaient un `winner` booléen "A"/"B" ; on le préserve en
// synthétisant un set au score cible ([[pointsMax,0]] / [[0,pointsMax]]) pour que
// winnerOf() le retrouve (un set n'est gagné qu'en atteignant pointsMax).
export function legacyToV2(legacy) {
  const pm = DEFAULT_SETTINGS.pointsMax;
  const players = (legacy.players || []).map((p) => ({
    id: p.id,
    prenom: p.prenom || "",
    nom: p.nom || "",
    comp: !!p.comp
  }));
  const rounds = (legacy.rounds || []).map((rd) => ({
    courts: (rd.courts || []).map((ct) => ({
      a: ct.a,
      b: ct.b,
      sets: ct.winner === "A" ? [[pm, 0]] : ct.winner === "B" ? [[0, pm]] : []
    })),
    bench: rd.bench || []
  }));
  const id = "legacy";
  return {
    schemaVersion: CURRENT_SCHEMA,
    activeTournamentId: id,
    tournaments: {
      [id]: {
        id,
        name: "Mon tournoi",
        modeId: "mexicano",
        settings: { ...DEFAULT_SETTINGS },
        createdAt: 0,
        players,
        rounds,
        nextPlayerId: legacy.nextId || players.length + 1
      }
    }
  };
}

// Fait évoluer un état déjà au nouveau format vers le schéma courant.
export function migrate(raw) {
  const state = raw || {};
  // (Aucune migration v-numérotée pour l'instant ; squelette pour le futur.)
  // if (state.schemaVersion === 2) state = v2tov3(state);
  state.schemaVersion = CURRENT_SCHEMA;
  return state;
}

export { DEFAULT_MODE_ID, DEFAULT_SETTINGS };
