# Roundouble

Gestionnaire de tournois de badminton, **multi-formats** et **installable sur téléphone** (PWA, fonctionne hors-ligne). 100 % local : chaque organisateur gère son tournoi sur son appareil, aucune donnée ne quitte le navigateur.

## Démarrer en développement

```bash
npm install
npm run dev        # http://localhost:5173/roundouble/
```

## Build & prévisualisation

```bash
npm run build
npm run preview
```

## Déploiement

Push sur `main` → GitHub Actions construit et publie sur GitHub Pages
(`.github/workflows/deploy.yml`). Une fois actif :
`Settings → Pages → Source = GitHub Actions`. URL : `https://nactaj.github.io/roundouble/`.

> La base est figée à `/roundouble/` dans `vite.config.js`. Pour un domaine
> personnalisé, repasser `base` à `/`.

## Architecture

```
src/
  core/      logique pure partagée (scoring, stats, helpers joueurs)
  modes/     un dossier par format de tournoi + registre (index.js)
  state/     store + persistance localStorage + migrations
  ui/        écrans, composants, rendu et délégation d'événements
```

L'app suit un modèle simple **état → re-render**. Le store est l'unique source de
vérité ; chaque action mute l'état puis notifie le rendu.

## Ajouter un format de tournoi

1. Copier `src/modes/_template/` en `src/modes/<monmode>/`.
2. Implémenter le contrat décrit dans `src/modes/types.js`
   (voir `src/modes/mexicano/` pour un exemple complet).
3. L'enregistrer dans `src/modes/index.js` : **1 import + 1 entrée** dans `MODES`.

Aucun autre fichier (store, écrans, persistance, navigation) n'a besoin de changer :
le mode pilote la génération des rondes, la validation et les colonnes du classement.

## Données & migrations

État persisté sous la clé `roundouble_state_v1` (avec `schemaVersion`).
L'ancien prototype (`tournoi_pmbb_html_v1`) est migré automatiquement au premier
chargement (voir `src/state/migrations.js`).
