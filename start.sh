#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=========================================================="
echo "🚀 Iniciando NEXO LEADS (Buscador Local de Clientes)"
echo "=========================================================="

# Check if setup has run
if [ ! -d ".venv" ] || [ ! -d "frontend/node_modules" ]; then
    echo "→ Entorno no configurado aún. Ejecutando ./setup.sh..."
    ./setup.sh
fi

# Stop previous instances if running
if [ -f ".backend.pid" ] || [ -f ".frontend.pid" ]; then
    echo "→ Deteniendo instancias previas..."
    ./stop.sh > /dev/null 2>&1 || true
fi

source .venv/bin/activate

# Start Backend
echo "→ Levantando Backend FastAPI en http://127.0.0.1:8000..."
nohup "$DIR/.venv/bin/uvicorn" backend.app.main:app --host 127.0.0.1 --port 8000 </dev/null > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid
disown $BACKEND_PID

# Wait for backend health
echo -n "→ Verificando disponibilidad del backend..."
for i in {1..15}; do
    if curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
        echo " ✓ Conectado!"
        break
    fi
    sleep 0.5
    echo -n "."
done

# Start Frontend
echo "→ Levantando Frontend Vite en http://127.0.0.1:5173..."
cd frontend
nohup npx vite --host 127.0.0.1 --port 5173 </dev/null > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
disown $FRONTEND_PID
cd ..

sleep 1

echo ""
echo "=========================================================="
echo "✨ NEXO LEADS está listo y en ejecución local:"
echo ""
echo "   💻 Panel Web (Frontend):   http://127.0.0.1:5173"
echo "   ⚙️ API REST (Backend):     http://127.0.0.1:8000"
echo "   📚 Documentación Swagger:  http://127.0.0.1:8000/docs"
echo ""
echo "Logs del sistema:"
echo "   - Backend:  tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "Para detener la aplicación, ejecuta:"
echo "   ./stop.sh"
echo "=========================================================="
