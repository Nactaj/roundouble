// Mode Mexicano — génération des rondes. Portage fidèle de l'algorithme d'origine
// (genRound) : on banque len%4 joueurs, on forme des équipes fort+faible à
// partenaires tournants, en minimisant la réutilisation de paires puis la variance
// des niveaux d'équipe, et on oppose terrain fort vs terrain faible.
import { pairKey } from "../../core/players.js";
import { winnerOf } from "../../core/scoring.js";

export function generateRound(ctx) {
  const { players, stats: st } = ctx;
  const benchN = players.length % 4;

  // Mise en attente : priorité à ceux qui ont le plus joué, puis le moins de byes.
  const bench = [...players]
    .sort((p, q) => {
      if (st.assigned[q.id] !== st.assigned[p.id]) return st.assigned[q.id] - st.assigned[p.id];
      if (st.byes[p.id] !== st.byes[q.id]) return st.byes[p.id] - st.byes[q.id];
      return p.id - q.id;
    })
    .slice(0, benchN)
    .map((p) => p.id);

  const bs = new Set(bench);
  const playing = players.filter((p) => !bs.has(p.id));
  const H = playing.length / 2;
  const NC = playing.length / 4;

  // Classement de force : victoires (poids fort), bonus compétiteur, ordre d'inscription.
  const idx = {};
  players.forEach((p, i) => (idx[p.id] = i));
  const sc = {};
  playing.forEach((p) => (sc[p.id] = st.wins[p.id] * 1000 + (p.comp ? 100 : 0) - idx[p.id]));
  const seat = [...playing].sort((a, b) => sc[b.id] - sc[a.id]).map((p) => p.id);

  // Cherche le décalage de rotation minimisant la réutilisation de paires, puis la variance.
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

  // Oppose les équipes par niveau : la plus forte contre la plus faible, etc.
  const order = best.teams
    .map((t, i) => ({ i, total: t[0] + t[1] }))
    .sort((a, b) => a.total - b.total)
    .map((o) => o.i);

  const courts = [];
  for (let k = 0; k < NC; k += 1) {
    const tA = best.teams[order[k]];
    const tB = best.teams[order[H - 1 - k]];
    courts.push({
      a: [seat[tA[0] - 1], seat[tA[1] - 1]],
      b: [seat[tB[0] - 1], seat[tB[1] - 1]],
      sets: []
    });
  }
  return { courts, bench };
}

export function canGenerateNext(ctx) {
  if (ctx.players.length < 4) return { ok: false, message: "Ajoute au moins 4 joueurs." };
  const { rounds, settings } = ctx;
  if (rounds.length === 0) return { ok: true };
  const last = rounds[rounds.length - 1];
  const done = last.courts.every((c) => winnerOf(c, settings) !== null);
  if (!done) {
    return {
      ok: false,
      message: `Termine tous les matchs de la ronde ${rounds.length} avant de générer la suivante.`
    };
  }
  return { ok: true };
}
