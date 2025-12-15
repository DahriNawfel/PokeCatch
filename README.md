# PokeCatch — PWA Simulateur de Capture Pokémon

Single-page React + TypeScript PWA (Vite) avec PokéAPI, offline-first, localStorage, notifications, et mécaniques de capture.

## Scripts

```bash
# Dev
npm install
npm run dev

# Build
npm run build
npm run preview
```

## Fonctionnalités
- Rencontres aléatoires Gen 1 (1 à 151) avec shiny 1/512
- 3 tentatives, 10-15% de chance, fuite auto au 3e échec
- Équipe de 6 max avec modale de gestion en cas de 7e
- Favoris, Mode sombre (persisté), Stats, Pokédex capturé
- PWA: Manifest + Service Worker, Notifications natives

## Déploiement

1. Build:
```bash
npm run build
```
2. run:
```bash
npm run dev
```
