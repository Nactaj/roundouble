// Écran « Joueurs » du tournoi actif.
import { renderPlayerEditor } from "../components/playerList.js";
import { getState } from "../../state/store.js";

export function renderJoueurs(t) {
  return (
    renderPlayerEditor(t.players, getState().ui.newComp, "") +
    `<p class="hint" style="text-align:left;font-size:12px;">★ = compétiteur (tête de série). Un ajout entre dès la prochaine ronde.</p>`
  );
}
