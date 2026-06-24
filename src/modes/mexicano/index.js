// Mode Mexicano — objet conforme au contrat (voir ../types.js).
import { generateRound, canGenerateNext } from "./engine.js";
import { computeStandings } from "./standings.js";

const POINTS_CHOICES = [
  { value: 11, label: "11 pts (max 15)" },
  { value: 15, label: "15 pts (max 21)" },
  { value: 21, label: "21 pts (max 30)" }
];
const SETS_CHOICES = [
  { value: 1, label: "1 set" },
  { value: 2, label: "2 sets" },
  { value: 3, label: "3 sets" }
];

/** @type {import("../types.js").TournamentMode} */
export default {
  id: "mexicano",
  name: "Parties",
  description: "Simple ou double, partenaires tournants ou fixes, appariement configurable.",
  minPlayers: 2,
  usesCompetitorFlag: true,
  // Options dépendantes des réglages : « Partenaires » n'apparaît qu'en double, et le choix
  // « Équilibré » n'est proposé qu'en double/tournants.
  options(settings = {}) {
    const format = settings.format === "simple" ? "simple" : "double";
    const partners = format === "double" && settings.partners === "fixes" ? "fixes" : "tournants";
    const opts = [
      {
        key: "format",
        label: "Format",
        type: "select",
        default: "double",
        choices: [
          { value: "double", label: "Double (2v2)" },
          { value: "simple", label: "Simple (1v1)" }
        ]
      }
    ];
    if (format === "double") {
      opts.push({
        key: "partners",
        label: "Partenaires",
        type: "select",
        default: "tournants",
        choices: [
          { value: "tournants", label: "Tournants (Mexicano)" },
          { value: "fixes", label: "Paires fixes" }
        ]
      });
    }
    const equilibreOk = format === "double" && partners === "tournants";
    const pairingChoices = [];
    if (equilibreOk) pairingChoices.push({ value: "equilibre", label: "Équilibré (fort+faible)" });
    pairingChoices.push({ value: "niveau", label: "Ronde suisse" });
    pairingChoices.push({ value: "aleatoire", label: "Aléatoire" });
    opts.push({
      key: "pairing",
      label: "Appariement",
      type: "select",
      default: equilibreOk ? "equilibre" : "niveau",
      choices: pairingChoices
    });

    opts.push({ key: "pointsMax", label: "Points par set", type: "select", numeric: true, default: 21, choices: POINTS_CHOICES });
    opts.push({ key: "setsCount", label: "Nombre de sets", type: "select", numeric: true, default: 1, choices: SETS_CHOICES });
    return opts;
  },
  validate(players, settings = {}) {
    const format = settings.format === "simple" ? "simple" : "double";
    const fixes = format === "double" && settings.partners === "fixes";
    const min = format === "simple" ? 2 : 4;
    if (players.length < min) return { ok: false, message: `Ajoute au moins ${min} joueurs.` };
    if (fixes && players.length % 2 !== 0) {
      return { ok: false, message: "Nombre de joueurs pair requis pour des paires fixes." };
    }
    return { ok: true };
  },
  canGenerateNext,
  generateRound,
  computeStandings
};
