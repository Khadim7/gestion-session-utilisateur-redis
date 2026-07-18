# Système de gestion de sessions utilisateur avec Redis

Projet — BDD Nouvelle Génération (IPSL / UGB, GELT1)
**Khadim Ndiaye Mbaye <br> Sokhna Youm**

## 1. Objectif

Gérer des sessions utilisateur (connexion, préférences, expiration) dans
une base clé-valeur en mémoire (Redis), avec les opérations `SET`, `GET`,
`DEL` et `EXPIRE`, et une visualisation en temps réel des sessions actives.

## 2. Architecture

Le frontend React (Vite, port 5173) envoie des requêtes HTTP en JSON au
backend (port 3001), qui lit et écrit dans Redis (port 6379) via
`ioredis`. Redis Commander (port 8081) donne en plus une vue web directe
sur les clés Redis, en parallèle du tableau de bord React.

- **Frontend** : React + TypeScript (Vite). Formulaire de connexion,
  tableau de bord avec compte à rebours du TTL, gestion des préférences,
  vue temps réel des sessions actives dans Redis.
- **Backend** : API HTTP écrite en TypeScript, exécutée par Bun, avec le
  framework Hono. Communique avec Redis via `ioredis`.
- **Redis** : conteneur Docker, persistance activée (AOF), mot de passe
  requis, politique d'éviction `allkeys-lru`.
- **Redis Commander** : interface web fournie dans le `docker-compose.yml`
  pour observer les clés en temps réel (objectif « visualiser les données
  en temps réel »), en complément de la vue React.

## 3. Modélisation des données Redis

Chaque session est stockée dans **une seule clé** :

```
Clé   : session:<uuid>
Valeur (JSON) :
{
  "sessionId": "…",
  "username": "…",
  "createdAt": 1752800000000,
  "lastRefreshedAt": 1752800000000,
  "preferences": { "theme": "sombre", "langue": "fr" }
}
TTL   : 900 secondes (15 minutes), configurable via SESSION_TTL_SECONDS
```

Choix de modélisation : une valeur JSON unique par session plutôt qu'un
`HASH` par champ, afin que le sujet puisse être traité littéralement avec
les 4 commandes demandées (`SET`, `GET`, `DEL`, `EXPIRE`), tout en gardant
une seule opération atomique pour créer une session (`SET ... EX ...`).

### Opérations Redis utilisées

| Commande            | Où                                   | Rôle                                              |
|----------------------|---------------------------------------|----------------------------------------------------|
| `SET key val EX n`  | `POST /api/session/login`             | Crée la session et pose le TTL en une seule commande |
| `GET key`           | `GET /api/session/me`                 | Lit l'état de la session                          |
| `SET key val KEEPTTL` | `PUT /api/session/preferences`      | Met à jour les préférences sans réinitialiser le TTL |
| `EXPIRE key n`      | `POST /api/session/refresh`            | Prolonge la session (expiration glissante)         |
| `TTL key`           | `GET /api/session/me`, `GET /api/sessions` | Calcule le temps restant affiché côté client   |
| `DEL key`           | `DELETE /api/session/logout`           | Détruit la session (déconnexion)                  |
| `SCAN cursor MATCH` | `GET /api/sessions`                    | Liste les sessions actives sans bloquer Redis (contrairement à `KEYS`) |

## 4. Installation et démarrage

### 4.1 Prérequis

- [Bun](https://bun.sh) ≥ 1.1
- [Docker](https://www.docker.com) + plugin `docker compose`
- Node.js (optionnel, uniquement si vous préférez `npm` pour le frontend)

### 4.2 Démarrer Redis

```bash
cd session-redis-project
chmod +x install-redis.sh
./install-redis.sh
```

Ce script :
1. vérifie/installe Docker,
2. crée un fichier `.env` avec le mot de passe Redis,
3. démarre Redis + Redis Commander via `docker compose up -d`,
4. attend que Redis réponde à `PING`.

Vérifiez : Redis Commander est accessible sur **http://localhost:8081**.

### 4.3 Démarrer le backend (Bun)

```bash
cd backend
cp .env.exemple .env   
bun install
bun run dev
```

L'API démarre sur **http://localhost:3001**. Test rapide :

```bash
curl http://localhost:3001/api/health
```

### 4.4 Démarrer le frontend (React)

```bash
cd frontend
cp .env.exemple .env
bun install   # ou: npm install
bun run dev   # ou: npm run dev
```

L'application est accessible sur **http://localhost:5173**.

## 5. Utilisation

1. Ouvrir http://localhost:5173, saisir un nom d'utilisateur → une session
   est créée dans Redis avec un TTL de 15 minutes.
2. Le tableau de bord affiche un compte à rebours (barre de « décroissance »
   qui change de couleur : vert → orange → rouge à l'approche de
   l'expiration).
3. Le bouton **EXPIRE · Prolonger** appelle `EXPIRE` pour repousser
   l'expiration (pattern *sliding session*).
4. La section **Préférences** modifie la valeur stockée sans toucher au TTL
   (`SET ... KEEPTTL`).
5. La section **Sessions actives** interroge `SCAN session:*` toutes les 5
   secondes pour afficher toutes les sessions vivantes, y compris celles
   ouvertes dans d'autres onglets/navigateurs — c'est la démonstration du
   temps réel demandée par le sujet.
6. **DEL · Se déconnecter** supprime immédiatement la clé dans Redis.
7. Pour observer Redis brut : `docker exec -it session-redis redis-cli -a redispass`,
   puis `KEYS session:*`, `GET session:<id>`, `TTL session:<id>`.

## 6. Structure du projet

```
session-redis-project/
├── docker-compose.yml       # Redis + Redis Commander
├── install-redis.sh         # Script d'installation/démarrage
├── backend/                 # API Bun + Hono
│   └── src/
│       ├── index.ts         # Routes HTTP (login, me, refresh, preferences, logout, sessions)
│       ├── redisClient.ts   # Connexion ioredis
│       └── types.ts
└── frontend/                 # Application React (Vite)
    └── src/
        ├── App.tsx
        ├── api.ts            # Client HTTP vers le backend
        └── components/
            ├── LoginForm.tsx
            ├── Dashboard.tsx
            └── PreferencesForm.tsx
```
