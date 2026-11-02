#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=========================================================="
echo "🛑 Deteniendo NEXO LEADS..."
echo "=========================================================="

stopped=0

if [ -f ".backend.pid" ]; then
    PID=$(cat .backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "→ Deteniendo Backend (PID: $PID)..."
        kill -15 $PID > /dev/null 2>&1 || true
        stopped=1
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    PID=$(cat .frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "→ Deteniendo Frontend (PID: $PID)..."
        kill -15 $PID > /dev/null 2>&1 || true
        stopped=1
    fi
    rm -f .frontend.pid
fi

# Fallback cleanup for lingering processes on ports 8000 & 5173
fuser -k 8000/tcp > /dev/null 2>&1 || true
fuser -k 5173/tcp > /dev/null 2>&1 || true

echo "✓ Todos los procesos de NEXO LEADS han sido detenidos."
echo "=========================================================="
