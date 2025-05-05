# 📈 Simulador de Bolsa

Este es un proyecto personal de simulador de bolsa hecho con **React** en el frontend y **FastAPI** en el backend. Los usuarios podrán registrarse, iniciar sesión, consultar su cartera de acciones, ver gráficos, realizar operaciones de compra/venta y revisar su historial de transacciones.

---

## 🛠️ Tecnologías utilizadas

- **Frontend:** [React](https://reactjs.org/) con [Vite](https://vitejs.dev/)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/)
- **Base de datos:** MySQL (ejecutada con Docker)
- **Librerías adicionales:** Axios, SQLAlchemy, dotenv, etc.

---

## 🚀 Cómo ejecutar el proyecto localmente

### 1. Clona el repositorio

```bash
git clone https://github.com/tuusuario/Simulador-Bolsa.git
cd Simulador-Bolsa

### 2. Levanta la base de datos con Docker
bash
Copiar
Editar
docker-compose up -d

Esto levantará un contenedor con MySQL y phpMyAdmin. Puedes acceder a phpMyAdmin en http://localhost:8080

Usuario: usuario

Contraseña: ***REMOVED***

Asegúrate de que Docker esté instalado y en ejecución.

### 3. Ejecutar el backend
bash
Copiar
Editar
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
Por defecto estará disponible en: http://localhost:8000

### 4. Ejecutar el frontend
bash
Copiado
Editar
cd frontend
npm install
npm run dev
Por defecto se abrirá en: http://localhost:5173

📫 Autor
Luan
GitHub: @lechartfon