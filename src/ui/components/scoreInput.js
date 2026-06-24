// Rendu d'un terrain : équipes (surlignage du vainqueur dérivé) + saisie des scores par set.
import { esc } from "../escape.js";
import { nameById, isComp } from "../../core/players.js";
import { matchOutcome, setWinner, setCap } from "../../core/scoring.js";

export function renderCourt(t, ri, ci) {
  const ct = t.rounds[ri].courts[ci];
  const out = matchOutcome(ct, t.settings);
  const w = out === "A" || out === "B" ? out : null;
  const star = (id) => (isComp(t.players, id) ? '<span class="star">★</span> ' : "");

  const team = (side, ids) => {
    const win = w === side;
    const label = ids.length > 1 ? "ÉQUIPE" : "JOUEUR";
    const names = ids.map((id) => `<div>${star(id)}${esc(nameById(t.players, id))}</div>`).join("");
    return `<div class="team${win ? " win" : ""}">
      <div class="lab">${label} ${side}${win ? " ✓" : ""}</div>
      ${names}
    </div>`;
  };

  // Affichage dynamique des sets. On affiche toujours les `need` sets obligatoires
  // (best-of-3 -> 2 sets d'emblée), puis le(s) set(s) décisif(s) seulement si le match
  // n'est pas déjà gagné et que le set précédent est terminé. Ex. best-of-3 : 2 sets,
  // le 3e apparaît si 1–1 et disparaît à 2–0.
  const total = t.settings.setsCount || 1;
  const need = Math.floor(total / 2) + 1;
  const cap = setCap(t.settings);
  let wa = 0;
  let wb = 0;
  let decided = 0; // nb de sets terminés jusqu'ici
  let sets = "";
  for (let si = 0; si < total; si += 1) {
    if (wa >= need || wb >= need) break; // match déjà décidé : pas de set superflu
    // Set optionnel (au-delà du minimum) : ne s'ouvre que si TOUS les précédents
    // sont terminés (sinon, remplir un set hors ordre ferait apparaître le suivant).
    if (si >= need && decided < si) break;
    const s = ct.sets[si] || [null, null];
    const inp = (side, val) =>
      `<input class="score" type="number" inputmode="numeric" min="0" max="${cap}" value="${val ?? ""}" data-action="score" data-ri="${ri}" data-ci="${ci}" data-si="${si}" data-side="${side}">`;
    sets += `<div class="setrow">
      ${total > 1 ? `<span class="setlab">Set ${si + 1}</span>` : ""}
      ${inp("A", s[0])}<span class="vs">–</span>${inp("B", s[1])}
    </div>`;
    const sw = setWinner(s, t.settings);
    if (sw === "A") wa += 1;
    else if (sw === "B") wb += 1;
    if (sw !== null) decided += 1;
  }

  const drawNote = out === "draw" ? `<div class="draw">Match nul</div>` : "";
  return `<div class="court"><div class="terr">Terrain ${ci + 1}</div>
    <div class="teams">${team("A", ct.a)}${team("B", ct.b)}</div>
    <div class="sets">${sets}</div>${drawNote}</div>`;
}
