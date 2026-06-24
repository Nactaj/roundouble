// SQUELETTE DE MODE — copier ce dossier en modes/<monmode>/, adapter, puis
// enregistrer le module dans modes/index.js (1 import + 1 entrée dans MODES).
// Voir modes/types.js pour le contrat complet et modes/mexicano/ pour un exemple réel.

/** @type {import("../types.js").TournamentMode} */
export default {
  id: "template", // clé stable, unique, jamais renommée (stockée dans l'état)
  name: "Nouveau format",
  description: "Décris le principe du format en une ligne.",
  minPlayers: 4,
  usesCompetitorFlag: false,

  // Réglages saisis à la création (au minimum points/sets pour pouvoir scorer).
  options() {
    return [
      { key: "pointsMax", label: "Points par set", type: "number", default: 21, min: 1 },
      { key: "setsCount", label: "Nombre de sets", type: "number", default: 1, min: 1 }
    ];
  },

  // Peut-on créer le tournoi avec cette liste de joueurs ?
  validate(players) {
    return players.length >= 4 ? { ok: true } : { ok: false, message: "Ajoute au moins 4 joueurs." };
  },

  // Peut-on générer la ronde suivante ? (ex. ronde courante terminée)
  canGenerateNext(/* ctx */) {
    return { ok: true };
  },

  // Génère une ronde : { courts: [{ a:[id,id], b:[id,id], sets:[] }], bench:[id...] }
  generateRound(/* ctx */) {
    return { courts: [], bench: [] };
  },

  // Classement : StandingsRow[] — chaque ligne porte `cells` (colonnes affichées).
  computeStandings(ctx) {
    return ctx.players.map((p, i) => ({
      playerId: p.id,
      name: `${p.prenom} ${p.nom}`.trim(),
      comp: p.comp,
      rank: i + 1,
      cells: {}
    }));
  }
};
