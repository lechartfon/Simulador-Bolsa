# Simulador de Bolsa

Aplicación web educativa para simular compra/venta de acciones, con aulas virtuales, ranking y noticias. Proyecto de hobby para portfolio: **uso exclusivamente local, datos sintéticos, sin dinero real ni asesoramiento financiero**.

## Stack

- Backend: FastAPI (Python 3.11), SQLAlchemy, Alembic, MySQL 8.0
- Frontend: React + Vite, Material UI, Highcharts, i18n ES/EN
- Infra local: Docker Compose (MySQL + migraciones + seed + API + web + phpMyAdmin opcional)

## Requisitos

- Git
- Docker Desktop con Compose v2
- Navegador
- Sin necesidad de instalar Python, Node ni MySQL en el host

## Inicio rápido

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Abre:

- App: `http://localhost:5173`
- API Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/healthz`
- phpMyAdmin (opcional): `docker compose --profile tools up -d`, luego `http://localhost:8080`

### Credenciales demo (solo local, datos ficticios)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@local.test` | `DemoAdmin123!` | admin |
| `demo@local.test` | `DemoTrader123!` | user |
| `student1@local.test` | `DemoTrader123!` | user |

Clase demo: código `DEMO01`.

## Reset

Conservando datos:

```powershell
docker compose down
```

Borrando la base local (destructivo):

```powershell
docker compose down -v --remove-orphans
docker compose up --build
```

## Arquitectura

```text
db (MySQL) -> migrate (Alembic) -> seed (datos sintéticos) -> api (FastAPI) -> web (React/Nginx)
phpMyAdmin opcional bajo el perfil `tools`
```

- Las migraciones viven en `backend/migrations/`.
- El seed sintético e idempotente vive en `backend/seed.py`.
- El frontend usa `/api` (proxy Nginx en Docker, proxy Vite en modo host).
- El precio de compra/venta lo decide el servidor a partir del último `stock_prices`; el cliente solo envía `company_id` y `quantity`.

## Modo host (opcional, desarrollo)

```powershell
docker compose up -d db
Copy-Item backend\.env.example backend\.env
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python migrate.py
python seed.py
uvicorn main:app --reload --port 8000
```

En otra terminal:

```powershell
cd frontend
npm ci
npm run dev
```

## Tests

Backend (SQLite temporal, sin Docker):

```powershell
cd backend
python -m pytest tests -q
```

Frontend:

```powershell
cd frontend
npm ci
npm run lint
npm run build
npm audit --omit=dev
```

Smoke test manual tras `docker compose up --build`: login demo, listar empresas, ver gráfico, comprar, vender, crear/unirse a clase, ver leaderboard, CRUD de noticias como admin.

## Limitaciones conocidas

- JWT en `localStorage`: aceptable para demo local, no para producción.
- Sin rate limiting, verificación de email ni MFA.
- Gráficos con datos sintéticos.
- Sin despliegue productivo: sin TLS, WAF ni backups remotos.

## Licencia

MIT. Ver `LICENSE`. Revisa también la licencia de Highcharts y el origen de imágenes antes de reutilizarlas comercialmente.
