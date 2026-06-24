// Écran de création d'un tournoi : nom + choix du format + réglages + joueurs.
// Remplace l'ancienne liste de 16 joueurs codée en dur : on démarre vide.
// Un `draft` local (module) tient les saisies tant que le tournoi n'est pas créé ;
// les actions sont renvoyées à app.js qui re-render après chaque mutation.
import { listModes, getMode } from "../../modes/index.js";
import { renderPlayerEditor } from "../components/playerList.js";
import { esc, escAttr } from "../escape.js";
import { createTournament } from "../../state/store.js";

let draft = null;

function defaultSettings(modeId) {
  const opts = getMode(modeId).options ? getMode(modeId).options() : [];
  const s = {};
  opts.forEach((o) => (s[o.key] = o.default));
  return s;
}

function initDraft() {
  const first = listModes()[0];
  draft = {
    name: "",
    modeId: first.id,
    players: [],
    nextId: 1,
    newComp: false,
    settings: defaultSettings(first.id)
  };
}

// Capture les <input> transitoires (non re-render à chaque frappe) avant un re-render.
function syncInputs() {
  const n = document.getElementById("su_name");
  if (n) draft.name = n.value;
  const opts = getMode(draft.modeId).options ? getMode(draft.modeId).options() : [];
  opts.forEach((o) => {
    const el = document.getElementById(`su_opt_${o.key}`);
    if (el) draft.settings[o.key] = el.value === "" ? o.default : Number(el.value);
  });
}

function fieldVal(id) {
  const e = document.getElementById(id);
  return e ? e.value.trim() : "";
}

export function renderSetup() {
  if (!draft) initDraft();
  const modes = listModes();
  const mode = getMode(draft.modeId);
  const opts = mode.options ? mode.options() : [];

  let h = `<div class="panel">
    <div class="fld"><label>Nom du tournoi</label>
      <input id="su_name" placeholder="Ex. Tournoi du mardi" value="${escAttr(draft.name)}"></div>
  </div>`;

  h += `<div class="panel"><div class="ttl">Format</div><div class="modes">`;
  modes.forEach((m) => {
    h += `<button class="modecard${m.id === draft.modeId ? " on" : ""}" data-action="su_selectMode" data-mode="${m.id}">
      <div class="mname">${esc(m.name)}</div><div class="mdesc">${esc(m.description)}</div></button>`;
  });
  h += `</div>`;

  if (opts.length) {
    h += `<div class="opts">`;
    opts.forEach((o) => {
      h += `<div class="fld"><label>${esc(o.label)}</label>
        <input id="su_opt_${o.key}" type="number" min="${o.min ?? 0}" value="${draft.settings[o.key] ?? o.default}" data-action="su_setOpt" data-key="${o.key}"></div>`;
    });
    h += `</div>`;
  }
  h += `</div>`;

  h += renderPlayerEditor(draft.players, draft.newComp, "su_");

  const val = mode.validate(draft.players);
  const can = val.ok && draft.name.trim().length > 0;
  h += `<button class="btn" style="margin-top:12px" ${can ? "" : "disabled"} data-action="su_create">Créer le tournoi</button>`;
  if (!val.ok) h += `<p class="hint">${esc(val.message || "")}</p>`;
  else if (!draft.name.trim()) h += `<p class="hint">Donne un nom au tournoi.</p>`;
  return h;
}

// Actions de l'écran de création. Retour `true` => app.js doit re-render.
// (su_create passe par le store qui déclenche déjà le re-render.)
export const setupActions = {
  su_selectMode(ds) {
    syncInputs();
    draft.modeId = ds.mode;
    draft.settings = defaultSettings(draft.modeId);
    return true;
  },
  su_setOpt(ds, el) {
    // saisie en direct : pas de re-render (sinon perte du focus)
    draft.settings[ds.key] = el.value === "" ? undefined : Number(el.value);
    return false;
  },
  su_toggleNewComp() {
    syncInputs();
    draft.newComp = !draft.newComp;
    return true;
  },
  su_addPlayer() {
    syncInputs();
    const p = fieldVal("su_np_p");
    const n = fieldVal("su_np_n");
    if (!p && !n) return false;
    draft.players.push({ id: draft.nextId++, prenom: p, nom: n, comp: draft.newComp });
    draft.newComp = false;
    return true;
  },
  su_toggleComp(ds) {
    syncInputs();
    const pl = draft.players.find((x) => x.id === Number(ds.id));
    if (pl) pl.comp = !pl.comp;
    return true;
  },
  su_delPlayer(ds) {
    syncInputs();
    draft.players = draft.players.filter((x) => x.id !== Number(ds.id));
    return true;
  },
  su_create() {
    syncInputs();
    createTournament({
      name: draft.name.trim(),
      modeId: draft.modeId,
      settings: draft.settings,
      players: draft.players
    });
    draft = null;
    return false;
  }
};
