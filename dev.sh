#!/usr/bin/env bash
# Script para levantar el dev server desde la raíz del proyecto
# Uso: ./dev.sh
set -e
cd "$(dirname "$0")/app"
source ~/.nvm/nvm.sh 2>/dev/null && nvm use 20 2>/dev/null || true
npm run dev
