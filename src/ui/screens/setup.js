// Écran de création d'un tournoi : nom + format + réglages + joueurs (+ paires fixes).
// Un `draft` local (module) tient les saisies tant que le tournoi n'est pas créé ;
// les actions sont renvoyées à app.js qui re-render après chaque mutation.
import { listModes, getMode } from "../../modes/index.js";
import { renderPlayerEditor } from "../components/playerList.js";
import { renderPairEditor } from "../components/pairEditor.js";
import { esc, escAttr } from "../escape.js";
import { createTournament, resetAll } from "../../state/store.js";
import { describeScoring } from "../../core/scoring.js";

let draft = null;

// --- Paires fixes : on tient un ordre de sièges (`pairSeats`), les paires = sièges consécutifs.
function seedPairSeats(players) {
  const ordered = [...players].sort((a, b) => Number(b.comp) - Number(a.comp));
  const ids = ordered.map((p) => p.id);
  const seats = [];
  let i = 0;
  let j = ids.length - 1;
  while (i < j) {
    seats.push(ids[i], ids[j]); // fort + faible
    i += 1;
    j -= 1;
  }
  if (i === j) seats.push(ids[i]); // milieu impair : non apparié (toujours au repos)
  return seats;
}

function pairsFromSeats(seats) {
  const pairs = [];
  for (let k = 0; k + 1 < seats.length; k += 2) pairs.push([seats[k], seats[k + 1]]);
  return pairs;
}

// Garde draft.pairSeats cohérent avec la liste de joueurs (auto si non édité à la main).
function syncPairSeats() {
  if (!draft) return;
  const ids = draft.players.map((p) => p.id);
  if (!draft.pairsManual || !draft.pairSeats) {
    draft.pairSeats = seedPairSeats(draft.players);
    return;
  }
  draft.pairSeats = draft.pairSeats.filter((id) => ids.includes(id));
  ids.forEach((id) => {
    if (!draft.pairSeats.includes(id)) draft.pairSeats.push(id);
  });
}

// Pré-remplit le brouillon à partir d'un tournoi existant (retour à l'édition après « Quitter »).
export function seedDraft(t) {
  const hasPairs = !!(t.pairs && t.pairs.length);
  draft = {
    name: t.name || "",
    modeId: t.modeId,
    players: t.players.map((p) => ({ id: p.id, prenom: p.prenom, nom: p.nom, comp: !!p.comp })),
    nextId: t.players.reduce((m, p) => Math.max(m, p.id), 0) + 1,
    newComp: false,
    newP: "",
    newN: "",
    settings: { ...t.settings },
    pairSeats: hasPairs ? t.pairs.flat() : null,
    pairsManual: hasPairs,
    pairSel: null
  };
}

function defaultSettings(modeId, base = {}) {
  const opts = getMode(modeId).options ? getMode(modeId).options(base) : [];
  const s = { ...base };
  opts.forEach((o) => {
    if (s[o.key] === undefined) s[o.key] = o.default;
  });
  return s;
}

// Recale les réglages sur les options actuellement valides (dépendantes du format) : retire
// les clés devenues hors-sujet, remplace une valeur invalide par le défaut applicable.
function normalizeSettings() {
  const opts = getMode(draft.modeId).options(draft.settings);
  const next = {};
  opts.forEach((o) => {
    const cur = draft.settings[o.key];
    if (o.type === "select") {
      const ok = (o.choices || []).some((c) => String(c.value) === String(cur));
      next[o.key] = ok ? cur : o.default;
    } else {
      next[o.key] = cur ?? o.default;
    }
  });
  draft.settings = next;
}

function initDraft() {
  const first = listModes()[0];
  draft = {
    name: "",
    modeId: first.id,
    players: [],
    nextId: 1,
    newComp: false,
    newP: "",
    newN: "",
    settings: defaultSettings(first.id),
    pairSeats: null,
    pairsManual: false,
    pairSel: null
  };
}

// Capture les <input> transitoires (non re-render à chaque frappe) avant un re-render.
function syncInputs() {
  const n = document.getElementById("su_name");
  if (n) draft.name = n.value;
  const p = document.getElementById("su_np_p");
  if (p) draft.newP = p.value;
  const nm = document.getElementById("su_np_n");
  if (nm) draft.newN = nm.value;
  const opts = getMode(draft.modeId).options ? getMode(draft.modeId).options(draft.settings) : [];
  opts.forEach((o) => {
    const el = document.getElementById(`su_opt_${o.key}`);
    if (el) draft.settings[o.key] = el.value === "" ? o.default : Number(el.value);
  });
}

// Met à jour l'état activé/désactivé du bouton « Créer » sans re-render (préserve le focus).
function refreshCreateButton() {
  const btn = document.querySelector('[data-action="su_create"]');
  if (!btn || !draft) return;
  const val = getMode(draft.modeId).validate(draft.players, draft.settings);
  btn.disabled = !(val.ok && draft.name.trim().length > 0);
}

function fieldVal(id) {
  const e = document.getElementById(id);
  return e ? e.value.trim() : "";
}

function isFixedDouble() {
  return draft.settings.format !== "simple" && draft.settings.partners === "fixes";
}

export function renderSetup() {
  if (!draft) initDraft();
  const mode = getMode(draft.modeId);
  const opts = mode.options ? mode.options(draft.settings) : [];

  let h = `<div class="panel">
    <div class="fld"><label>Nom du tournoi</label>
      <input id="su_name" placeholder="Ex. Tournoi du mardi" value="${escAttr(draft.name)}"></div>
  </div>`;

  h += `<div class="panel"><div class="ttl">Réglages</div>`;

  if (opts.length) {
    opts.forEach((o) => {
      const cur = draft.settings[o.key] ?? o.default;
      h += `<div class="fld" style="margin-top:10px"><label>${esc(o.label)}</label>`;
      if (o.type === "select") {
        h += `<div class="choices">`;
        (o.choices || []).forEach((c) => {
          h += `<button type="button" class="chip${String(cur) === String(c.value) ? " on" : ""}" data-action="su_setOptChoice" data-key="${o.key}" data-numeric="${o.numeric ? 1 : ""}" data-value="${escAttr(String(c.value))}">${esc(c.label)}</button>`;
        });
        h += `</div>`;
      } else {
        h += `<input id="su_opt_${o.key}" type="number" min="${o.min ?? 0}" value="${cur}" data-action="su_setOpt" data-key="${o.key}">`;
      }
      h += `</div>`;
    });
    h += `<p class="hint">${esc(describeScoring(draft.settings))}</p>`;
  }
  h += `</div>`;

  h += renderPlayerEditor(draft.players, draft.newComp, "su_", { p: draft.newP, n: draft.newN });

  if (isFixedDouble()) {
    syncPairSeats();
    h += renderPairEditor(draft.players, draft.pairSeats, draft.pairSel);
  }

  const val = mode.validate(draft.players, draft.settings);
  const can = val.ok && draft.name.trim().length > 0;
  h += `<button class="btn" style="margin-top:12px" ${can ? "" : "disabled"} data-action="su_create">Créer le tournoi</button>`;
  if (!val.ok) h += `<p class="hint">${esc(val.message || "")}</p>`;
  else if (!draft.name.trim()) h += `<p class="hint">Donne un nom au tournoi.</p>`;
  if (draft.players.length || draft.name.trim()) {
    h += `<button class="btn-reset" data-action="su_reset">↺ Remise à zéro</button>`;
  }
  return h;
}

// Actions de l'écran de création. Retour `true` => app.js doit re-render.
// (su_create passe par le store qui déclenche déjà le re-render.)
export const setupActions = {
  // Réglage choisi via un bouton (chip) : on mémorise (texte ou nombre), on recale les
  // réglages dépendants, et on re-render (surlignage + récap + options conditionnelles).
  su_setOptChoice(ds) {
    syncInputs();
    draft.settings[ds.key] = ds.numeric ? Number(ds.value) : ds.value;
    normalizeSettings();
    return true;
  },
  su_setOpt(ds, el) {
    // <input number> : saisie en direct, pas de re-render (sinon perte du focus).
    draft.settings[ds.key] = el.value === "" ? undefined : Number(el.value);
    return false;
  },
  // Saisie en direct des champs texte (nom du tournoi, prénom/nom du joueur).
  su_sync() {
    if (!draft) return false;
    syncInputs();
    refreshCreateButton();
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
    draft.newP = "";
    draft.newN = "";
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
    if (draft.pairSel === Number(ds.id)) draft.pairSel = null;
    return true;
  },
  // Paires fixes : régénération auto.
  su_seedPairs() {
    draft.pairsManual = false;
    draft.pairSeats = seedPairSeats(draft.players);
    draft.pairSel = null;
    return true;
  },
  // Paires fixes : 1er clic sélectionne un joueur, 2e clic permute les deux.
  su_selectForPair(ds) {
    const id = Number(ds.id);
    if (draft.pairSel == null) {
      draft.pairSel = id;
      return true;
    }
    if (draft.pairSel === id) {
      draft.pairSel = null;
      return true;
    }
    const seats = draft.pairSeats || [];
    const a = seats.indexOf(draft.pairSel);
    const b = seats.indexOf(id);
    if (a !== -1 && b !== -1) {
      [seats[a], seats[b]] = [seats[b], seats[a]];
      draft.pairsManual = true;
    }
    draft.pairSel = null;
    return true;
  },
  su_reset() {
    if (!window.confirm("Tout effacer et repartir d'une page vierge ?")) return false;
    initDraft();
    resetAll();
    return true;
  },
  su_create() {
    syncInputs();
    const pairs = isFixedDouble() ? pairsFromSeats(draft.pairSeats || []) : [];
    createTournament({
      name: draft.name.trim(),
      modeId: draft.modeId,
      settings: draft.settings,
      players: draft.players,
      pairs
    });
    draft = null;
    return false;
  }
};
