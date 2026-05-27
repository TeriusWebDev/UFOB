#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
info()  { echo -e "${GREEN}[RU-DEV]${RESET} $*"; }
warn()  { echo -e "${YELLOW}[RU-DEV]${RESET} $*"; }
error() { echo -e "${RED}[RU-DEV]${RESET} $*"; exit 1; }

cd "$(dirname "$0")"

echo ""
echo -e "${YELLOW}╔══════════════════════════════════════════╗${RESET}"
echo -e "${YELLOW}║   RU Digital UFOB  —  Modo Dev           ║${RESET}"
echo -e "${YELLOW}╚══════════════════════════════════════════╝${RESET}"
echo ""

if ! command -v node &>/dev/null; then
  error "Node.js não encontrado."
fi

if [ ! -f ".env" ]; then
  [ -f ".env.example" ] && cp .env.example .env && warn ".env criado a partir do .env.example — ajuste as variáveis."
  error ".env não encontrado."
fi

[ ! -d "node_modules" ] && npm install

info "Sincronizando banco..."
npx prisma db push --skip-generate

info "Iniciando em modo desenvolvimento (hot-reload)..."
exec node server.js
