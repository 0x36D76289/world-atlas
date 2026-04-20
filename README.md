# World Atlas

> Plateforme de visualisation géospatiale haute performance pour le suivi de vols en temps réel, construite avec Next.js, MapLibre GL JS et Deck.gl.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-JS-396CB2?style=flat-square)
![Deck.gl](https://img.shields.io/badge/Deck.gl-WebGL2-red?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Fonctionnalités

- **Suivi en temps réel** — Visualisation de milliers d'aéronefs simultanément grâce à des couches GPU-accélérées (Deck.gl `IconLayer`)
- **Traînées de vol 3D** — Affichage de la trajectoire historique d'un vol sélectionné avec altitude réelle (`PathLayer`)
- **Terrain 3D** — Relief topographique interactif via tuiles raster-DEM (encodage Terrarium)
- **Overlay jour/nuit** — Terminateur solaire calculé en temps réel (système *Crepuscule*) avec transition progressive entre jour, crépuscule et nuit
- **Proxy API aviation** — Backend Next.js agrégeant et normalisant les données FlightRadar24 (vols, aéroports, compagnies, zones)
- **Recherche & filtres** — Recherche par aéroport, filtrage par compagnie aérienne, immatriculation, type d'appareil
- **Design adaptatif** — Thème sombre/clair avec système de design basé sur Tailwind CSS v4 et shadcn/ui

---

## Aperçu

```
MapWrapper (SSR disabled)
└── MapView
    ├── MapLibre GL JS  ← Fond de carte vectoriel + terrain 3D
    ├── DeckOverlay     ← Icônes avions + traînées de vol (WebGL)
    └── Crepuscule      ← Overlay jour/nuit temps réel
```

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| **Framework** | Next.js 15 (App Router) |
| **Cartographie** | MapLibre GL JS, Deck.gl, PMTiles |
| **État global** | Zustand |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix UI |
| **Linting/Format** | Biome |
| **Langage** | TypeScript strict |

---

## Démarrage rapide

### Prérequis

- **Node.js** ≥ 20
- **bun / yarn / pbun / bun**
- Un compte **MapTiler** avec une clé API ([obtenir une clé gratuite](https://cloud.maptiler.com/account/keys/))

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/0x36D76289/world-atlas.git
cd world-atlas

# Installer les dépendances
bun install
```

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_MAPTILER_KEY=votre_clé_maptiler_ici
```

> Ce fichier est ignoré par Git. Ne commitez jamais votre clé API.

### Lancer le serveur de développement

```bash
bun run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `bun run dev` | Serveur de développement avec HMR |
| `bun run build` | Build de production optimisé |
| `bun run start` | Démarrer le build de production |
| `bun run lint` | Vérification du code avec Biome |
| `bun run lint:fix` | Correction automatique des erreurs |
| `bun run format` | Formatage du code |

---

## Architecture du projet

```
src/
├── app/
│   ├── api/
│   │   ├── flights/          # GET /api/flights, /api/flights/[id]
│   │   ├── airport/          # GET /api/airport, /api/airport/[code]
│   │   ├── airlines/         # GET /api/airlines
│   │   └── zones/            # GET /api/zones
│   ├── layout.tsx            # Layout racine (fonts, providers)
│   ├── page.tsx              # Page principale (MapWrapper)
│   ├── loading.tsx           # Écran de chargement
│   └── error.tsx             # Boundary d'erreur
│
├── components/
│   ├── map/
│   │   ├── MapWrapper.tsx    # Dynamic import SSR-safe
│   │   ├── MapView.tsx       # Conteneur DOM + DeckOverlay
│   │   ├── DeckOverlay.tsx   # Couches Deck.gl (avions + traînées)
│   │   ├── constants.ts      # Viewport & terrain defaults
│   │   ├── crepuscule/       # Overlay jour/nuit
│   │   │   ├── Crepuscule.ts # Contrôleur principal
│   │   │   └── tile-worker.ts# Calcul solaire en Web Worker
│   │   └── hooks/
│   │       └── useMapInit.ts # Initialisation MapLibre
│   └── ui/                   # Composants shadcn/ui (50+)
│
├── hooks/
│   ├── useBounds.ts          # Bounding box depuis moveend
│   └── useFlights.ts         # Polling vols toutes les 3s
│
├── store/
│   └── mapStore.ts           # Zustand : map, center, zoom, terrain
│
└── lib/
    └── utils.ts              # Utilitaire cn() pour Tailwind
```

---

## API Backend

Le backend Next.js agit comme **proxy** entre le frontend et les services FlightRadar24 (via `flightradarapi`), évitant les problèmes CORS et normalisant les données.

### Endpoints

| Route | Méthode | Description | Paramètres |
|-------|---------|-------------|------------|
| `/api/flights` | `GET` | Liste des vols actifs | `bounds`, `airline`, `registration`, `aircraftType`, `details` |
| `/api/flights/[id]` | `GET` | Détails + traînée normalisée | `id` (Flight ID) |
| `/api/airport` | `GET` | Recherche aéroport par code | `code`, `details` |
| `/api/airport/[code]` | `GET` | Horaires paginés d'un aéroport | `code`, `limit`, `page` |
| `/api/airlines` | `GET` | Liste de toutes les compagnies | — |
| `/api/zones` | `GET` | Zones géographiques FlightRadar24 | — |

### Normalisation des coordonnées

Le endpoint `/api/flights/[id]` normalise les clés de coordonnées inconsistantes de l'API source :

| Clé cible | Sources acceptées |
|-----------|------------------|
| `lng` | `lng`, `longitude` |
| `lat` | `lat`, `latitude` |
| `alt` | `alt`, `altitude` |

---

## Fonctionnement interne

### Flux de données en temps réel

```
map.moveend event
    → useBounds      → "N,S,W,E" string
    → useFlights     → polling /api/flights toutes les 3s (AbortController)
    → DeckOverlay    → IconLayer (GPU) → rendu des avions
```

### Système Crepuscule (jour/nuit)

Le système utilise un protocole MapLibre personnalisé pour générer des tuiles raster à la volée via des **Web Workers**. Pour chaque pixel d'une tuile, le worker calcule l'altitude solaire via des formules astronomiques (Julian date, déclinaison, ascension droite, temps sidéral). Une **fonction sigmoïde** crée la transition progressive jour/crépuscule/nuit.

Optimisation : un échantillonnage en 9 points (coins, bords, centre) détermine si la tuile est entièrement de jour ou de nuit avant de lancer le calcul complet.

### Gestion des clics (Deck.gl × MapLibre)

MapLibre ne supporte pas nativement `stopPropagation` pour les éléments overlay. Le projet utilise un flag global `window.__deckClickConsumed` pour coordonner les événements entre les deux moteurs de rendu.

### Terrain 3D

| Propriété | Valeur |
|-----------|--------|
| Source | AWS S3 Elevation Tiles |
| Encodage | Terrarium (RGB → altitude) |
| Exagération | 0.5 (rendu réaliste) |
| Zoom max | 15 |

---

## Design System

- **Couleurs** : OKLCH pour une uniformité perceptuelle et un dark mode précis
- **Radius** : Échelle relative basée sur `--radius: 0.625rem`
- **Composants** : shadcn/ui (`radix-nova` style) avec CVA pour les variantes
- **Fonts** : Geist Sans & Geist Mono

---

## Contribuer

Les contributions sont les bienvenues ! Voici comment démarrer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'feat: ajoute ma fonctionnalité'`)
4. Poussez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

Avant de soumettre, assurez-vous que le code passe les vérifications :

```bash
bun run lint
bun run build
```

---

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<p align="center">
  Fait avec ❤️ et beaucoup de ☕ — <a href="https://github.com/0x36D76289">0x36D76289</a>
</p>
