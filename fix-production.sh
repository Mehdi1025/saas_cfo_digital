#!/usr/bin/env bash
#
# Copifi — correctif rapide erreur 500 (cache, permissions, hot file)
# Usage : bash fix-production.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

log "Correctif production Copifi"

# Supprimer le fichier dev Vite (cause chargement infini ou erreurs)
rm -f public/hot

# Permissions ecriture Laravel
chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

# Purger tous les caches (views compilees, config, routes)
php artisan optimize:clear

# Verifier APP_KEY
if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    echo "[ATTENTION] APP_KEY manquant ou invalide dans .env — executez : php artisan key:generate"
fi

# Verifier manifest Vite (chemin attendu par Laravel)
if [ ! -f public/build/manifest.json ]; then
    echo "[ERREUR] public/build/manifest.json absent."
    echo "         Lancez : npm run build   (ou bash deploy.sh)"
    exit 1
fi

log "Manifest OK : public/build/manifest.json"

# Reconstruire les caches production
php artisan config:cache
php artisan route:cache
php artisan view:cache

log "Correctif termine. Rechargez le site."
