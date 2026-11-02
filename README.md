# NEXO LEADS — Buscador Local de Clientes para NEXO WEB

**NEXO LEADS** es una herramienta local de prospección comercial diseñada para identificar negocios de Lima Metropolitana que **no tienen una página web propia o únicamente cuentan con perfiles de redes sociales**.

El propósito comercial es nutrir el servicio **NEXO WEB**, enfocado en la creación de páginas web profesionales accesibles con precios de lanzamiento de **S/ 100 y S/ 150**.

El sistema funciona **100% de forma local en tu computadora con Arch Linux**, sin requerir suscripciones ni pagos a APIs comerciales externas de terceros.

---

## 🚀 Inicio Rápido en Arch Linux

### 1. Requisitos Previos
Asegúrate de contar con Python 3 y Node.js en Arch Linux:
```bash
sudo pacman -S python nodejs npm
```

### 2. Instalación Automática
El script configura el entorno virtual `.venv`, instala las dependencias de Python y Node.js, e inicializa la base de datos SQLite con los distritos y categorías comerciales de Lima:
```bash
./setup.sh
```

### 3. Iniciar la Aplicación
Inicia automáticamente el backend (FastAPI) y el frontend (Vite/React) en segundo plano:
```bash
./start.sh
```

Una vez iniciado, abre tu navegador en:
- **Panel Web (Frontend):** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **API REST Local:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Documentación Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 4. Detener la Aplicación
Para cerrar todos los procesos de forma limpia:
```bash
./stop.sh
```

---

## 🛠️ Características Principales

### 1. Búsqueda por Distritos de Lima Metropolitana
Configuración inicial con coordenadas administrativas reales de:
- Jesús María
- Lince
- Pueblo Libre
- Miraflores
- San Isidro
- Magdalena del Mar
- San Miguel
- Santiago de Surco
- San Borja
- La Molina
- Barranco
- Lima Cercado

### 2. Cuadrícula Geográfica Persistente
- División automática del distrito en celdas configurables (0.5 km, 1.0 km, 2.0 km).
- Cada celda representa una tarea de exploración independiente.
- Progreso persistido en SQLite: puedes cerrar la aplicación, reiniciar tu equipo y continuar.
- Control en vivo: pausar, reanudar o cancelar exploraciones.

### 3. Normalización y Deduplicación
- **Teléfonos peruanos:** Reconoce y formatea números móviles (`+51 9XX XXX XXX`) y fijos de Lima (`(01) XXX-XXXX`).
- **Detección de duplicados:** Identificadores únicos de origen OSM, coincidencia por teléfono normalizado con similitud de nombre, y proximidad geográfica con tolerancia de distancia (Haversine).
- **Protección de datos:** No fusiona indiscriminadamente registros dudosos ni inventa datos ausentes.

### 4. Motor Propio de Detección y Clasificación Web
Verificación en 4 etapas sin depender de APIs de pago:
1. **Etapa 1 (Datos de origen):** Comprueba si la fuente declara una URL, separando perfiles de redes sociales (Facebook, Instagram, TikTok) y marketplaces (PedidosYa, Páginas Amarillas).
2. **Etapa 2 (Búsqueda complementaria):** Conector extensible para búsquedas web abiertas.
3. **Etapa 3 (Comprobación técnica segura):**
   - **Protección contra SSRF:** Bloquea accesos a localhost, rangos privados (RFC 1918) y metadatos en la nube.
   - Verificación de estado HTTP, resolución de dominio y latencia.
   - Coincidencia de contenido (título HTML y metadatos) con el nombre del negocio.
4. **Etapa 4 (Clasificación):**
   - `SIN WEB DETECTADA`: Máxima prioridad comercial para Nexo Web.
   - `SOLO REDES SOCIALES`: Negocio activo en redes, pero sin presencia web independiente.
   - `WEB PROPIA DETECTADA`: Ya cuenta con sitio propio.
   - `WEB CON PROBLEMAS`: Sitio caído, error 404/500 o dominio no resuelve.
   - `REVISION MANUAL`: Directorio o resultados dudosos.
   - `PENDIENTE DE VERIFICACION`: En cola de análisis.

### 5. CRM Local y Exportación a Excel
- Estados comerciales: *Nuevo, Pendiente de contactar, Contactado, Respondió, Interesado, Venta cerrada, No interesado, No volver a contactar*.
- Botón de WhatsApp directo para iniciar contacto con un mensaje preconfigurado.
- Notas comerciales para registrar llamadas y acuerdos.
- Exportación a CSV compatible con Microsoft Excel (con marca de orden de bytes UTF-8 BOM).

---

## 🧪 Pruebas Automatizadas

El proyecto incluye una suite completa de pruebas unitarias y de integración que no dependen de conexión a Internet para ejecutarse:

```bash
source .venv/bin/activate
pytest -v
```

Cobertura de pruebas:
- Normalización de teléfonos peruanos y URLs.
- Deduplicación por origen, teléfono y distancia.
- Motor de verificación web y bloqueo de SSRF.
- Importación y mapeo de datos OSM.
- Generador de cuadrículas y ciclo de vida de exploraciones.
- Exportador a CSV compatible con Excel.
- Endpoints REST de la API FastAPI.

---

## 📜 Licencias y Fuentes de Datos

- Los datos geográficos y comerciales provienen de **OpenStreetMap** y se utilizan bajo los términos de la licencia **ODbL (Open Database License)**. Atribución: *© Colaboradores de OpenStreetMap*.
- El sistema incluye un extracto local para operar 100% desconectado, además de conectores para la API Overpass con límites de consulta respetuosos, tiempos de espera y caché local en disco.
