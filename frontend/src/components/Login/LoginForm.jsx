import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Grid,
  Alert,
  Divider,
  useTheme
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      {/* Left 2/3 image section */}
      <Box
        sx={{
          flex: '2',
          backgroundImage: `url('/Fondo-Inversion.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: { xs: 'none', md: 'block' },
          margin: 0,
          padding: 0
        }}
      />
      
      {/* Right 1/3 login form section */}
      <Box
        sx={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: { xs: 2, sm: 4 },
          overflowY: 'auto',
          boxShadow: '-5px 0 15px rgba(0,0,0,0.1)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '450px',
            mx: 'auto',
            width: '100%'
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" fontWeight="500" mb={4}>
            Iniciar Sesión
          </Typography>
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              size="large"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              size="large"
            />
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 4, mb: 3, py: 1.5, borderRadius: 2, fontSize: '1rem' }}
            >
              Iniciar Sesión
            </Button>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                o
              </Typography>
            </Divider>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  component={Link}
                  to="/register"
                  fullWidth
                  variant="outlined"
                  sx={{ borderRadius: 2, py: 1.2 }}
                >
                  Crear una cuenta
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  onClick={handleLogout}
                  fullWidth
                  variant="text"
                  color="error"
                  sx={{ mt: 1, borderRadius: 2 }}
                >
                  Cerrar sesión
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginForm;
