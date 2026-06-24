// Éditeur de joueurs réutilisable (panneau d'ajout + liste).
// `ns` = préfixe d'espace de noms des actions/ids pour distinguer l'écran de création
// ("su_") du tournoi actif (""), qui n'utilisent pas le même flux de données.
import { esc } from "../escape.js";
import { fullName } from "../../core/players.js";

export function renderPlayerEditor(players, newComp, ns = "") {
  let h = `<div class="panel">
    <div class="ttl">Ajouter un joueur</div>
    <div class="row"><input id="${ns}np_p" placeholder="Prénom"><input id="${ns}np_n" placeholder="Nom"></div>
    <div class="row" style="margin-top:8px;justify-content:space-between;align-items:center;">
      <button class="chip${newComp ? " on" : ""}" data-action="${ns}toggleNewComp">★ Compétiteur ${newComp ? "oui" : "non"}</button>
      <button class="add" data-action="${ns}addPlayer">Ajouter</button>
    </div>
  </div>`;

  h += `<div class="plist">`;
  players.forEach((p) => {
    h += `<div class="pitem"><span>${esc(fullName(p))}</span><span>
      <button class="mini${p.comp ? " on" : ""}" data-action="${ns}toggleComp" data-id="${p.id}">★</button>
      <button class="del" data-action="${ns}delPlayer" data-id="${p.id}">×</button></span></div>`;
  });
  h += `</div>`;
  return h;
}
