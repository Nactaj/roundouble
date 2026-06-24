// Rendu d'un terrain : équipes (surlignage du vainqueur dérivé) + saisie des scores par set.
import { esc } from "../escape.js";
import { nameById, isComp } from "../../core/players.js";
import { winnerOf } from "../../core/scoring.js";

export function renderCourt(t, ri, ci) {
  const ct = t.rounds[ri].courts[ci];
  const w = winnerOf(ct, t.settings);
  const star = (id) => (isComp(t.players, id) ? '<span class="star">★</span> ' : "");

  const team = (side, ids) => {
    const win = w === side;
    return `<div class="team${win ? " win" : ""}">
      <div class="lab">ÉQUIPE ${side}${win ? " ✓" : ""}</div>
      <div>${star(ids[0])}${esc(nameById(t.players, ids[0]))}</div>
      <div>${star(ids[1])}${esc(nameById(t.players, ids[1]))}</div>
    </div>`;
  };

  const nSets = t.settings.setsCount || 1;
  let sets = "";
  for (let si = 0; si < nSets; si += 1) {
    const s = ct.sets[si] || [null, null];
    const inp = (side, val) =>
      `<input class="score" type="number" inputmode="numeric" min="0" max="${t.settings.pointsMax}" value="${val ?? ""}" data-action="score" data-ri="${ri}" data-ci="${ci}" data-si="${si}" data-side="${side}">`;
    sets += `<div class="setrow">
      ${nSets > 1 ? `<span class="setlab">Set ${si + 1}</span>` : ""}
      ${inp("A", s[0])}<span class="vs">–</span>${inp("B", s[1])}
    </div>`;
  }

  return `<div class="court"><div class="terr">Terrain ${ci + 1}</div>
    <div class="teams">${team("A", ct.a)}${team("B", ct.b)}</div>
    <div class="sets">${sets}</div></div>`;
}
