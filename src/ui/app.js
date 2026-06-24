// Montage + rendu + délégation d'événements (pas de onclick inline -> compatible CSP/PWA).
import { getState, subscribe, activeTournament } from "../state/store.js";
import * as store from "../state/store.js";
import { renderSetup, setupActions, seedDraft } from "./screens/setup.js";
import { renderRondes } from "./screens/rondes.js";
import { renderJoueurs } from "./screens/joueurs.js";
import { renderClassement } from "./screens/classement.js";
import { renderNav } from "./components/nav.js";
import { getMode } from "../modes/index.js";

export function mount(root) {
  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("input", onInput);
  subscribe(render); // les actions du store déclenchent le re-render
  render();
}

function render() {
  const t = activeTournament();
  const sub = document.getElementById("sub");
  const view = document.getElementById("view");
  const nav = document.getElementById("nav");

  if (!t) {
    view.innerHTML = renderSetup();
    nav.innerHTML = "";
    sub.textContent = "Nouveau tournoi";
    return;
  }

  const ui = getState().ui;
  view.innerHTML =
    ui.tab === "joueurs" ? renderJoueurs(t) : ui.tab === "classement" ? renderClassement(t) : renderRondes(t);
  nav.innerHTML = renderNav(ui.tab);
  const mode = getMode(t.modeId);
  sub.textContent = `${mode.name} · ${t.players.length} joueurs`;
}

function inputVal(id) {
  const e = document.getElementById(id);
  return e ? e.value.trim() : "";
}

// Actions du tournoi actif (le store appelle commit() -> re-render via subscribe).
const storeActions = {
  tab: (ds) => store.setTab(ds.tab),
  closeTournament: () => {
    const t = activeTournament();
    if (!t) return;
    if (!window.confirm("Quitter ce tournoi ? Les rondes seront abandonnées, mais tu retrouveras le format, les réglages et les joueurs sur l'écran de création.")) return;
    seedDraft(t); // recopie les paramètres dans le brouillon avant d'abandonner
    store.discardActiveTournament();
  },
  generer: () => store.generer(),
  askCancel: (ds) => store.askCancel(Number(ds.ri)),
  cancelCancel: () => store.cancelCancel(),
  doCancel: (ds) => store.doCancel(Number(ds.ri)),
  addPlayer: () => {
    const p = inputVal("np_p");
    const n = inputVal("np_n");
    if (p || n) store.addPlayer(p, n);
  },
  toggleNewComp: () => store.toggleNewComp(),
  toggleComp: (ds) => store.toggleComp(Number(ds.id)),
  delPlayer: (ds) => store.delPlayer(Number(ds.id))
};

function onClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  if (action === "score") return; // géré au change

  if (setupActions[action]) {
    e.preventDefault();
    const needsRender = setupActions[action](el.dataset, el);
    if (needsRender) render();
    return;
  }
  if (storeActions[action]) {
    e.preventDefault();
    storeActions[action](el.dataset, el);
  }
}

function onChange(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  if (action === "score") {
    store.setScore(Number(el.dataset.ri), Number(el.dataset.ci), Number(el.dataset.si), el.dataset.side, el.value);
  } else if (action === "su_setOpt") {
    const needsRender = setupActions.su_setOpt(el.dataset, el);
    if (needsRender) render();
  }
}

// Saisie en direct (écran de création) : mémorise les champs texte dans le draft et
// rafraîchit le bouton « Créer » sans re-render (préserve le focus). Les ids "su_*"
// n'existent que sur l'écran de création.
function onInput(e) {
  const el = e.target;
  if (el && el.id && el.id.startsWith("su_") && setupActions.su_sync) {
    setupActions.su_sync();
  }
}
