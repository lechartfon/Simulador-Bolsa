import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  Divider
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";

function LoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError(t("login.fillFields"));
      return;
    }

    try {
      const res = await api.post("/login", {
        username: email.trim(),
        password,
      });

      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);

        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        navigate("/transacciones");
      } else {
        setError(t("login.noToken"));
      }
    } catch {
      setError(t("login.loginError"));
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
        {/* Sección de login */}
      <Box
        sx={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
          overflowY: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '400px',
            mx: 'auto',
            width: '100%'
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h4" mb={3}>
            {t("login.title")}
          </Typography>
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t("login.email")}
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t("login.password")}
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {t("login.title")}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("common.or")}
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
                  {t("login.createAccount")}
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
                  {t("common.logout")}
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
