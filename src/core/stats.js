// Statistiques mode-agnostiques : victoires/défaites/byes, points pour/contre,
// paires déjà jouées. Pur (état en entrée, objet en sortie). Réutilisé par les modes.
import { pairKey } from "./players.js";
import { winnerOf, courtPoints } from "./scoring.js";

export function computeStats(players, rounds, settings = {}) {
  const s = {
    wins: {},
    losses: {},
    played: {},
    assigned: {}, // nb de fois où le joueur a été placé sur un terrain
    byes: {}, // nb de tours en attente
    pf: {}, // points pour
    pa: {}, // points contre
    used: new Set() // paires déjà constituées (pairKey)
  };
  players.forEach((p) => {
    s.wins[p.id] = 0;
    s.losses[p.id] = 0;
    s.played[p.id] = 0;
    s.assigned[p.id] = 0;
    s.byes[p.id] = 0;
    s.pf[p.id] = 0;
    s.pa[p.id] = 0;
  });

  rounds.forEach((rd) => {
    (rd.courts || []).forEach((ct) => {
      [...ct.a, ...ct.b].forEach((id) => {
        if (s.assigned[id] != null) s.assigned[id] += 1;
      });
      s.used.add(pairKey(ct.a));
      s.used.add(pairKey(ct.b));

      const pts = courtPoints(ct);
      ct.a.forEach((id) => {
        if (s.pf[id] != null) {
          s.pf[id] += pts.A;
          s.pa[id] += pts.B;
        }
      });
      ct.b.forEach((id) => {
        if (s.pf[id] != null) {
          s.pf[id] += pts.B;
          s.pa[id] += pts.A;
        }
      });

      const w = winnerOf(ct, settings);
      if (w) {
        const winTeam = w === "A" ? ct.a : ct.b;
        const loseTeam = w === "A" ? ct.b : ct.a;
        winTeam.forEach((id) => {
          if (s.wins[id] != null) {
            s.wins[id] += 1;
            s.played[id] += 1;
          }
        });
        loseTeam.forEach((id) => {
          if (s.losses[id] != null) {
            s.losses[id] += 1;
            s.played[id] += 1;
          }
        });
      }
    });
    (rd.bench || []).forEach((id) => {
      if (s.byes[id] != null) s.byes[id] += 1;
    });
  });

  return s;
}
