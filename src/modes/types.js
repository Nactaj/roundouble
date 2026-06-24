// Contrat d'un « mode de tournoi ». Ajouter un mode = créer un dossier modes/<id>/
// exportant un objet conforme, puis l'enregistrer dans modes/index.js (1 import + 1 entrée).
// Aucun autre fichier (store, écrans, persistance, nav) ne change.

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} prenom
 * @property {string} nom
 * @property {boolean} comp  // compétiteur / tête de série (★)
 */

/**
 * @typedef {Object} Court
 * @property {number[]} a            // [idJoueur, idJoueur] équipe A
 * @property {number[]} b            // [idJoueur, idJoueur] équipe B
 * @property {Array<[number|null,number|null]>} sets  // scores par set ; vainqueur dérivé
 */

/**
 * @typedef {Object} Round
 * @property {Court[]} courts
 * @property {number[]} bench        // joueurs en attente ce tour
 */

/**
 * @typedef {Object} ModeOption  // un réglage saisi à la création du tournoi
 * @property {string} key
 * @property {string} label
 * @property {"number"} type
 * @property {number} default
 * @property {number=} min
 * @property {number=} max
 */

/**
 * @typedef {Object} ModeContext
 * @property {Player[]} players
 * @property {Round[]} rounds
 * @property {Object} settings       // valeurs des options, ex. {pointsMax, setsCount}
 * @property {import("../core/stats.js").Stats} stats  // tallies partagés précalculés
 */

/**
 * @typedef {Object} StandingsRow
 * @property {number} playerId
 * @property {string} name
 * @property {boolean} comp
 * @property {number} rank                       // tie-aware
 * @property {Record<string, string|number>} cells  // colonnes ordonnées, ex. {V,D,"+/-","⏸"}
 */

/**
 * @typedef {Object} TournamentMode
 * @property {string} id              // clé stable stockée dans l'état, jamais renommée
 * @property {string} name
 * @property {string} description
 * @property {number} minPlayers
 * @property {number=} maxPlayers
 * @property {boolean} usesCompetitorFlag
 * @property {() => ModeOption[]=} options
 * @property {(players: Player[]) => {ok: boolean, message?: string}} validate
 * @property {(ctx: ModeContext) => {ok: boolean, message?: string}} canGenerateNext
 * @property {(ctx: ModeContext) => Round} generateRound
 * @property {(ctx: ModeContext) => StandingsRow[]} computeStandings
 */

export {};
