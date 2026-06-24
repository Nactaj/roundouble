import { describe, it, expect, vi, afterEach } from "vitest";
import { generateRound, canGenerateNext } from "./engine.js";
import { readConfig } from "./pairing.js";
import { computeStats } from "../../core/stats.js";

// --- Helpers de test (mêmes données qu'un ctx réel, cf. store.ctxFor) ---
const mkPlayers = (n, comp = []) =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, prenom: `P${i + 1}`, nom: "", comp: comp.includes(i + 1) }));

const mkCtx = ({ players, rounds = [], settings = {}, pairs = [] }) => ({
  players,
  rounds,
  settings,
  pairs,
  stats: computeStats(players, rounds, settings)
});

// Invariants valables pour toute ronde générée, quel que soit le format.
function assertValidRound(round, players, teamSize) {
  const ids = [];
  round.courts.forEach((c) => {
    expect(c.a).toHaveLength(teamSize);
    expect(c.b).toHaveLength(teamSize);
    expect(Array.isArray(c.sets)).toBe(true);
    ids.push(...c.a, ...c.b);
  });
  ids.push(...round.bench);
  // chaque joueur apparaît au plus une fois...
  expect(new Set(ids).size).toBe(ids.length);
  // ...et tous les joueurs sont couverts (terrain ou banc).
  expect(new Set(ids)).toEqual(new Set(players.map((p) => p.id)));
}

describe("readConfig (défauts + normalisation)", () => {
  it("réglages absents -> Mexicano (double/tournants/equilibre)", () => {
    expect(readConfig(mkCtx({ players: mkPlayers(4) }))).toEqual({
      format: "double",
      partners: "tournants",
      pairing: "equilibre"
    });
  });
  it("equilibre invalide en simple -> niveau", () => {
    const cfg = readConfig(mkCtx({ players: mkPlayers(4), settings: { format: "simple", pairing: "equilibre" } }));
    expect(cfg).toEqual({ format: "simple", partners: "tournants", pairing: "niveau" });
  });
  it("equilibre invalide en paires fixes -> niveau", () => {
    const cfg = readConfig(
      mkCtx({ players: mkPlayers(4), settings: { format: "double", partners: "fixes", pairing: "equilibre" } })
    );
    expect(cfg.pairing).toBe("niveau");
  });
});

describe("Mexicano classique (double / tournants / equilibre)", () => {
  it("8 joueurs, ronde 1 : structure + golden", () => {
    const players = mkPlayers(8);
    const round = generateRound(mkCtx({ players, settings: {} }));
    assertValidRound(round, players, 2);
    expect(round.courts).toHaveLength(2);
    expect(round.bench).toEqual([]);
    expect(round).toMatchInlineSnapshot(`
      {
        "bench": [],
        "courts": [
          {
            "a": [
              1,
              8,
            ],
            "b": [
              4,
              5,
            ],
            "sets": [],
          },
          {
            "a": [
              2,
              7,
            ],
            "b": [
              3,
              6,
            ],
            "sets": [],
          },
        ],
      }
    `);
  });

  it("amorçage par victoires : les vainqueurs remontent (golden)", () => {
    const players = mkPlayers(8);
    const rounds = [
      {
        courts: [
          { a: [1, 2], b: [3, 4], sets: [[21, 10]] },
          { a: [5, 6], b: [7, 8], sets: [[21, 10]] }
        ],
        bench: []
      }
    ];
    const round = generateRound(mkCtx({ players, rounds, settings: { setsCount: 1, pointsMax: 21 } }));
    assertValidRound(round, players, 2);
    expect(round).toMatchInlineSnapshot(`
      {
        "bench": [],
        "courts": [
          {
            "a": [
              1,
              8,
            ],
            "b": [
              6,
              3,
            ],
            "sets": [],
          },
          {
            "a": [
              2,
              7,
            ],
            "b": [
              5,
              4,
            ],
            "sets": [],
          },
        ],
      }
    `);
  });

  it("6 joueurs : 2 mis au banc (len % 4)", () => {
    const players = mkPlayers(6);
    const round = generateRound(mkCtx({ players, settings: {} }));
    assertValidRound(round, players, 2);
    expect(round.courts).toHaveLength(1);
    expect(round.bench).toHaveLength(2);
  });
});

describe("Simple (1v1)", () => {
  it("5 joueurs / niveau : 1 au banc, courts 1v1 (golden)", () => {
    const players = mkPlayers(5);
    const round = generateRound(mkCtx({ players, settings: { format: "simple", pairing: "niveau" } }));
    assertValidRound(round, players, 1);
    expect(round.courts).toHaveLength(2);
    expect(round.bench).toHaveLength(1);
    expect(round).toMatchInlineSnapshot(`
      {
        "bench": [
          1,
        ],
        "courts": [
          {
            "a": [
              2,
            ],
            "b": [
              3,
            ],
            "sets": [],
          },
          {
            "a": [
              4,
            ],
            "b": [
              5,
            ],
            "sets": [],
          },
        ],
      }
    `);
  });
  it("6 joueurs / niveau : 0 au banc, 3 courts", () => {
    const players = mkPlayers(6);
    const round = generateRound(mkCtx({ players, settings: { format: "simple", pairing: "niveau" } }));
    assertValidRound(round, players, 1);
    expect(round.courts).toHaveLength(3);
    expect(round.bench).toEqual([]);
  });
});

describe("Double tournants / niveau (ronde suisse)", () => {
  it("8 joueurs : 2 courts 2v2 (golden)", () => {
    const players = mkPlayers(8);
    const round = generateRound(mkCtx({ players, settings: { format: "double", partners: "tournants", pairing: "niveau" } }));
    assertValidRound(round, players, 2);
    expect(round.courts).toHaveLength(2);
    expect(round).toMatchInlineSnapshot(`
      {
        "bench": [],
        "courts": [
          {
            "a": [
              1,
              4,
            ],
            "b": [
              2,
              3,
            ],
            "sets": [],
          },
          {
            "a": [
              5,
              8,
            ],
            "b": [
              6,
              7,
            ],
            "sets": [],
          },
        ],
      }
    `);
  });
});

describe("Double / paires fixes", () => {
  const fixed = { format: "double", partners: "fixes", pairing: "niveau" };

  it("3 paires : 1 paire entière au banc, terrains = paires exactes", () => {
    const players = mkPlayers(6);
    const pairs = [[1, 2], [3, 4], [5, 6]];
    const round = generateRound(mkCtx({ players, pairs, settings: fixed }));
    assertValidRound(round, players, 2);
    expect(round.courts).toHaveLength(1);
    expect(round.bench).toHaveLength(2);
    // chaque équipe d'un terrain est exactement une paire fixe
    const keyset = new Set(pairs.map((p) => [...p].sort((a, b) => a - b).join("-")));
    round.courts.forEach((c) => {
      expect(keyset.has([...c.a].sort((a, b) => a - b).join("-"))).toBe(true);
      expect(keyset.has([...c.b].sort((a, b) => a - b).join("-"))).toBe(true);
    });
  });

  it("paire incomplète (joueur absent) : le joueur présent va au banc", () => {
    const players = mkPlayers(5); // le joueur 6 n'existe pas
    const pairs = [[1, 2], [3, 4], [5, 6]];
    const round = generateRound(mkCtx({ players, pairs, settings: fixed }));
    assertValidRound(round, players, 2);
    expect(round.bench).toContain(5); // 5 sans partenaire -> banc
    expect(round.courts).toHaveLength(1);
  });
});

describe("Aléatoire (Math.random stubbé)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("simple : tous les joueurs placés, reproductible", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    const players = mkPlayers(6);
    const round = generateRound(mkCtx({ players, settings: { format: "simple", pairing: "aleatoire" } }));
    assertValidRound(round, players, 1);
    expect(round).toMatchInlineSnapshot(`
      {
        "bench": [],
        "courts": [
          {
            "a": [
              5,
            ],
            "b": [
              1,
            ],
            "sets": [],
          },
          {
            "a": [
              4,
            ],
            "b": [
              2,
            ],
            "sets": [],
          },
          {
            "a": [
              6,
            ],
            "b": [
              3,
            ],
            "sets": [],
          },
        ],
      }
    `);
  });

  it("double tournants : tous les joueurs placés", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    const players = mkPlayers(8);
    const round = generateRound(mkCtx({ players, settings: { format: "double", partners: "tournants", pairing: "aleatoire" } }));
    assertValidRound(round, players, 2);
  });
});

describe("canGenerateNext (bornes par format + gate de ronde)", () => {
  it("simple : minimum 2 joueurs", () => {
    expect(canGenerateNext(mkCtx({ players: mkPlayers(1), settings: { format: "simple" } })).ok).toBe(false);
    expect(canGenerateNext(mkCtx({ players: mkPlayers(2), settings: { format: "simple" } })).ok).toBe(true);
  });
  it("double : minimum 4 joueurs", () => {
    expect(canGenerateNext(mkCtx({ players: mkPlayers(3), settings: {} })).ok).toBe(false);
    expect(canGenerateNext(mkCtx({ players: mkPlayers(4), settings: {} })).ok).toBe(true);
  });
  it("paires fixes : minimum 2 paires complètes", () => {
    const settings = { format: "double", partners: "fixes" };
    expect(canGenerateNext(mkCtx({ players: mkPlayers(2), pairs: [[1, 2]], settings })).ok).toBe(false);
    expect(canGenerateNext(mkCtx({ players: mkPlayers(4), pairs: [[1, 2], [3, 4]], settings })).ok).toBe(true);
  });
  it("bloque tant que la ronde précédente n'est pas terminée", () => {
    const players = mkPlayers(4);
    const rounds = [{ courts: [{ a: [1, 2], b: [3, 4], sets: [[10, 5]] }], bench: [] }]; // set non fini
    expect(canGenerateNext(mkCtx({ players, rounds, settings: { setsCount: 1, pointsMax: 21 } })).ok).toBe(false);
  });
});
