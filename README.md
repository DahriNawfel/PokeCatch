# PokeCatch — Simulateur de Capture Pokémon (PWA)

**PokeCatch** est un **simulateur de capture Pokémon** développé en **React + TypeScript (Vite)** sous forme de **PWA**.
Le projet reproduit l’expérience de capture Pokémon avec **animations, sons**, gestion d’équipe et **Pokédex à compléter**, jouable **en ligne et hors-ligne**.

👉 **Lien en ligne :**
[https://dahrinawfel.github.io/PokeCatch/](https://dahrinawfel.github.io/PokeCatch/)

---

## 🚀 Scripts

```bash
# Installation & développement
npm install
npm run dev

# Build & preview
npm run build
npm run preview
```

---

## 🎮 Fonctionnalités

### Gameplay

* **Simulateur de capture Pokémon**
* Rencontres aléatoires **Génération 1 (1 → 151)**
* Pokémon **shiny** avec un taux de **1/512**
* **3 tentatives de capture** par rencontre
* Chances de réussite variables (~10–15%)
* Fuite automatique après 3 échecs

### 👥 Équipe Pokémon

* **Équipe limitée à 6 Pokémon**
* Gestion automatique en cas de tentative d’ajout d’un 7ᵉ Pokémon
* Interface de remplacement intégrée

### 📘 Pokédex & Favoris

* **Pokédex à compléter**
* Suivi des Pokémon capturés
* Système de **favoris**
* Statistiques globales (captures, shiny, échecs, etc.)

### 🎨 Expérience utilisateur

* **Animations** de capture
* **Sons** immersifs
* **Mode sombre** (persisté)
* Interface fluide et responsive

### 📱 Progressive Web App (PWA)

* Fonctionnement **offline-first**
* **Service Worker + Manifest**
* Cache intelligent
* **Notifications natives**
* Installation sur mobile et desktop
* Sauvegarde locale via **localStorage**

---

## 📦 Déploiement

```bash
npm run build
npm run preview
```

Le projet est déployé via **GitHub Pages** et accessible ici :
➡️ [https://dahrinawfel.github.io/PokeCatch/](https://dahrinawfel.github.io/PokeCatch/)

---

## 🧠 Stack technique

* React
* TypeScript
* Vite
* PokéAPI
* PWA (Workbox / Service Worker)

---


