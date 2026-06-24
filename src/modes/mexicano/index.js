// Mode Mexicano — objet conforme au contrat (voir ../types.js).
import { generateRound, canGenerateNext } from "./engine.js";
import { computeStandings } from "./standings.js";

/** @type {import("../types.js").TournamentMode} */
export default {
  id: "mexicano",
  name: "Mexicano",
  description: "Équipes fort + faible, partenaires tournants à chaque ronde.",
  minPlayers: 4,
  usesCompetitorFlag: true,
  options() {
    return [
      { key: "pointsMax", label: "Points par set", type: "number", default: 21, min: 1 },
      { key: "setsCount", label: "Nombre de sets", type: "number", default: 1, min: 1 }
    ];
  },
  validate(players) {
    return players.length >= 4
      ? { ok: true }
      : { ok: false, message: "Ajoute au moins 4 joueurs." };
  },
  canGenerateNext,
  generateRound,
  computeStandings
};
