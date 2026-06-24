// Calcul des résultats à partir des scores saisis (sets), partagé par tous les modes.
// Le vainqueur n'est JAMAIS stocké : il est dérivé des sets selon les réglages du tournoi.

// Formats de set proposés : score cible -> plafond de prolongation (2 pts d'écart).
export const SCORE_FORMATS = [
  { target: 11, cap: 15 },
  { target: 15, cap: 21 },
  { target: 21, cap: 30 }
];
const CAP_BY_TARGET = SCORE_FORMATS.reduce((m, f) => ((m[f.target] = f.cap), m), {});

// Plafond d'un set pour le score cible choisi (fallback raisonnable hors presets).
export function setCap(settings = {}) {
  const max = settings.pointsMax || 21;
  return CAP_BY_TARGET[max] || max + 9;
}

// Phrase récapitulative des réglages de score (affichée à la création et dans les rondes).
export function describeScoring(settings = {}) {
  const max = settings.pointsMax || 21;
  const cap = setCap(settings);
  const n = settings.setsCount || 1;
  const need = Math.floor(n / 2) + 1;
  const setsTxt = n === 1 ? "1 set sec" : `${n} sets — il faut en gagner ${need}`;
  return `Sets en ${max} points (2 pts d'écart, max ${cap}) · ${setsTxt}`;
}

// Vainqueur d'un set : "A" | "B" | null. Reproduit l'accessibilité réelle d'un score de
// badminton (cible `pointsMax`, victoire à 2 points d'écart, plafond en prolongation) :
//   - fin nette : on atteint exactement la cible, adversaire à 2 points ou plus en dessous ;
//   - prolongation : au-delà de la cible, victoire à exactement 2 points d'écart (≤ plafond) ;
//   - plafond : au plafond, victoire à 1 point d'écart.
// Les scores impossibles (ex. 21-2 en 15 points, 18-3) ne donnent donc aucun vainqueur.
export function setWinner(set, settings = {}) {
  if (!set) return null;
  const [a, b] = set;
  if (a == null || b == null || a === "" || b === "") return null;
  const x = Number(a);
  const y = Number(b);
  if (Number.isNaN(x) || Number.isNaN(y) || x === y) return null;
  const target = settings.pointsMax || 21;
  const cap = setCap(settings);
  const hi = Math.max(x, y);
  const lo = Math.min(x, y);
  const valid =
    (hi === target && lo <= target - 2) ||
    (hi > target && hi <= cap && hi - lo === 2) ||
    (hi === cap && lo === cap - 1);
  if (!valid) return null;
  return x > y ? "A" : "B";
}

// Message explicatif sur l'état d'un set (pourquoi il n'y a pas encore de vainqueur).
// Renvoie null si le set a un vainqueur ou est totalement vide ; sinon { text, warn }.
export function setMessage(set, settings = {}) {
  if (!set) return null;
  const [a, b] = set;
  const aEmpty = a == null || a === "";
  const bEmpty = b == null || b === "";
  if (aEmpty && bEmpty) return null;
  if (aEmpty || bEmpty) return { text: "Score incomplet — saisis les deux scores.", warn: false };
  if (setWinner(set, settings)) return null;
  const x = Number(a);
  const y = Number(b);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  const target = settings.pointsMax || 21;
  const cap = setCap(settings);
  const hi = Math.max(x, y);
  const lo = Math.min(x, y);
  if (x === y) {
    return hi >= target - 1
      ? { text: `Égalité ${x}–${y} : 2 points d'écart pour conclure.`, warn: false }
      : { text: `Égalité ${x}–${y}, set en cours.`, warn: false };
  }
  if (hi < target) return { text: `Set en cours — premier à ${target} (2 points d'écart).`, warn: false };
  if (hi <= cap && hi - lo === 1) {
    return { text: `Avantage d'un point : il faut 2 points d'écart (max ${cap}).`, warn: false };
  }
  return {
    text: `Score impossible : à ${target} points le set s'arrête dès 2 points d'écart (max ${cap}).`,
    warn: true
  };
}

// Issue d'un match (terrain) : "A" | "B" | "draw" | null.
// - "A"/"B" : a remporté la majorité des sets (best-of settings.setsCount).
// - "draw"  : tous les sets sont joués mais à égalité (possible si setsCount est pair).
// - null    : match encore en cours.
export function matchOutcome(court, settings = {}) {
  const total = settings.setsCount || 1;
  const need = Math.floor(total / 2) + 1;
  let sa = 0;
  let sb = 0;
  let decided = 0;
  for (const s of court.sets || []) {
    const w = setWinner(s, settings);
    if (w === "A") {
      sa += 1;
      decided += 1;
    } else if (w === "B") {
      sb += 1;
      decided += 1;
    }
  }
  if (sa >= need) return "A";
  if (sb >= need) return "B";
  if (decided >= total) return "draw"; // tous les sets joués, score de sets à égalité
  return null;
}

// Vainqueur d'un match (terrain) : "A" | "B" | null (un nul renvoie null).
export function winnerOf(court, settings = {}) {
  const out = matchOutcome(court, settings);
  return out === "A" || out === "B" ? out : null;
}

// Total de points marqués par chaque équipe sur le terrain : {A, B}.
export function courtPoints(court) {
  let A = 0;
  let B = 0;
  for (const s of court.sets || []) {
    if (s && s[0] != null && s[0] !== "") A += Number(s[0]);
    if (s && s[1] != null && s[1] !== "") B += Number(s[1]);
  }
  return { A, B };
}
