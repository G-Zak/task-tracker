# Task Tracker — Historique du projet

Suivi de l'avancement du projet, du démarrage à aujourd'hui, basé sur l'historique Git et la documentation (`documentation/`).

## Stack

- **Framework**: Next.js 16 (React 19, TypeScript)
- **Base de données**: PostgreSQL via Docker Compose (port `5433`)
- **ORM**: Prisma 7 (`@prisma/adapter-pg`)
- **UI**: Tailwind CSS 4, shadcn, Base UI, lucide-react
- **Formulaires / validation**: react-hook-form + zod
- **Auth**: mot de passe + bcrypt, sessions protégées par proxy

## Organisation

Le projet est mené en sprints, avec des User Stories (US) suivies via des issues GitHub. Chaque US correspond à une branche `<issue#>-us-<num>-<titre>`, mergée dans `main` via PR, et documentée dans `documentation/Sprint_X_Doc/USxxx.md`.

---

## Sprint 1 — Fondations (13 juil. 2026)

| US | Description | Commit |
|----|--------------|--------|
| US-001 | Initialisation du projet Next.js/TypeScript | `14ee53a` |
| US-002 | Mise en place de PostgreSQL via Docker Compose | `cee418f` |
| US-003 | Modélisation du schéma Prisma initial | `54f5379` |
| US-004 | Script de seed de démonstration | `ce2af15` |

## Sprint 2 — Auth & Layout (18–20 juil. 2026)

| US | Description | Commit |
|----|--------------|--------|
| US-005 | Connexion email/mot de passe | `e6ec41d` |
| US-006 | Protection des routes / session (proxy) | `ca4f1a7` |
| US-007 | Contrôle d'accès par rôle (RBAC simple) | `c94dc91` |
| US-008 | Layout principal (sidebar/topbar), navigation filtrée par rôle | `30fae76` |

## Sprint 3 — Clients & Projets (22–29 juil. 2026)

| US | Description | Commit |
|----|--------------|--------|
| US-009 | CRUD client (créer/lister/modifier/supprimer) par ADM et PM | `08d2492`, `f356ef0` |
| US-010 | Créer un projet (workflow + page sidebar) | `02ca06c` |
| US-011 | Liste des projets avec recherche/filtres/pagination | `95d1bbe` |
| US-012 | Détail projet (membres, tâches associées) | `ae30347` |
| US-013 | Modifier ou supprimer un projet | `d7a1803` |
| — | UI: adoption palette couleur "aba tech", `password` → `passwordHash` dans le schéma Prisma | `1b96957` |
| — | Comptes de connexion — tests | `b8e9700` |

## Sprint 4 — Tâches (30 juil. – 4 août 2026)

| US | Description | Commit |
|----|--------------|--------|
| US-014 | Créer une tâche (orgName → orgSlug, validation zod, form + actions Prisma) | `5bb233b` |
| US-015 | Assigner une tâche à un ou plusieurs utilisateurs | `98b26dd` |
| — | Fix: TaskForm attend une string, pas une valeur brute | `9df7d35` |
| US-016 | Modifier statut / priorité / progression d'une tâche | `e4fbd70` |
| US-017 | Liste des tâches avec filtres (statut, priorité, projet) | `218dba3` |
| US-018 | Supprimer une tâche | `2176b92` |

## Sprint 6 — Messagerie de projet (complété le 24 août 2026)

> Sprint initialement prévu 03→07 août (`06-Backlog-S5-S7.md`), exécuté en réalité le 24 août dans la
> même session que le début du backlog Phase 2 — même décalage calendaire que Sprint 5 (US-019/US-020).

| US | Description | Doc |
|----|--------------|-----|
| US-021 | Fil de discussion par projet — déjà implémenté sur la branche avant cette session, vérifié complet (5/5 critères) pendant celle-ci | non documenté (code pré-existant, voir note dans `US022.md`) |
| US-022 | Suppression d'un message : auteur ou ADMIN/PROJECT_MANAGER, règle appliquée côté serveur, confirmation avant suppression | `Sprint_6_Doc/US022.md` |

## Sprint 9 — Backlog Phase 2 (à partir du 24 août 2026)

> Le plan initial de stage (`06-Backlog-S5-S7.md`) réservait le Sprint 8 (24→28 août) à la stabilisation
> et au rapport, sans nouvelle fonctionnalité. Cette section démarre donc un **backlog Phase 2**
> (US-027 → US-043 : dashboard, suivi du temps, équipes, statistiques, utilisateurs, profil, messagerie
> temps réel, RAG) qui prolonge le produit au-delà du périmètre initial, numéroté à partir du Sprint 9
> pour ne pas réécrire l'historique du Sprint 8 tel que documenté. Détail des 17 stories : artefact
> "Backlog Phase 2" (24 août 2026) et `documentation/Sprint_9_Doc/`.

| US | Description | Doc |
|----|--------------|-----|
| US-027 | Widgets KPI du tableau de bord (projets actifs, tâches en retard, répartition par statut, agrégés côté serveur et filtrés par rôle) | `Sprint_9_Doc/US027.md` |
| US-028 | Widget « Mon activité » : tâches assignées triées par échéance, activité récente (tâches + messages), résumé organisation additionnel pour ADMIN | `Sprint_9_Doc/US028.md` |
| US-029 | Création de projet via pop-up (formulaire sorti de la colonne fixe, même pattern que US-020) ; bug pré-existant du sélecteur de membres corrigé au passage | `Sprint_9_Doc/US029.md` |
| US-033 | Messagerie temps réel : serveur WebSocket autonome (`server/ws-server.ts`, process séparé), diffusion à la création/suppression de message, reconnexion automatique + statut affiché en cas de coupure | `Sprint_9_Doc/US033.md` |
| US-044 | Page « Messagerie » dédiée (hub) : liste des conversations par projet + réutilisation du fil de discussion existant, sans nouveau modèle de données | `Sprint_9_Doc/US044.md` |

---

## État actuel (24 août 2026)

Fonctionnalités livrées (mergées dans `main` ou en cours sur branche) :

- Projet Next.js/TypeScript initialisé, PostgreSQL en local via Docker, schéma Prisma en place avec seed de démo.
- Authentification par email/mot de passe, routes protégées, RBAC (rôles ADM/PM/etc.), layout avec sidebar/topbar filtrée par rôle.
- Gestion complète des clients (CRUD).
- Gestion complète des projets : création via pop-up (US-029), liste avec recherche/filtres/pagination, page détail (membres + tâches), modification/suppression.
- Gestion complète des tâches : création, assignation multi-utilisateurs, modification (statut/priorité/progression), liste avec filtres, suppression, vue Liste ⇄ Kanban fusionnée, création via pop-up.
- Fil de discussion par projet (US-021), suppression de message (US-022) et diffusion temps réel via WebSocket (US-033) : complets sur la branche courante, non encore mergés.
- Dashboard : widgets KPI réels (projets actifs, tâches en retard, répartition par statut), remplaçant les deux cartes statiques d'origine (US-027) ; widget « Mon activité » (mes tâches, activité récente, résumé organisation pour ADMIN) (US-028).

Dernier commit mergé : `652ad82` — Merge PR #52 (US-020, création de tâche via pop-up).

## Documentation associée

- `documentation/Conception/` — backlog GitHub, diagrammes UML, architecture, planning des livrables.
- `documentation/Sprint_1_Doc/` à `Sprint_4_Doc/` — fiches détaillées par US.
- `documentation/Rapports_livrables/` — rapports de sprint (Sprint 1, Sprint 4).
- `documentation/AI_Integration.md` — notes sur l'intégration IA.
