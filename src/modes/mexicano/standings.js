// Mexicano — classement. Tri par victoires, puis défaites, puis différence de points.
import { fullName } from "../../core/players.js";

export function computeStandings(ctx) {
  const st = ctx.stats;
  const sign = (n) => (n > 0 ? "+" : "") + n;
  const arr = ctx.players.map((p) => ({
    playerId: p.id,
    name: fullName(p),
    comp: p.comp,
    j: st.played[p.id],
    v: st.wins[p.id],
    e: st.draws[p.id],
    d: st.losses[p.id],
    sets: st.setsWon[p.id] - st.setsLost[p.id], // différence de sets (peut être négative)
    diff: st.pf[p.id] - st.pa[p.id]
  }));
  // Tri : victoires, puis différence de sets, puis différence de points.
  arr.sort((a, b) => b.v - a.v || b.sets - a.sets || b.diff - a.diff);

  let rank = 0;
  let pv = null;
  let ps = null;
  let pdiff = null;
  let i = 0;
  return arr.map((p) => {
    i += 1;
    if (p.v !== pv || p.sets !== ps || p.diff !== pdiff) {
      rank = i;
      pv = p.v;
      ps = p.sets;
      pdiff = p.diff;
    }
    return {
      playerId: p.playerId,
      name: p.name,
      comp: p.comp,
      rank,
      cells: {
        J: p.j,
        V: p.v,
        E: p.e,
        D: p.d,
        S: sign(p.sets),
        "+/-": sign(p.diff)
      }
    };
  });
}
