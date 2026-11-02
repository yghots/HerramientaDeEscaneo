#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "⚡ NEXO LEADS — Instalación y Configuración para Arch Linux"
echo "=========================================================="

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 no está instalado. Ejecuta: sudo pacman -S python"
    exit 1
fi
echo "✓ Python detectado: $(python3 --version)"

# 2. Check Node & NPM
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "❌ Error: Node.js o npm no están instalados. Ejecuta: sudo pacman -S nodejs npm"
    exit 1
fi
echo "✓ Node.js detectado: $(node --version)"
echo "✓ npm detectado: $(npm --version)"

# 3. Environment configuration
if [ ! -f ".env" ]; then
    echo "→ Creando archivo .env desde .env.example..."
    cp .env.example .env
fi

# 4. Virtual environment
if [ ! -d ".venv" ]; then
    echo "→ Creando entorno virtual Python (.venv)..."
    python3 -m venv .venv
fi

echo "→ Instalando dependencias de Python..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 5. Initialize database & seeds
echo "→ Inicializando base de datos SQLite y datos de Lima..."
python -m backend.app.db.init_db

# 6. Install frontend dependencies
echo "→ Instalando dependencias de Node.js en frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "=========================================================="
echo "✅ Instalación completada exitosamente."
echo "Para iniciar la aplicación ejecuta:"
echo "   ./start.sh"
echo "=========================================================="
