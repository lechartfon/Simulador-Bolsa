import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
  Divider,
  Paper,
  Avatar,
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TimelineIcon from "@mui/icons-material/Timeline";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import SecurityIcon from "@mui/icons-material/Security";

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const features = [
    {
      title: "Simulación Realista",
      description:
        "Experimenta con un entorno de trading que simula el mercado real con datos actualizados.",
      icon: (
        <ShowChartIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      title: "Classroom",
      description:
        "Aprende con otros y participa en competiciones en un entorno educativo controlado.",
      icon: (
        <SchoolIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      title: "Gestión de Cartera",
      description:
        "Realiza un seguimiento de tus inversiones y analiza el rendimiento de tu cartera.",
      icon: (
        <AccountBalanceWalletIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      title: "Datos en Tiempo Real",
      description:
        "Accede a gráficos y estadísticas para tomar decisiones informadas.",
      icon: (
        <TimelineIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      title: "Noticias Financieras",
      description:
        "Mantente informado con las últimas noticias que afectan al mercado.",
      icon: (
        <NewspaperIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      title: "Entorno Seguro",
      description:
        "Practica inversiones sin riesgo con 50.000€ de capital inicial virtual.",
      icon: (
        <SecurityIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
  ];

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ShowChartIcon sx={{ mr: 1 }} />
              Stock Simulator
            </Box>
          </Typography>
          <Button component={Link} to="/login" color="inherit" sx={{ mx: 1 }}>
            Iniciar Sesión
          </Button>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            color="secondary"
            sx={{ color: "white" }}
          >
            Registrarse
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sección Hero */}
      <Box
        sx={{
          pt: 8,
          pb: 6,
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/Fondo-Inversion.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          textAlign: "center",
        }}
      >
        <Container maxWidth="sm">
          <Typography
            component="h1"
            variant="h2"
            sx={{
              fontWeight: 600,
              mb: 4,
            }}
          >
            Simula. Aprende. Invierte.
          </Typography>
          <Typography variant="h5" paragraph>
            La plataforma educativa que te permite aprender a invertir en la
            bolsa sin riesgos reales
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              color="secondary"
              size="large"
              sx={{
                fontSize: "1.1rem",
                py: 1.5,
                px: 4,
                mb: 2,
                mx: 1,
              }}
            >
              Empieza Gratis
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="large"
              sx={{
                fontSize: "1.1rem",
                py: 1.5,
                px: 4,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
                borderColor: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderColor: "white",
                },
                mb: 2,
                mx: 1,
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Sección Características Principales */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Características Principales
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="textSecondary"
          paragraph
          sx={{ mb: 6 }}
        >
          Todo lo que necesitas para aprender a invertir en la bolsa de manera
          segura
        </Typography>

        <Grid container spacing={4} alignItems="stretch">
          {features.map((feature, index) => (
            <Grid
              item
              key={index}
              xs={12}
              sm={6}
              md={4}
              sx={{ display: "flex" }}
            >
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 20px rgba(0, 0, 0, 0.15)",
                  },
                }}
                elevation={3}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    p: 4,
                  }}
                >
                  <Box
                    sx={{
                      mb: 3,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "60px",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    gutterBottom
                    variant="h5"
                    component="h3"
                    sx={{ mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography color="textSecondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Sección Cómo Funciona */}
      <Box sx={{ bgcolor: "background.paper", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Cómo Funciona
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="textSecondary"
            paragraph
            sx={{ mb: 6 }}
          >
            Tres sencillos pasos para comenzar tu camino en las inversiones
          </Typography>

          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: theme.palette.primary.main,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  1
                </Avatar>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  Regístrate
                </Typography>
                <Typography color="textSecondary">
                  Crea tu cuenta en menos de un minuto y recibe €50.000 en
                  capital virtual para invertir.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: theme.palette.secondary.main,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  2
                </Avatar>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  Aprende
                </Typography>
                <Typography color="textSecondary">
                  Familiarízate con la plataforma, explora los distintos
                  mercados y análisis disponibles.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: theme.palette.success.main,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  3
                </Avatar>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  Invierte
                </Typography>
                <Typography color="textSecondary">
                  Realiza operaciones sin riesgo, construye tu cartera y
                  monitoriza tu rendimiento.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Seccion CTA */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: "white",
          py: 6,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom>
            ¿Listo para empezar tu viaje de inversión?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4 }}>
            Únete a miles de estudiantes e inversores que están mejorando sus
            habilidades financieras
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            color="secondary"
            size="large"
            sx={{
              fontSize: "1.1rem",
              py: 1.5,
              px: 4,
            }}
          >
            Crear Cuenta Gratuita
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: "background.paper", py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h6" align="center" gutterBottom>
            Stock Simulator
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="textSecondary"
            component="p"
          >
            Aprende a invertir de manera segura
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 2 }}
          >
            © {new Date().getFullYear()} Stock Simulator. Todos los derechos
            reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
