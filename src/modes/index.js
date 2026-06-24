// REGISTRE DES MODES — le point d'extension du projet.
// Pour ajouter un format : importer son module et l'ajouter au tableau MODES. Rien d'autre.
import mexicano from "./mexicano/index.js";
// import swiss from "./swiss/index.js";   // <- exemple : 1 import + 1 entrée ci-dessous

const MODES = [
  mexicano
  // , swiss
];

export const DEFAULT_MODE_ID = MODES[0].id;

// Métadonnées légères pour l'écran de création.
export function listModes() {
  return MODES.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    minPlayers: m.minPlayers
  }));
}

// Récupère le mode complet ; retombe sur le mode par défaut si l'id est inconnu.
export function getMode(id) {
  return MODES.find((m) => m.id === id) || MODES[0];
}
