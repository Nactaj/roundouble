# Notes projet (pour Claude / contributeurs)

Roundouble — PWA locale de gestion de tournois de badminton (Vanilla JS + Vite).

## Principes

- **Local uniquement** : pas de backend, tout en `localStorage`. Ne pas introduire
  d'appels réseau dans le chemin critique (la PWA doit marcher hors-ligne).
- **Le moteur est pur** : `src/core/` et `src/modes/*/engine|standings` ne touchent
  ni au DOM ni à des globales. Entrée = état, sortie = données.
- **Le mode pilote tout** : pour un nouveau format, ne pas modifier le store ni les
  écrans — implémenter le contrat (`src/modes/types.js`) et l'enregistrer dans
  `src/modes/index.js`.
- **Rendu** : modèle état → re-render `innerHTML`. Pas de `onclick` inline ;
  délégation d'événements via `data-action` dans `src/ui/app.js`.
- **Résultats** : on stocke les **scores** par set ; le vainqueur est **dérivé**
  (`src/core/scoring.js`), jamais saisi directement. Réglages par tournoi :
  `pointsMax`, `setsCount`.

## Persistance

- Clé courante : `roundouble_state_v1` (porte `schemaVersion`).
- Migrations dans `src/state/migrations.js` ; toute évolution de schéma y ajoute une
  étape en incrémentant `CURRENT_SCHEMA`. L'ancien format `tournoi_pmbb_html_v1` est
  migré automatiquement.

## Commandes

```bash
npm run dev        # dev (base /roundouble/)
npm run build      # build prod -> dist/
npm run preview    # prévisualisation du build
```
