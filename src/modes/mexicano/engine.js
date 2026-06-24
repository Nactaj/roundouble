// Mode Mexicano généralisé — orchestrateur de génération de ronde. Selon ctx.settings
// (format, partners, pairing), on construit des unités (joueur en simple, paire en double)
// puis on applique la règle d'appariement. Toute la logique vit dans pairing.js.
import { matchOutcome } from "../../core/scoring.js";
import {
  readConfig,
  selectBench,
  selectBenchPairs,
  buildUnits,
  mexicanoCourts,
  doublesByLevelCourts,
  doublesRandomCourts,
  matchBySwiss,
  matchByRandom
} from "./pairing.js";

export function generateRound(ctx) {
  const cfg = readConfig(ctx);

  if (cfg.format === "double" && cfg.partners === "tournants") {
    if (cfg.pairing === "equilibre") return mexicanoCourts(ctx);
    if (cfg.pairing === "niveau") return doublesByLevelCourts(ctx);
    return doublesRandomCourts(ctx); // aleatoire
  }

  if (cfg.format === "double" && cfg.partners === "fixes") {
    const { benchIds, playingPairs } = selectBenchPairs(ctx);
    const units = buildUnits(playingPairs, ctx);
    const courts = cfg.pairing === "aleatoire" ? matchByRandom(units, ctx) : matchBySwiss(units, ctx);
    return { courts, bench: benchIds };
  }

  // Simple (1v1)
  const { bench, playing } = selectBench(ctx, 2);
  const units = buildUnits(playing.map((id) => [id]), ctx);
  const courts = cfg.pairing === "aleatoire" ? matchByRandom(units, ctx) : matchBySwiss(units, ctx);
  return { courts, bench };
}

export function canGenerateNext(ctx) {
  const cfg = readConfig(ctx);
  const n = ctx.players.length;

  if (cfg.format === "simple") {
    if (n < 2) return { ok: false, message: "Ajoute au moins 2 joueurs." };
  } else if (cfg.partners === "fixes") {
    const present = new Set(ctx.players.map((p) => p.id));
    const valid = (ctx.pairs || []).filter((p) => present.has(p[0]) && present.has(p[1]));
    if (valid.length < 2) return { ok: false, message: "Constitue au moins 2 paires complètes." };
  } else if (n < 4) {
    return { ok: false, message: "Ajoute au moins 4 joueurs." };
  }

  const { rounds, settings } = ctx;
  if (rounds.length === 0) return { ok: true };
  const last = rounds[rounds.length - 1];
  const done = last.courts.every((c) => matchOutcome(c, settings) !== null);
  if (!done) {
    return {
      ok: false,
      message: `Termine tous les matchs de la ronde ${rounds.length} avant de générer la suivante.`
    };
  }
  return { ok: true };
}
