import { describe, it, expect } from "vitest";
import { setCap, setWinner, winnerOf, matchOutcome, courtPoints } from "./scoring.js";

describe("setCap", () => {
  it("plafonds des presets", () => {
    expect(setCap({ pointsMax: 11 })).toBe(15);
    expect(setCap({ pointsMax: 15 })).toBe(21);
    expect(setCap({ pointsMax: 21 })).toBe(30);
  });
  it("repli hors preset / défaut", () => {
    expect(setCap({ pointsMax: 25 })).toBe(34);
    expect(setCap({})).toBe(30);
  });
});

describe("setWinner", () => {
  const s = { pointsMax: 21 };
  it("aucun vainqueur tant que la cible n'est pas atteinte", () => {
    expect(setWinner([5, 3], s)).toBe(null);
    expect(setWinner([20, 18], s)).toBe(null);
  });
  it("victoire à la cible avec 2 points d'écart", () => {
    expect(setWinner([21, 15], s)).toBe("A");
    expect(setWinner([15, 21], s)).toBe("B");
  });
  it("pas de victoire à 1 point d'écart sous le plafond", () => {
    expect(setWinner([21, 20], s)).toBe(null);
  });
  it("victoire en prolongation avec 2 d'écart, ou au plafond", () => {
    expect(setWinner([22, 20], s)).toBe("A");
    expect(setWinner([30, 29], s)).toBe("A"); // plafond
  });
  it("égalité / set incomplet -> null", () => {
    expect(setWinner([21, 21], s)).toBe(null);
    expect(setWinner([null, 5], s)).toBe(null);
    expect(setWinner(null, s)).toBe(null);
  });
  it("respecte le format 11 points (plafond 15)", () => {
    const f = { pointsMax: 11 };
    expect(setWinner([11, 9], f)).toBe("A");
    expect(setWinner([11, 10], f)).toBe(null);
    expect(setWinner([15, 14], f)).toBe("A");
  });
});

describe("winnerOf / matchOutcome", () => {
  it("best-of-1", () => {
    expect(winnerOf({ sets: [[21, 10]] }, { setsCount: 1, pointsMax: 21 })).toBe("A");
  });
  it("best-of-3 : il faut 2 sets", () => {
    const s = { setsCount: 3, pointsMax: 21 };
    expect(matchOutcome({ sets: [[21, 10], [5, 21]] }, s)).toBe(null); // 1-1, 3e à jouer
    expect(matchOutcome({ sets: [[21, 10], [21, 15]] }, s)).toBe("A");
  });
  it("match nul en best-of-2 (1-1)", () => {
    const s = { setsCount: 2, pointsMax: 21 };
    expect(matchOutcome({ sets: [[21, 10], [10, 21]] }, s)).toBe("draw");
    expect(winnerOf({ sets: [[21, 10], [10, 21]] }, s)).toBe(null);
  });
  it("match en cours -> null", () => {
    expect(matchOutcome({ sets: [[5, 3]] }, { setsCount: 1, pointsMax: 21 })).toBe(null);
  });
});

describe("courtPoints", () => {
  it("additionne les points par équipe sur tous les sets", () => {
    expect(courtPoints({ sets: [[21, 15], [18, 21]] })).toEqual({ A: 39, B: 36 });
  });
});
