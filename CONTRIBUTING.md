# Contribuir

Proyecto personal de hobby. Si quieres probar cambios en local:

1. Copia la configuración de ejemplo:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Levanta el stack:
   ```powershell
   docker compose up --build
   ```
3. Abre `http://localhost:5173`.

Normas mínimas:

- No subir secretos, `.env`, bases de datos ni dumps con datos personales.
- Añadir o actualizar tests cuando cambies compras, ventas, autenticación o migraciones.
- Mantener `npm run lint` sin errores y `pytest` en verde.
- El seed debe seguir siendo sintético, determinista e idempotente.
