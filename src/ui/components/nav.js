// Barre de navigation basse (onglets du tournoi actif).
const TABS = [
  ["rondes", "Rondes"],
  ["joueurs", "Joueurs"],
  ["classement", "Classement"]
];

export function renderNav(active) {
  const tabs = TABS.map(
    ([k, l]) =>
      `<button class="${active === k ? "act" : ""}" data-action="tab" data-tab="${k}">${l}</button>`
  ).join("");
  return `${tabs}<button class="quit" data-action="closeTournament" title="Quitter le tournoi">⨉</button>`;
}
