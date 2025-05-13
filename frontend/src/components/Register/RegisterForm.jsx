import React, { useState } from "react";
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
  LinearProgress,
  useTheme
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();

  const regex = {
    length: /^.{8,}$/,
    number: /\d/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedForm);

    if (name === "password") {
      validatePassword(value);
      validateConfirmPassword(value, updatedForm.confirmPassword);
    } else if (name === "confirmPassword") {
      validateConfirmPassword(formData.password, value);
    }
  };

  const validatePassword = (password) => {
    let score = 0;
    let message = "";

    if (regex.length.test(password)) score += 25;
    if (regex.number.test(password)) score += 25;
    if (regex.uppercase.test(password)) score += 25;
    if (regex.lowercase.test(password)) score += 25;

    if (score === 100) {
      message = "Contraseña válida.";
    } else if (!regex.length.test(password)) {
      message = "Debe tener al menos 8 caracteres.";
    } else if (!regex.number.test(password)) {
      message = "Debe incluir al menos un número.";
    } else if (!regex.uppercase.test(password)) {
      message = "Debe incluir al menos una mayúscula.";
    } else if (!regex.lowercase.test(password)) {
      message = "Debe incluir al menos una minúscula.";
    }

    setPasswordStrength(score);
    setPasswordMessage(message);
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (password === confirmPassword && password !== "") {
      setConfirmMessage("Las contraseñas coinciden.");
    } else {
      setConfirmMessage("Las contraseñas no coinciden.");
    }
  };

  const getBarColor = () => {
    if (passwordStrength === 100) return theme.palette.success.main;
    if (passwordStrength >= 75) return theme.palette.warning.main;
    if (passwordStrength >= 50) return theme.palette.warning.light;
    return theme.palette.error.main;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      passwordStrength !== 100 ||
      formData.password !== formData.confirmPassword
    ) {
      setSubmitError("Corrige los errores antes de enviar el formulario.");
      return;
    }

    setSubmitError("");
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/register",
        userData
      );
      console.log("Registro exitoso:", response.data);
      alert("Registro exitoso. Redirigiendo a la página de login.");
      navigate("/login");
    } catch (error) {
      console.error("Error al registrarse:", error.response);
      setSubmitError("Error al registrarse. Por favor, intenta nuevamente.");
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
      
      {/* Right 1/3 register form section */}
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
          <Avatar sx={{ m: 1, bgcolor: theme.palette.secondary.main, width: 56, height: 56 }}>
            <PersonAddIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" fontWeight="500" mb={4}>
            Crear Cuenta
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nombre de usuario"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              variant="outlined"
              size="large"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo electrónico"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
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
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              size="large"
            />
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={passwordStrength} 
                sx={{ 
                  height: 8, 
                  borderRadius: 5,
                  bgcolor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getBarColor(),
                  }
                }} 
              />
              <Typography 
                variant="caption" 
                color={passwordStrength === 100 ? "success.main" : "error"}
                sx={{ mt: 1, display: 'block' }}
              >
                {passwordMessage}
              </Typography>
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              variant="outlined"
              size="large"
            />
            
            <Typography 
              variant="caption" 
              color={formData.password === formData.confirmPassword && formData.confirmPassword !== "" 
                ? "success.main" 
                : "error"}
              sx={{ mt: 1, display: 'block', mb: 2 }}
            >
              {confirmMessage}
            </Typography>
            
            {submitError && <Alert severity="error" sx={{ mt: 1, mb: 2 }}>{submitError}</Alert>}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              sx={{ mt: 3, mb: 3, py: 1.5, borderRadius: 2, fontSize: '1rem' }}
            >
              Registrarse
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
              ¿Ya tienes cuenta? Iniciar sesión
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterForm;
