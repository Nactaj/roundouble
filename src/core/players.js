// Helpers joueurs — purs, partagés par tous les modes.

export const fullName = (p) => `${p.prenom || ""} ${p.nom || ""}`.trim();

export const findPlayer = (players, id) => players.find((p) => p.id === id);

export const nameById = (players, id) => {
  const p = findPlayer(players, id);
  return p ? fullName(p) : "—";
};

export const isComp = (players, id) => {
  const p = findPlayer(players, id);
  return !!(p && p.comp);
};

// Clé canonique d'une paire de joueurs (ordre indépendant), ex. [3,1] -> "1-3".
export const pairKey = (ids) => [...ids].sort((a, b) => a - b).join("-");
