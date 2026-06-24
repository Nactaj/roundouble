// Écran « Rondes » : bouton de génération + cartes de rondes (récente en haut).
import { renderCourt } from "../components/scoreInput.js";
import { getMode } from "../../modes/index.js";
import { getState, ctxFor } from "../../state/store.js";
import { esc } from "../escape.js";
import { nameById } from "../../core/players.js";
import { describeScoring } from "../../core/scoring.js";

export function renderRondes(t) {
  const mode = getMode(t.modeId);
  const ctx = ctxFor(t);
  const gate = mode.canGenerateNext(ctx);
  const ui = getState().ui;

  let h = `<button class="btn" ${gate.ok ? "" : "disabled"} data-action="generer">+ Générer la ronde ${t.rounds.length + 1}</button>`;
  h += `<p class="hint">${esc(describeScoring(t.settings))}</p>`;
  if (!gate.ok) h += `<p class="hint warn">${esc(gate.message || "")}</p>`;
  else if (t.rounds.length === 0) h += `<p class="hint">Aucune ronde. Lance la première.</p>`;

  for (let ri = t.rounds.length - 1; ri >= 0; ri -= 1) {
    const rd = t.rounds[ri];
    h += `<div class="card"><div class="rh"><span>Ronde ${ri + 1}</span>`;
    h +=
      ui.confirmDel === ri
        ? `<span>Annuler ? <button class="yes" data-action="doCancel" data-ri="${ri}">Oui</button> <button class="lnk" data-action="cancelCancel">Non</button></span>`
        : `<button class="lnk" data-action="askCancel" data-ri="${ri}">Annuler</button>`;
    h += `</div>`;
    rd.courts.forEach((_, ci) => {
      h += renderCourt(t, ri, ci);
    });
    if (rd.bench && rd.bench.length) {
      h += `<div class="bench"><b>En attente :</b> ${rd.bench.map((id) => esc(nameById(t.players, id))).join(", ")}</div>`;
    }
    h += `</div>`;
  }
  return h;
}
