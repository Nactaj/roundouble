// Statistiques mode-agnostiques : victoires/défaites/byes, points pour/contre,
// paires déjà jouées. Pur (état en entrée, objet en sortie). Réutilisé par les modes.
import { pairKey } from "./players.js";
import { matchOutcome, setWinner, courtPoints } from "./scoring.js";

export function computeStats(players, rounds, settings = {}) {
  const s = {
    wins: {},
    losses: {},
    draws: {}, // matchs nuls (sets à égalité, possible si setsCount pair)
    played: {},
    assigned: {}, // nb de fois où le joueur a été placé sur un terrain
    byes: {}, // nb de tours en attente
    pf: {}, // points pour
    pa: {}, // points contre
    setsWon: {}, // nb de sets gagnés
    setsLost: {}, // nb de sets perdus
    used: new Set() // paires déjà constituées (pairKey)
  };
  players.forEach((p) => {
    s.wins[p.id] = 0;
    s.losses[p.id] = 0;
    s.draws[p.id] = 0;
    s.played[p.id] = 0;
    s.assigned[p.id] = 0;
    s.byes[p.id] = 0;
    s.pf[p.id] = 0;
    s.pa[p.id] = 0;
    s.setsWon[p.id] = 0;
    s.setsLost[p.id] = 0;
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

      // Sets gagnés / perdus (set par set).
      (ct.sets || []).forEach((set) => {
        const sw = setWinner(set, settings);
        if (!sw) return;
        const won = sw === "A" ? ct.a : ct.b;
        const lost = sw === "A" ? ct.b : ct.a;
        won.forEach((id) => {
          if (s.setsWon[id] != null) s.setsWon[id] += 1;
        });
        lost.forEach((id) => {
          if (s.setsLost[id] != null) s.setsLost[id] += 1;
        });
      });

      const out = matchOutcome(ct, settings);
      if (out === "A" || out === "B") {
        const winTeam = out === "A" ? ct.a : ct.b;
        const loseTeam = out === "A" ? ct.b : ct.a;
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
      } else if (out === "draw") {
        [...ct.a, ...ct.b].forEach((id) => {
          if (s.draws[id] != null) {
            s.draws[id] += 1;
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
