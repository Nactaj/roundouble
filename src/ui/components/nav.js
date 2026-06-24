// Barre de navigation basse (onglets du tournoi actif).
const TABS = [
  ["rondes", "Rondes"],
  ["joueurs", "Joueurs"],
  ["classement", "Classement"]
];

export function renderNav(active) {
  return TABS.map(
    ([k, l]) =>
      `<button class="${active === k ? "act" : ""}" data-action="tab" data-tab="${k}">${l}</button>`
  ).join("");
}
