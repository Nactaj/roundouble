// Calcul des résultats à partir des scores saisis (sets), partagé par tous les modes.
// Le vainqueur n'est JAMAIS stocké : il est dérivé des sets selon les réglages du tournoi.

// Vainqueur d'un set : "A" | "B" | null (set incomplet ou égalité).
export function setWinner(set) {
  if (!set) return null;
  const [a, b] = set;
  if (a == null || b == null || a === "" || b === "") return null;
  if (Number(a) === Number(b)) return null;
  return Number(a) > Number(b) ? "A" : "B";
}

// Vainqueur d'un match (terrain) : "A" | "B" | null.
// Best-of settings.setsCount : il faut remporter la majorité des sets.
export function winnerOf(court, settings = {}) {
  const need = Math.floor((settings.setsCount || 1) / 2) + 1;
  let wa = 0;
  let wb = 0;
  for (const s of court.sets || []) {
    const w = setWinner(s);
    if (w === "A") wa += 1;
    else if (w === "B") wb += 1;
  }
  if (wa >= need) return "A";
  if (wb >= need) return "B";
  return null;
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
