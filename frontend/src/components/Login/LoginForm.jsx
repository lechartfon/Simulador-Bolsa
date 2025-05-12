import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      console.log("Iniciando sesión con:", { username: email, password: "***" });
      
      const res = await axios.post("http://localhost:8000/login", {
        username: email, 
        password,
      });
      
      console.log("Respuesta del login:", res.data);
      
      if (res.data.access_token) {
        // Guardar el token con el prefijo "Bearer "
        const token = res.data.access_token;
        localStorage.setItem("token", token);
        
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          console.log("Usuario guardado:", res.data.user);
        }
        
        console.log("Token guardado:", token);
        
        try {
          const testRes = await axios.get("http://localhost:8000/empresas", {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log("Test de token exitoso:", testRes.status);
          navigate("/transacciones");
        } catch (testError) {
          console.error("Error al probar el token:", testError);
          setError("Error al verificar la sesión. Por favor, intenta nuevamente.");
        }
      } else {
        console.error("Error: No se recibió token en la respuesta");
        setError("Error al iniciar sesión: No se recibió token del servidor");
      }
    } catch (error) {
      console.error("Error during login:", error.response ? error.response.data : error);
      setError("Login failed. Please check your credentials.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  return (
    <div className="page-container">
      <div className="image-section"></div>
      <div className="form-section">
        <div className="card">
          <div className="card-header">
            <div className="text-header">Iniciar Sesión</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Correo electrónico:</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Contraseña:</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
              <button type="submit" className="btn">
                Iniciar sesión
              </button>
            </form>
            <button onClick={handleLogout} className="btn logout-btn">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
