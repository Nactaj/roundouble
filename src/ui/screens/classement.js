// Écran « Classement » : colonnes pilotées par le mode (rows[].cells).
import { getMode } from "../../modes/index.js";
import { ctxFor } from "../../state/store.js";
import { esc } from "../escape.js";

export function renderClassement(t) {
  const mode = getMode(t.modeId);
  const rows = mode.computeStandings(ctxFor(t));
  const cols = rows.length ? Object.keys(rows[0].cells) : [];

  let h = `<div class="card"><table><thead><tr><th>#</th><th style="text-align:left">Joueur</th>${cols
    .map((c) => `<th>${esc(c)}</th>`)
    .join("")}</tr></thead><tbody>`;
  rows.forEach((r) => {
    h += `<tr><td>${r.rank}</td><td class="nm">${r.comp ? '<span class="star">★</span> ' : ""}${esc(r.name)}</td>${cols
      .map((c) => `<td>${esc(r.cells[c])}</td>`)
      .join("")}</tr>`;
  });
  h += `</tbody></table><div style="padding:8px 12px;font-size:11px;color:var(--mut)">V victoires · D défaites · +/- diff. de points · ⏸ tours en attente</div></div>`;
  return h;
}
