// Mexicano — classement. Tri par victoires, puis défaites, puis différence de points.
import { fullName } from "../../core/players.js";

export function computeStandings(ctx) {
  const st = ctx.stats;
  const arr = ctx.players.map((p) => ({
    playerId: p.id,
    name: fullName(p),
    comp: p.comp,
    v: st.wins[p.id],
    d: st.losses[p.id],
    byes: st.byes[p.id],
    diff: st.pf[p.id] - st.pa[p.id]
  }));
  arr.sort((a, b) => b.v - a.v || a.d - b.d || b.diff - a.diff);

  let rank = 0;
  let pv = null;
  let pd = null;
  let pdiff = null;
  let i = 0;
  return arr.map((p) => {
    i += 1;
    if (p.v !== pv || p.d !== pd || p.diff !== pdiff) {
      rank = i;
      pv = p.v;
      pd = p.d;
      pdiff = p.diff;
    }
    return {
      playerId: p.playerId,
      name: p.name,
      comp: p.comp,
      rank,
      cells: {
        V: p.v,
        D: p.d,
        "+/-": (p.diff > 0 ? "+" : "") + p.diff,
        "⏸": p.byes
      }
    };
  });
}
