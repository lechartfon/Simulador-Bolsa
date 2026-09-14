import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../lib/api";
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
import { useTranslation } from "react-i18next";

const FormularioRegistro = () => {
  const { t } = useTranslation();
  const [datosFormulario, setDatosFormulario] = useState({
    correo: "",
    contrasena: "",
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

    if (name === "contrasena") {
      validarContrasena(value);
      validarConfirmacion(value, formularioActualizado.confirmarContrasena);
    } else if (name === "confirmarContrasena") {
      validarConfirmacion(datosFormulario.contrasena, value);
    }
  };
  const validarContrasena = (contrasena) => {
    let puntos = 0;
    let mensaje = "";

    if (validadores.longitud.test(contrasena)) puntos += 25;
    if (validadores.numero.test(contrasena)) puntos += 25;
    if (validadores.mayuscula.test(contrasena)) puntos += 25;
    if (validadores.minuscula.test(contrasena)) puntos += 25;

    if (puntos === 100) {
      mensaje = t("register.passwordValid");
    } else if (!validadores.longitud.test(contrasena)) {
      mensaje = t("register.passwordLength");
    } else if (!validadores.numero.test(contrasena)) {
      mensaje = t("register.passwordNumber");
    } else if (!validadores.mayuscula.test(contrasena)) {
      mensaje = t("register.passwordUppercase");
    } else if (!validadores.minuscula.test(contrasena)) {
      mensaje = t("register.passwordLowercase");
    }

    setFuerzaContrasena(puntos);
    setMensajeContrasena(mensaje);
  };

  const validarConfirmacion = (contrasena, confirmarContrasena) => {
    if (contrasena === confirmarContrasena && contrasena !== "") {
      setMensajeConfirmacion(t("register.passwordsMatch"));
    } else {
      setMensajeConfirmacion(t("register.passwordsNoMatch"));
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
      datosFormulario.contrasena !== datosFormulario.confirmarContrasena
    ) {
      setErrorEnvio(t("register.fixErrors"));
      return; 
    }

    setErrorEnvio("");

    const datosUsuario = {
      email: datosFormulario.correo.trim(),
      password: datosFormulario.contrasena,
    };

    try {
      await api.post("/register", datosUsuario);
      alert(t("register.successAlert"));
      navegar("/login");
    } catch {
      setErrorEnvio(t("register.registerError"));
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
            {t("register.title")}
          </Typography>
          <Box component="form" onSubmit={enviarFormulario} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="correo"
              autoFocus
              label={t("register.email")}
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
              name="contrasena"
              label={t("register.password")}
              type="password"
              id="contrasena"
              value={datosFormulario.contrasena}
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
              label={t("register.confirmPassword")}
              type="password"
              id="confirmarContrasena"
              value={datosFormulario.confirmarContrasena}
              onChange={manejarCambio}
              variant="outlined"
              size="large"
            />
            
            <Typography 
              variant="caption" 
              color={datosFormulario.contrasena === datosFormulario.confirmarContrasena && datosFormulario.confirmarContrasena !== "" 
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
              {t("register.submit")}
            </Button>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t("common.or")}
              </Typography>
            </Divider>
            
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="outlined"
              sx={{ borderRadius: 2, py: 1.2 }}
            >
              {t("register.haveAccount")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FormularioRegistro;
