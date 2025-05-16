# Simulador de Bolsa

Este proyecto consiste en una aplicación web que simula operaciones en el mercado de acciones, con funcionalidades para competiciones de trading en aulas virtuales.

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:

- [Node.js](https://nodejs.org/) (v16 o superior)
- [Python](https://www.python.org/) (v3.9 o superior)
- [Docker](https://www.docker.com/products/docker-desktop/) y Docker Compose
- [Git](https://git-scm.com/) (opcional, para control de versiones)
- Un editor de código como [VS Code](https://code.visualstudio.com/)

## Estructura del proyecto

El proyecto está dividido en dos partes principales:

- `backend`: API desarrollada con FastAPI (Python)
- `frontend`: Interfaz de usuario desarrollada con React y Material UI

## 1. Instrucciones de instalación

### 2. Configurar la base de datos con Docker

```bash
docker-compose up -d
```

Esto iniciará:
- Un servidor MySQL en el puerto 3306
- Una instancia de phpMyAdmin en el puerto 8080 (accesible en http://localhost:8080)

Credenciales de la base de datos:
- Usuario: usuario
- Contraseña: ***REMOVED***
- Nombre de la BD: simulador_bolsa

### 3. Configurar el Backend

1. Navegar al directorio del backend:
   ```bash
   cd backend
   ```

2. Crear un entorno virtual:
   ```bash
   python -m venv venv
   ```

3. Activar el entorno virtual (opcional):
   - En Windows:
     ```bash
     .\venv\Scripts\Activate
     ```
   - En Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

5. Asegúrate de que las siguientes librerías estén instaladas:
   ```bash
   pip install python-dotenv pymysql
   ```

7. Verifica que el archivo `.env` exista en la carpeta del backend con el siguiente contenido:
   ```
   DB_USER=usuario
   DB_PASSWORD=***REMOVED***
   DB_NAME=simulador_bolsa
   DB_HOST=localhost
   SECRET_KEY=***REMOVED***
   ```

8. Inicializar la base de datos:
   ```bash
   python initialize_db.py
   ```

9. Iniciar  backend (tarda unos segundos):
   ```bash
   python main.py
   ```
10. Inicia el servidor backend (tarda unos segundos):
   ```bash
   python -m uvicorn main:app --reload
   ```
   El backend estará disponible en http://localhost:8000
   Puedes acceder a los GET y POST de FastAPI en http://localhost:8000/docs

### 4. Configurar el Frontend

1. Abre otra terminal y navega al directorio del frontend:
   ```bash
   cd ../frontend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El frontend estará disponible en http://localhost:5173

## Uso de la aplicación

1. Abre tu navegador y navega a http://localhost:5173
2. Regístrate con los usuarios que desees y el usuario admin estará registrado, útil para poder realizar el CRUD en el apartado de noticias.

    - usuario = admin@admin
    - contraseña = admin 

3. Explora las diferentes funcionalidades:
   - Dashboard: Visualiza tu cartera y rendimiento
   - Comprar/Vender acciones: Realiza operaciones en el mercado
   - Aulas: Únete o crea competiciones de trading
   - Noticias: Mantente informado sobre el mercado

## SQL
He dejado el SQL que yo he utilizado con varios users con diferentes cuentas. Lo adjunto por si quereis jugar un poco y ver con algunos perfiles con varias estadísticas de varios días de uso...

Los emails podeís visualizarlo desde la base de datos, las contraseñas utilizadas en la mayoría de usuarios es: "***REMOVED***". luan@luan tiene varias cosas por ejemplo.

Se puede importar desde phpMyAdmin.

## Resolución de problemas comunes

### Errores de importación en el backend

Si encuentras errores como `ModuleNotFoundError: No module named 'backend'` o `ImportError: attempted relative import with no known parent package`, asegúrate de que todas las importaciones en los archivos de Python sean absolutas.

### Errores de conexión a la base de datos

Verifica que:
- El servicio de Docker esté funcionando correctamente (`docker ps`)
- Las credenciales en el archivo `.env` coincidan con las del `docker-compose.yml`
- El puerto 3306 esté disponible y no bloqueado por un firewall

### Problemas con las dependencias del frontend

Si encuentras errores con las dependencias:
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Otros errores (no debería) contáctame
Correo: lechartfon1@educacion.navarra.es