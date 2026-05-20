# Demo ACA 3 - Asocampo

Aplicacion web de demostracion basada en `ACA_2.pdf` y `Enunciado ACA 3.pdf`, reorganizada para desplegarse en una sola URL con Vercel.

## Arquitectura final

- `src/`, `index.html`, `package.json`: frontend React + Vite servido desde la raiz.
- `api/index.py`: punto de entrada de FastAPI para Vercel.
- `backend/app/`: logica del backend, modelos SQLAlchemy y datos semilla.
- `vercel.json`: indica a Vercel que el build estatico sale en `dist`.

En produccion:

- `/` sirve la interfaz React.
- `/api/*` sirve FastAPI desde la misma URL.
- `DATABASE_URL` apunta a PostgreSQL.

## Endpoints principales

- `/api/health`
- `/api/dashboard`
- `/api/producers`
- `/api/buyers`
- `/api/offers`
- `/api/market-prices`
- `/api/preorders`
- `/api/traceability/{code}`

## Desarrollo local

### Backend

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd ..
npm install
npm run dev
```

Para desarrollo local del frontend con el backend separado, puedes crear un archivo `.env.local` en la raiz con:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## PostgreSQL

Ejemplo de conexion:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/asocampo
```

## Deploy en Vercel

1. Sube esta carpeta raiz a GitHub.
2. Importa el repositorio en Vercel.
3. Configura la variable de entorno `DATABASE_URL`.
4. Ejecuta el despliegue.

Vercel detectara:

- frontend Vite en la raiz
- funcion Python en `api/index.py`
- una sola URL publica para frontend y backend

## Cobertura del ACA 3

- Interfaz funcional
- Flujo de datos
- Modulo de entrada y salida de informacion
- Registro de roles
- Visualizacion de resultados y trazabilidad
