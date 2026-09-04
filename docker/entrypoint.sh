#!/bin/sh
set -e

echo "[entrypoint] Application des migrations..."
./node_modules/.bin/prisma migrate deploy

count_users() {
  node -e '
    const { Client } = require("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.connect()
      .then(() => client.query("SELECT COUNT(*)::int AS n FROM \"User\""))
      .then((r) => { console.log(r.rows[0].n); return client.end(); })
      .catch(() => { console.log("-1"); try { client.end(); } catch (e) {} });
  ' 2>/dev/null || echo "-1"
}

run_seed() {
  ./node_modules/.bin/tsx prisma/seed.ts \
    && echo "[entrypoint] Jeu de données de démonstration créé." \
    || echo "[entrypoint] AVERTISSEMENT : le seed a échoué."

  if [ -x ./index-knowledge.sh ]; then
    ./index-knowledge.sh &
  fi
}

if [ "$SEED_ON_START" = "never" ]; then
  echo "[entrypoint] Amorçage désactivé."
elif [ "$SEED_ON_START" = "force" ]; then
  echo "[entrypoint] Ré-amorçage complet demandé."
  run_seed
else
  USERS=$(count_users)
  case "$USERS" in
    0)  echo "[entrypoint] Base vide : création du jeu de données de démonstration..."; run_seed ;;
    -1) echo "[entrypoint] État de la base indéterminable : amorçage ignoré." ;;
    *)  echo "[entrypoint] Base déjà peuplée ($USERS comptes) : amorçage ignoré." ;;
  esac
fi

exec "$@"
