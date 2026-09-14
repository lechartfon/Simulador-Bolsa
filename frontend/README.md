# Frontend — Simulador de Bolsa

React + Vite + MUI. Usa el cliente centralizado `src/lib/api.js` con `VITE_API_BASE_URL` (por defecto `/api`).

## Desarrollo local (modo host)

```powershell
npm ci
npm run dev
```

Vite proxya `/api` a `http://localhost:8000` (ver `vite.config.js`).

## Producción local (Docker)

El `Dockerfile` compila con `VITE_API_BASE_URL=/api` y sirve con Nginx, que proxya `/api/` al backend.

## Scripts

- `npm run dev`: desarrollo
- `npm run lint`: ESLint (0 errores)
- `npm run build`: build de producción
