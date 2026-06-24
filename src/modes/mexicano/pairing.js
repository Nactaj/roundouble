// Helpers d'appariement du mode mexicano généralisé. Purs (entrée = ctx, sortie = données),
// hormis Math.random dans la règle "aleatoire". L'unité d'appariement est soit un joueur
// (simple, ids=[id]) soit une équipe de 2 (double, ids=[id,id]).
import { pairKey } from "../../core/players.js";

// Lit la configuration depuis ctx.settings, avec repli sur le comportement Mexicano d'origine
// (double / tournants / equilibre) — garantit la rétrocompatibilité des tournois persistés.
export function readConfig(ctx) {
  const s = ctx.settings || {};
  const format = s.format === "simple" ? "simple" : "double";
  const partners = format === "double" && s.partners === "fixes" ? "fixes" : "tournants";
  const equilibreOk = format === "double" && partners === "tournants";
  let pairing = s.pairing;
  if (!["equilibre", "niveau", "aleatoire"].includes(pairing) || (pairing === "equilibre" && !equilibreOk)) {
    pairing = equilibreOk ? "equilibre" : "niveau";
  }
  return { format, partners, pairing };
}

// Force d'amorçage d'un joueur : victoires (poids fort), bonus compétiteur, ordre d'inscription.
export function strengthScore(ctx) {
  const { players, stats: st } = ctx;
  const idx = {};
  players.forEach((p, i) => (idx[p.id] = i));
  return (id) => {
    const p = players.find((x) => x.id === id);
    return (st.wins[id] || 0) * 1000 + (p && p.comp ? 100 : 0) - (idx[id] ?? 0);
  };
}

// Bilan d'une unité (somme sur ses joueurs) : victoires, diff. de sets, diff. de points.
function unitStanding(ids, st) {
  let w = 0;
  let sd = 0;
  let pd = 0;
  ids.forEach((id) => {
    w += st.wins[id] || 0;
    sd += (st.setsWon[id] || 0) - (st.setsLost[id] || 0);
    pd += (st.pf[id] || 0) - (st.pa[id] || 0);
  });
  return { w, sd, pd };
}

// Tri d'unités par bilan (comme le classement) puis force d'amorçage.
function cmpUnits(a, b) {
  return b.st.w - a.st.w || b.st.sd - a.st.sd || b.st.pd - a.st.pd || b.strength - a.strength;
}

const makeCourt = (a, b) => ({ a: [...a], b: [...b], sets: [] });

// Clé canonique d'une rencontre (les deux équipes, ordre indépendant) — pour l'évitement.
function opponentKey(a, b) {
  const ka = [...a].sort((x, y) => x - y).join(",");
  const kb = [...b].sort((x, y) => x - y).join(",");
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

// Ensemble des rencontres déjà jouées (toutes rondes), pour éviter de les rejouer.
function recentOpponents(ctx) {
  const seen = new Set();
  (ctx.rounds || []).forEach((rd) =>
    (rd.courts || []).forEach((c) => seen.add(opponentKey(c.a, c.b)))
  );
  return seen;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Ordre de mise au banc : priorité à ceux qui ont le plus joué, puis le moins de byes.
function orderForBench(ctx) {
  const { players, stats: st } = ctx;
  return [...players].sort((p, q) => {
    if (st.assigned[q.id] !== st.assigned[p.id]) return st.assigned[q.id] - st.assigned[p.id];
    if (st.byes[p.id] !== st.byes[q.id]) return st.byes[p.id] - st.byes[q.id];
    return p.id - q.id;
  });
}

// Banc générique : on banque players%mod joueurs (mod = 2 simple, 4 double tournants).
export function selectBench(ctx, mod) {
  const benchN = ctx.players.length % mod;
  const ordered = orderForBench(ctx);
  const bench = ordered.slice(0, benchN).map((p) => p.id);
  const bs = new Set(bench);
  const playing = ctx.players.filter((p) => !bs.has(p.id)).map((p) => p.id);
  return { bench, playing };
}

// Banc pour paires fixes : on banque des paires entières (paires%2). Une paire n'est jouante
// que si ses 2 joueurs sont présents ; un joueur sans paire valide est mis au banc d'office.
export function selectBenchPairs(ctx) {
  const present = new Set(ctx.players.map((p) => p.id));
  const pairs = (ctx.pairs || []).filter((p) => present.has(p[0]) && present.has(p[1]));
  const covered = new Set();
  pairs.forEach((p) => {
    covered.add(p[0]);
    covered.add(p[1]);
  });
  const forced = ctx.players.filter((p) => !covered.has(p.id)).map((p) => p.id);

  const st = ctx.stats;
  const load = (pr) => (st.assigned[pr[0]] || 0) + (st.assigned[pr[1]] || 0);
  const byes = (pr) => (st.byes[pr[0]] || 0) + (st.byes[pr[1]] || 0);
  const ordered = [...pairs].sort((a, b) => load(b) - load(a) || byes(a) - byes(b) || a[0] - b[0]);
  const benchPairs = ordered.slice(0, pairs.length % 2);
  const benchSet = new Set(benchPairs.map((p) => pairKey(p)));
  const playingPairs = pairs.filter((p) => !benchSet.has(pairKey(p)));
  return { benchIds: [...forced, ...benchPairs.flat()], playingPairs };
}

// --- Règle "equilibre" : Mexicano classique (double / tournants). Code d'origine conservé :
// équipes fort+faible à partenaires tournants, minimise la réutilisation de paires puis la
// variance des niveaux, et oppose terrain fort vs terrain faible.
export function mexicanoCourts(ctx) {
  const { stats: st } = ctx;
  const { bench, playing } = selectBench(ctx, 4);
  const score = strengthScore(ctx);
  const seat = [...playing].sort((a, b) => score(b) - score(a));
  const H = playing.length / 2;
  const NC = playing.length / 4;

  let best = null;
  for (let off = 0; off < H; off += 1) {
    let reuse = 0;
    const tot = [];
    const teams = [];
    for (let i = 1; i <= H; i += 1) {
      const w = H + (((H - i) + off) % H) + 1;
      teams.push([i, w]);
      tot.push(i + w);
      if (st.used.has(pairKey([seat[i - 1], seat[w - 1]]))) reuse += 1;
    }
    const m = tot.reduce((a, b) => a + b, 0) / H;
    const vc = tot.reduce((a, b) => a + (b - m) * (b - m), 0) / H;
    if (!best || reuse < best.reuse || (reuse === best.reuse && vc < best.vc)) {
      best = { reuse, vc, teams };
    }
  }

  const order = best.teams
    .map((t, i) => ({ i, total: t[0] + t[1] }))
    .sort((a, b) => a.total - b.total)
    .map((o) => o.i);

  const courts = [];
  for (let k = 0; k < NC; k += 1) {
    const tA = best.teams[order[k]];
    const tB = best.teams[order[H - 1 - k]];
    courts.push(makeCourt([seat[tA[0] - 1], seat[tA[1] - 1]], [seat[tB[0] - 1], seat[tB[1] - 1]]));
  }
  return { courts, bench };
}

// --- Règle "niveau" (double / tournants) : on regroupe les 4 joueurs de bilan le plus
// proche sur un terrain, avec partenaires équilibrés (fort+faible) à l'intérieur.
export function doublesByLevelCourts(ctx) {
  const { stats: st } = ctx;
  const { bench, playing } = selectBench(ctx, 4);
  const score = strengthScore(ctx);
  const units = playing.map((id) => ({ id, strength: score(id), st: unitStanding([id], st) }));
  units.sort(cmpUnits);
  const sorted = units.map((u) => u.id);

  const courts = [];
  for (let k = 0; k + 3 < sorted.length; k += 4) {
    const g = [sorted[k], sorted[k + 1], sorted[k + 2], sorted[k + 3]];
    // Arrangements internes (le 1er est équilibré fort+faible) : on garde celui qui évite le
    // plus la réutilisation de paires ; égalité -> arrangement équilibré par défaut.
    const arrangements = [
      [[g[0], g[3]], [g[1], g[2]]],
      [[g[0], g[2]], [g[1], g[3]]],
      [[g[0], g[1]], [g[2], g[3]]]
    ];
    let bestArr = null;
    arrangements.forEach((arr) => {
      const reuse = (st.used.has(pairKey(arr[0])) ? 1 : 0) + (st.used.has(pairKey(arr[1])) ? 1 : 0);
      if (!bestArr || reuse < bestArr.reuse) bestArr = { arr, reuse };
    });
    courts.push(makeCourt(bestArr.arr[0], bestArr.arr[1]));
  }
  return { courts, bench };
}

// --- Règle "aleatoire" (double / tournants) : partenaires et adversaires tirés au sort, en
// minimisant la réutilisation de paires et le réappariement d'adversaires (plusieurs essais).
export function doublesRandomCourts(ctx) {
  const { stats: st } = ctx;
  const { bench, playing } = selectBench(ctx, 4);
  const seen = recentOpponents(ctx);
  let best = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const p = shuffle([...playing]);
    const courts = [];
    let penalty = 0;
    for (let k = 0; k + 3 < p.length; k += 4) {
      const tA = [p[k], p[k + 1]];
      const tB = [p[k + 2], p[k + 3]];
      if (st.used.has(pairKey(tA))) penalty += 1;
      if (st.used.has(pairKey(tB))) penalty += 1;
      if (seen.has(opponentKey(tA, tB))) penalty += 2;
      courts.push(makeCourt(tA, tB));
    }
    if (!best || penalty < best.penalty) best = { courts, penalty };
    if (penalty === 0) break;
  }
  return { courts: best.courts, bench };
}

// --- Règle "niveau" générique (ronde suisse) sur une liste d'unités déjà construites
// (simple ou paires fixes). On classe par bilan et on apparie le haut avec l'unité suivante
// non encore affrontée (report flottant si un bilan a un effectif impair).
export function matchBySwiss(units, ctx) {
  const seen = recentOpponents(ctx);
  const sorted = [...units].sort(cmpUnits);
  const used = new Array(sorted.length).fill(false);
  const courts = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;
    let chosen = -1;
    let fallback = -1;
    for (let k = i + 1; k < sorted.length; k += 1) {
      if (used[k]) continue;
      if (fallback === -1) fallback = k;
      if (!seen.has(opponentKey(sorted[i].ids, sorted[k].ids))) {
        chosen = k;
        break;
      }
    }
    const opp = chosen !== -1 ? chosen : fallback;
    if (opp === -1) break; // unité orpheline (ne devrait pas arriver, le banc garantit le pair)
    used[opp] = true;
    courts.push(makeCourt(sorted[i].ids, sorted[opp].ids));
  }
  return courts;
}

// --- Règle "aleatoire" générique sur une liste d'unités (simple ou paires fixes).
export function matchByRandom(units, ctx) {
  const seen = recentOpponents(ctx);
  let best = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const u = shuffle([...units]);
    const courts = [];
    let penalty = 0;
    for (let i = 0; i + 1 < u.length; i += 2) {
      if (seen.has(opponentKey(u[i].ids, u[i + 1].ids))) penalty += 1;
      courts.push(makeCourt(u[i].ids, u[i + 1].ids));
    }
    if (!best || penalty < best.penalty) best = { courts, penalty };
    if (penalty === 0) break;
  }
  return best ? best.courts : [];
}

// Construit les unités (simple : 1 joueur ; double fixes : 1 paire) avec leur bilan/force.
export function buildUnits(idsList, ctx) {
  const score = strengthScore(ctx);
  return idsList.map((ids) => ({
    ids,
    strength: ids.reduce((s, id) => s + score(id), 0),
    st: unitStanding(ids, ctx.stats)
  }));
}
