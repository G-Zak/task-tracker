# Task Tracker

Application de suivi de tâches avec Next.js et Prisma.

## Prérequis

- Node.js
- Docker

## Installation

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
```

## Lancer le projet

```bash
npm run dev
```

L'application démarre sur [http://localhost:3000](http://localhost:3000).

## Commandes utiles

```bash
npm run lint
npm run build
npx prisma db seed
```

## Base de données

La base PostgreSQL locale tourne via Docker. Le projet utilise le port `5433` pour éviter le conflit avec un PostgreSQL déjà présent sur la machine.
