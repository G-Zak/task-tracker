#!/bin/sh

BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
MODEL="${OLLAMA_EMBEDDING_MODEL:-nomic-embed-text}"
MAX_WAIT_MIN="${INDEX_MAX_WAIT_MIN:-40}"
DEADLINE=$(( $(date +%s) + MAX_WAIT_MIN * 60 ))

echo "[index] Attente d'Ollama sur $BASE_URL (max ${MAX_WAIT_MIN} min)..."

while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  if node -e "
      fetch('${BASE_URL}/api/embed', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: '${MODEL}', input: 'ping' }),
        signal: AbortSignal.timeout(20000),
      }).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1));
    " 2>/dev/null; then
    echo "[index] Indexation des projets, tâches et messages..."
    ./node_modules/.bin/tsx scripts/reindex-knowledge.ts \
      && echo "[index] Index terminé." \
      || echo "[index] AVERTISSEMENT : indexation échouée. Relancer : docker compose exec app npm run reindex"
    exit 0
  fi
  sleep 20
done

echo "[index] AVERTISSEMENT : Ollama n'a pas répondu en ${MAX_WAIT_MIN} min."
echo "[index] Relancer manuellement : docker compose exec app npm run reindex"
