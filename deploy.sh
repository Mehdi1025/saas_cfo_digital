#!/usr/bin/env bash
#
# Copifi — deploiement production Cloudways (Debian, PHP 8.2+, Node 22 via nvm)
# Usage : bash deploy.sh
#         DEPLOY_RUN_MIGRATIONS=1 bash deploy.sh   # inclut php artisan migrate --force
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() {
    printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
    printf '\n[ERREUR] %s\n' "$*" >&2
    exit 1
}

log "Deploiement Copifi — $(pwd)"

# ---------------------------------------------------------------------------
# Node 22 via nvm (Cloudways)
# ---------------------------------------------------------------------------
export NVM_DIR="${HOME}/.nvm"
if [ -s "${NVM_DIR}/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "${NVM_DIR}/nvm.sh"
fi
if [ -s "${HOME}/.profile" ]; then
    # shellcheck disable=SC1091
    . "${HOME}/.profile"
fi

if command -v nvm >/dev/null 2>&1; then
    nvm use 22 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
fi

command -v node >/dev/null 2>&1 || fail "Node introuvable. Installez nvm + Node 22 sur Cloudways."
command -v npm >/dev/null 2>&1 || fail "npm introuvable."
command -v php >/dev/null 2>&1 || fail "php introuvable."
command -v composer >/dev/null 2>&1 || fail "composer introuvable."

log "Node $(node -v) | npm $(npm -v) | PHP $(php -r 'echo PHP_VERSION;')"

# ---------------------------------------------------------------------------
# Supprimer le mode dev Vite (cause #1 du chargement infini en prod)
# ---------------------------------------------------------------------------
if [ -f public/hot ]; then
    log "Suppression de public/hot (fichier dev Vite — ne doit pas exister en prod)"
    rm -f public/hot
fi

# ---------------------------------------------------------------------------
# PHP
# ---------------------------------------------------------------------------
log "composer install --no-dev --optimize-autoloader"
composer install --no-dev --optimize-autoloader --no-interaction

# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------
if [ -d node_modules ]; then
    log "Suppression de node_modules (evite EPERM chmod sur Cloudways)"
    rm -rf node_modules
fi

log "npm ci"
npm ci --no-audit --no-fund

log "npm run build"
npm run build

if [ ! -f public/build/manifest.json ]; then
    fail "public/build/manifest.json absent apres le build. Verifiez npm run build."
fi

log "Manifest OK : public/build/manifest.json"

# ---------------------------------------------------------------------------
# Laravel cache
# ---------------------------------------------------------------------------
log "php artisan optimize:clear"
php artisan optimize:clear

log "php artisan config:cache"
php artisan config:cache

log "php artisan route:cache"
php artisan route:cache

log "php artisan view:cache"
php artisan view:cache

# ---------------------------------------------------------------------------
# Migrations (optionnel)
# ---------------------------------------------------------------------------
if [ "${DEPLOY_RUN_MIGRATIONS:-0}" = "1" ]; then
    log "php artisan migrate --force"
    php artisan migrate --force
fi

# ---------------------------------------------------------------------------
# Permissions (Cloudways)
# ---------------------------------------------------------------------------
if [ -d storage ] && [ -d bootstrap/cache ]; then
    log "Permissions storage/ et bootstrap/cache/"
    chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true
fi

log "Deploiement termine avec succes."
log "Verifiez APP_URL, APP_ENV=production et APP_DEBUG=false dans .env avant le premier deploy."
