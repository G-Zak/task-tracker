# TaskTracker

Application de gestion de projets et de tâches développée pour ABA Technology.

Suivi de projets et de tâches, tableau Kanban, feuilles de temps, messagerie
d'équipe en temps réel, gestion des clients et des équipes, statistiques, et un
assistant conversationnel qui répond en langage naturel à partir des données de
l'organisation.

**Stack :** Next.js 16 · React 19 · TypeScript · Prisma 7 · PostgreSQL (pgvector) ·
Tailwind CSS 4 · WebSocket · Ollama

---

## Comptes de démonstration

Mot de passe commun : **`admin1234`**

| Email | Rôle | Périmètre |
|---|---|---|
| `admin@abatechnology.com` | Administrateur | Accès complet, gestion des utilisateurs |
| `manager@abatechnology.com` | Chef de projet | Projets, clients, équipes, tâches |
| `lead@abatechnology.com` | Chef d'équipe | Création et affectation de tâches |
| `user@abatechnology.com` | Collaborateur | Ses tâches, pointage, messagerie |
| `viewer@abatechnology.com` | Observateur | Lecture seule |

Le jeu de données de démonstration est reproductible : toutes les installations
affichent les mêmes projets, tâches et collaborateurs.

---

## Tester l'application

Trois possibilités selon le besoin.

### Option 1 — Version en ligne

Ouvrir l'URL de déploiement, puis se connecter avec l'un des comptes ci-dessus.

Cette version permet de parcourir les projets, les tâches, le Kanban, les
feuilles de temps, les clients, les équipes, les statistiques et la messagerie.

Deux fonctionnalités n'y sont pas actives, car elles nécessitent un serveur
permanent que l'hébergement serverless ne fournit pas :

- **le rafraîchissement en direct** de la messagerie — l'envoi et la lecture des
  messages fonctionnent normalement, l'affichage n'est simplement pas instantané ;
- **l'assistant conversationnel**, qui repose sur un modèle exécuté localement.

Pour évaluer ces deux fonctionnalités, utiliser l'option 2.

### Option 2 — Docker (application complète)

C'est la version recommandée pour une évaluation complète : toutes les
fonctionnalités sont actives, assistant conversationnel et temps réel compris.

**Prérequis**

- Docker Desktop installé et démarré
- 12 Go d'espace disque disponible
- Dans Docker Desktop → *Settings* → *Resources* : **mémoire à 8 Go minimum**

**Lancement**

```bash
git clone https://github.com/G-Zak/task-tracker.git
cd task-tracker
cp .env.example .env
docker compose up -d --build
```

Le premier démarrage prend 10 à 20 minutes : construction de l'image puis
téléchargement des modèles de l'assistant (environ 2,3 Go). Les démarrages
suivants sont immédiats.

Suivre la progression :

```bash
docker compose logs -f ollama
```

Attendre l'affichage de `success` à deux reprises, puis quitter avec `Ctrl+C`.

Vérifier que les quatre services tournent :

```bash
docker compose ps
```

```
tasktracker-app      Up
tasktracker-db       Up (healthy)
tasktracker-ollama   Up
tasktracker-ws       Up
```

L'application est disponible sur **http://localhost:3000**.

La base de données, les comptes et les données de démonstration sont créés
automatiquement au premier démarrage. Aucune commande supplémentaire n'est
nécessaire.

**Points à vérifier**

| Fonctionnalité | Emplacement | Résultat attendu |
|---|---|---|
| Tableau de bord | après connexion | Compteurs, tâches à échéance, activité récente |
| Projets, Tâches, Kanban | menu latéral | Listes remplies, glisser-déposer fonctionnel |
| Messagerie temps réel | *Messagerie* | Pastille verte « Temps réel », message affiché instantanément |
| Assistant | *Assistant IA* | Question : « Quelles sont mes tâches en retard ? » |

L'assistant s'exécute sur le processeur dans Docker : compter **30 secondes à
2 minutes** par réponse, la première étant la plus lente (chargement du modèle
en mémoire).

**Commandes utiles**

```bash
docker compose logs -f app     # journaux applicatifs
docker compose stop            # arrêter en conservant les données
docker compose up -d           # redémarrer
docker compose down -v         # tout supprimer, données comprises
```

### Option 3 — Développement local

**Prérequis :** Node.js 20+, Docker (pour PostgreSQL et Ollama).

```bash
npm install
cp .env.example .env
docker compose up -d postgres ollama
npx prisma migrate deploy
npm run seed
npm run reindex
```

Deux processus à lancer dans deux terminaux :

```bash
npm run dev        # application  → http://localhost:3000
npm run dev:ws     # serveur temps réel
```

---

## Commandes

```bash
npm run dev        # serveur de développement
npm run dev:ws     # serveur WebSocket
npm run build      # build de production
npm run lint       # analyse statique
npm run seed       # jeu de données de démonstration
npm run reindex    # reconstruit l'index de recherche de l'assistant
```

---

## Configuration

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `SESSION_SECRET` | Signature des cookies de session |
| `NEXT_PUBLIC_WS_URL` | URL du serveur temps réel — laisser vide pour le désactiver |
| `WS_PORT`, `WS_BROADCAST_SECRET` | Configuration du serveur temps réel |
| `OLLAMA_BASE_URL` | Serveur du modèle conversationnel |
| `OLLAMA_CHAT_MODEL` | Modèle de conversation (`llama3.2:3b` par défaut) |
| `OLLAMA_EMBEDDING_MODEL` | Modèle d'indexation (`nomic-embed-text`) |
| `OLLAMA_TIMEOUT_MS` | Délai maximum d'une réponse (240000 par défaut) |
| `AI_ASSISTANT_ENABLED` | `false` pour désactiver l'assistant |
| `SEED_ON_START` | `force` pour ré-amorcer, `never` pour désactiver |

---

## Base de données

Onze tables : `Organisation`, `User`, `Client`, `Team`, `Project`, `Task`,
`TaskType`, `ProjectNote`, `TimeEntry`, `Notification`, `KnowledgeChunk`.

PostgreSQL tourne sur le port `5433` afin d'éviter tout conflit avec une
instance déjà installée. L'extension `pgvector` est requise pour la recherche
sémantique de l'assistant ; elle est installée par les migrations.

---

## Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| `port is already allocated` | Port 3000, 4001, 5433 ou 11434 occupé | Libérer le port ou le modifier dans `docker-compose.yml` |
| `tasktracker-db is unhealthy` | Disque Docker saturé | Augmenter le disque dans Docker Desktop, puis `docker system prune -f` |
| L'assistant répond « n'est pas installé » | Modèle non téléchargé | `docker compose exec ollama ollama pull llama3.2:3b` |
| L'assistant répond « trop de temps » | Machine peu puissante | Porter la mémoire Docker à 8-12 Go, ou choisir un modèle plus léger via `OLLAMA_CHAT_MODEL` |
| L'assistant répond « aucune donnée pertinente » | Index de recherche vide | `docker compose exec app npm run reindex` |
| « Temps réel indisponible » | Serveur WebSocket arrêté | `docker compose up -d ws` |
| Aucun compte ne fonctionne | Amorçage non exécuté | `docker compose logs app` puis `docker compose exec app npm run seed` |
