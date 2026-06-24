// Éditeur de paires fixes : les paires = sièges consécutifs de `pairSeats`. On clique deux
// joueurs pour les permuter ; un bouton régénère l'appariement automatique équilibré.
import { esc } from "../escape.js";
import { fullName } from "../../core/players.js";

export function renderPairEditor(players, pairSeats, pairSel) {
  const byId = (id) => players.find((p) => p.id === id);
  const chip = (id) => {
    const p = byId(id);
    const sel = pairSel === id ? " on" : "";
    return `<button type="button" class="pchip${sel}" data-action="su_selectForPair" data-id="${id}">${p ? esc(fullName(p)) : "?"}</button>`;
  };

  let h = `<div class="panel"><div class="ttl">Paires fixes</div>
    <p class="hint">Clique deux joueurs pour les permuter. <button type="button" class="lnk" data-action="su_seedPairs">↺ Régénérer auto</button></p>
    <div class="pairs">`;
  for (let k = 0; k + 1 < pairSeats.length; k += 2) {
    h += `<div class="pairrow"><span class="pnum">${k / 2 + 1}</span>${chip(pairSeats[k])}<span class="vs">+</span>${chip(pairSeats[k + 1])}</div>`;
  }
  h += `</div>`;
  if (pairSeats.length % 2 === 1) {
    const odd = byId(pairSeats[pairSeats.length - 1]);
    h += `<p class="hint warn">${esc(odd ? fullName(odd) : "?")} n'a pas de partenaire (nombre impair) — il sera toujours au repos.</p>`;
  }
  h += `</div>`;
  return h;
}
