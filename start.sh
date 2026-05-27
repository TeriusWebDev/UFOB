#!/usr/bin/env bash
set -euo pipefail

# ─── Cores ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
info()  { echo -e "${GREEN}[RU]${RESET} $*"; }
warn()  { echo -e "${YELLOW}[RU]${RESET} $*"; }
error() { echo -e "${RED}[RU]${RESET} $*"; exit 1; }

# ─── Diretório do script ───────────────────────────────────────────────────────
cd "$(dirname "$0")"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║   RU Digital UFOB  —  Iniciando...   ║${RESET}"
echo -e "${GREEN}╚══════════════════════════════════════╝${RESET}"
echo ""

# ─── 1. Node.js ───────────────────────────────────────────────────────────────
info "Verificando Node.js..."
if ! command -v node &>/dev/null; then
  error "Node.js não encontrado. Instale via: https://nodejs.org"
fi
NODE_VER=$(node -v)
info "Node.js $NODE_VER ✓"

# ─── 1b. Chromium (necessário para whatsapp-web.js) ───────────────────────────
if ! command -v chromium-browser &>/dev/null && ! command -v chromium &>/dev/null && ! command -v google-chrome &>/dev/null; then
  info "Chromium não encontrado. Instalando dependências para whatsapp-web.js..."
  if command -v apt-get &>/dev/null; then
    apt-get update -qq
    apt-get install -y -qq chromium-browser \
      ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
      libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libglib2.0-0 \
      libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 \
      libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 \
      libxss1 libxtst6 xdg-utils 2>/dev/null || \
    apt-get install -y -qq chromium 2>/dev/null || \
    warn "Não foi possível instalar Chromium automaticamente. Instale manualmente: apt install chromium-browser"
  else
    warn "apt-get não encontrado. Instale o Chromium manualmente."
  fi
else
  info "Chromium encontrado ✓"
fi

# ─── 2. .env ──────────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    warn ".env não encontrado — copiando de .env.example"
    cp .env.example .env
    warn "Edite o arquivo .env antes de continuar (NEXTAUTH_SECRET, NEXT_PUBLIC_WHATSAPP_EMPRESA, etc.)"
    warn "Depois execute: bash start.sh"
    exit 1
  else
    error ".env não encontrado. Crie o arquivo com as variáveis de ambiente necessárias."
  fi
fi
info ".env encontrado ✓"

# ─── 3. Dependências ──────────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  info "Instalando dependências (npm install)..."
  npm install
else
  info "node_modules encontrado ✓"
fi

# ─── 4. Banco de dados ────────────────────────────────────────────────────────
info "Sincronizando banco de dados (prisma db push)..."
npx prisma db push --skip-generate

# Seed apenas se o banco estiver vazio (sem nenhum Staff cadastrado)
STAFF_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.staff.count().then(n => { console.log(n); db.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$STAFF_COUNT" = "0" ]; then
  info "Banco vazio — executando seed inicial..."
  npx tsx prisma/seed.ts
fi

# ─── 5. Build ─────────────────────────────────────────────────────────────────
if [ ! -d ".next" ]; then
  info "Build não encontrado — executando next build (pode demorar alguns minutos)..."
  npm run build
else
  info "Build encontrado ✓"
fi

# ─── 6. Iniciar servidor ──────────────────────────────────────────────────────
HOST=$(grep '^HOST=' .env | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
PORT=$(grep '^PORT=' .env | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
HOST=${HOST:-127.0.0.1}
PORT=${PORT:-43221}

echo ""
info "Iniciando servidor em http://${HOST}:${PORT}"
info "Pressione Ctrl+C para parar."
echo ""

export NODE_ENV=production
exec node server.js
