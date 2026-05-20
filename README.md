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