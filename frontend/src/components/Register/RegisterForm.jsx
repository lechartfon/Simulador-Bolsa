import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  Divider,
  LinearProgress,
  useTheme
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const FormularioRegistro = () => {
  const [datosFormulario, setDatosFormulario] = useState({
    nombreUsuario: "",
    correo: "",
    ***REMOVED***: "",
    confirmarContrasena: "",
  });

  const [fuerzaContrasena, setFuerzaContrasena] = useState(0);
  const [mensajeContrasena, setMensajeContrasena] = useState("");
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");
  
  const navegar = useNavigate();
  const tema = useTheme();
  const validadores = {
    longitud: /^.{8,}$/,     // Mínimo 8 caracteres
    numero: /\d/,            // Al menos un número
    mayuscula: /[A-Z]/,      // Al menos una mayúscula
    minuscula: /[a-z]/,      // Al menos una minúscula
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    const formularioActualizado = {
      ...datosFormulario,
      [name]: value,
    };

    setDatosFormulario(formularioActualizado);

    if (name === "***REMOVED***") {
      validarContrasena(value);
      validarConfirmacion(value, formularioActualizado.confirmarContrasena);
    } else if (name === "confirmarContrasena") {
      validarConfirmacion(datosFormulario.***REMOVED***, value);
    }
  };
  const validarContrasena = (***REMOVED***) => {
    let puntos = 0;
    let mensaje = "";

    if (validadores.longitud.test(***REMOVED***)) puntos += 25;
    if (validadores.numero.test(***REMOVED***)) puntos += 25;
    if (validadores.mayuscula.test(***REMOVED***)) puntos += 25;
    if (validadores.minuscula.test(***REMOVED***)) puntos += 25;

    if (puntos === 100) {
      mensaje = "¡Contraseña válida!";
    } else if (!validadores.longitud.test(***REMOVED***)) {
      mensaje = "La contraseña debe tener al menos 8 caracteres";
    } else if (!validadores.numero.test(***REMOVED***)) {
      mensaje = "Falta un número en la contraseña";
    } else if (!validadores.mayuscula.test(***REMOVED***)) {
      mensaje = "Falta una letra mayúscula";
    } else if (!validadores.minuscula.test(***REMOVED***)) {
      mensaje = "Falta una letra minúscula";
    }

    setFuerzaContrasena(puntos);
    setMensajeContrasena(mensaje);
  };

  const validarConfirmacion = (***REMOVED***, confirmarContrasena) => {
    if (***REMOVED*** === confirmarContrasena && ***REMOVED*** !== "") {
      setMensajeConfirmacion("¡Las contraseñas coinciden!");
    } else {
      setMensajeConfirmacion("Las contraseñas no coinciden");
    }
  };
  const obtenerColorBarra = () => {
    if (fuerzaContrasena === 100) return tema.palette.success.main;
    if (fuerzaContrasena >= 75) return tema.palette.warning.main;
    if (fuerzaContrasena >= 50) return tema.palette.warning.light;
    return tema.palette.error.main;
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();

    if (
      fuerzaContrasena !== 100 ||
      datosFormulario.***REMOVED*** !== datosFormulario.confirmarContrasena
    ) {
      setErrorEnvio("Corrige los errores antes de enviar el formulario");
      return; 
    }

    setErrorEnvio("");
    
    const datosUsuario = {
      username: datosFormulario.nombreUsuario,
      email: datosFormulario.correo,
      password: datosFormulario.***REMOVED***,
    };

    try {
      const respuesta = await axios.post(
        "http://localhost:8000/register",
        datosUsuario
      );
      console.log("¡Registro completado con éxito!", respuesta.data);
      alert("¡Te has registrado correctamente! Ahora inicia sesión.");
      navegar("/login");
    } catch (error) {
      console.error("Error durante el registro:", error.response);
      setErrorEnvio("Hubo un problema con el registro. Inténtalo de nuevo.");
    }
  };
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
        >          <Avatar sx={{ m: 1, bgcolor: tema.palette.secondary.main, width: 56, height: 56 }}>
            <PersonAddIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" fontWeight="500" mb={4}>
            Crear Cuenta
          </Typography>
          <Box component="form" onSubmit={enviarFormulario} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="nombreUsuario"
              label="Nombre de usuario"
              name="nombreUsuario"
              autoComplete="username"
              autoFocus
              value={datosFormulario.nombreUsuario}
              onChange={manejarCambio}
              variant="outlined"
              size="large"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="correo"
              label="Correo electrónico"
              name="correo"
              autoComplete="email"
              value={datosFormulario.correo}
              onChange={manejarCambio}
              variant="outlined"
              size="large"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="***REMOVED***"
              label="Contraseña"
              type="password"
              id="***REMOVED***"
              value={datosFormulario.***REMOVED***}
              onChange={manejarCambio}
              variant="outlined"
              size="large"
            />
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={fuerzaContrasena} 
                sx={{ 
                  height: 8, 
                  borderRadius: 5,
                  bgcolor: tema.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: obtenerColorBarra(),
                  }
                }} 
              />
              <Typography 
                variant="caption" 
                color={fuerzaContrasena === 100 ? "success.main" : "error"}
                sx={{ mt: 1, display: 'block' }}
              >
                {mensajeContrasena}
              </Typography>
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmarContrasena"
              label="Confirmar Contraseña"
              type="password"
              id="confirmarContrasena"
              value={datosFormulario.confirmarContrasena}
              onChange={manejarCambio}
              variant="outlined"
              size="large"
            />
            
            <Typography 
              variant="caption" 
              color={datosFormulario.***REMOVED*** === datosFormulario.confirmarContrasena && datosFormulario.confirmarContrasena !== "" 
                ? "success.main" 
                : "error"}
              sx={{ mt: 1, display: 'block', mb: 2 }}
            >
              {mensajeConfirmacion}
            </Typography>
            
            {errorEnvio && <Alert severity="error" sx={{ mt: 1, mb: 2 }}>{errorEnvio}</Alert>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              sx={{ mt: 3, mb: 3, py: 1.5, borderRadius: 2, fontSize: '1rem' }}
            >
              Crear mi cuenta
            </Button>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                o
              </Typography>
            </Divider>
            
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="outlined"
              sx={{ borderRadius: 2, py: 1.2 }}
            >
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FormularioRegistro;
