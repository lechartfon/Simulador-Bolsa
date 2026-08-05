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
  AppBar,
  Toolbar,
  useTheme,
  Paper,
  Avatar,
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TimelineIcon from "@mui/icons-material/Timeline";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import SecurityIcon from "@mui/icons-material/Security";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

const LandingPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();

const features = [
    {
      titleKey: "landing.featureRealisticTitle",
      descriptionKey: "landing.featureRealisticDesc",
      icon: (
        <ShowChartIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      titleKey: "landing.featureClassroomTitle",
      descriptionKey: "landing.featureClassroomDesc",
      icon: (
        <SchoolIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      titleKey: "landing.featurePortfolioTitle",
      descriptionKey: "landing.featurePortfolioDesc",
      icon: (
        <AccountBalanceWalletIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      titleKey: "landing.featureRealTimeTitle",
      descriptionKey: "landing.featureRealTimeDesc",
      icon: (
        <TimelineIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      titleKey: "landing.featureNewsTitle",
      descriptionKey: "landing.featureNewsDesc",
      icon: (
        <NewspaperIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.main }}
        />
      ),
    },
    {
      titleKey: "landing.featureSafeTitle",
      descriptionKey: "landing.featureSafeDesc",
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
            {t('landing.login')}
          </Button>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            color="secondary"
            sx={{ color: "white" }}
          >
            {t('landing.register')}
          </Button>
          <LanguageSelector />
        </Toolbar>
      </AppBar>      
      {/* Banner principal */}
      <Box
        sx={{
          pt: 8,
          pb: 6,
          backgroundImage: `url('/Fondo-Inversion.png')`, 
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
            {t('landing.heroTitle')}
          </Typography>
          <Typography variant="h5" paragraph>
            {t('landing.heroSubtitle')}
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
              {t('landing.startFree')}
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
              {t('landing.login')}
            </Button>
          </Box>
        </Container>
      </Box>      
      {/* Lista de funcionalidades */}
      <Box sx={{ py: 8 }} maxWidth="lg">
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          {t('landing.featuresTitle')}
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="textSecondary"
          paragraph
          sx={{ mb: 6 }}
        >
          {t('landing.featuresSubtitle')}
        </Typography>

        <Grid container spacing={4} alignItems="stretch" justifyContent="center">
          {features.map((feature, index) => (
            <Grid
              item
              key={index}
              xs={12}
              sm={6}
              sx={{ 
                display: "flex", 
                justifyContent: "center",
                [theme.breakpoints.down("sm")]: {
                  display: "flex",
                  justifyContent: "center",
                }
              }}
            >
              <Card                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  minWidth: { xs: "90%", sm: 584 },
                  maxWidth: { xs: "90%", sm: 584 },
                  // Animación simplificada
                  "&:hover": {
                    boxShadow: "0 8px 12px rgba(0, 0, 0, 0.2)",
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
                    {t(feature.titleKey)}
                  </Typography>
                  <Typography color="textSecondary">
                    {t(feature.descriptionKey)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    {/* Sección Cómo Funciona */}
      <Box sx={{ bgcolor: "background.paper", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            {t('landing.howTitle')}
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="textSecondary"
            paragraph
            sx={{ mb: 6 }}
          >
            {t('landing.howSubtitle')}
          </Typography>

          <Grid container spacing={4} alignItems="stretch" justifyContent="center">
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              sx={{ 
                display: "flex", 
                justifyContent: "center",
                [theme.breakpoints.down("sm")]: {
                  display: "flex",
                  justifyContent: "center",
                }
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  width: "100%",
                  minWidth: { xs: "90%", sm: 300 },
                  maxWidth: { xs: "90%", sm: 300 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  height: "100%"
                }}
              >                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: "blue", 
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  1
                </Avatar>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  {t('landing.stepRegister')}
                </Typography>
                <Typography color="textSecondary">
                  {t('landing.stepRegisterDesc')}
                </Typography>
              </Paper>
            </Grid>
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              sx={{ 
                display: "flex", 
                justifyContent: "center",
                [theme.breakpoints.down("sm")]: {
                  display: "flex",
                  justifyContent: "center",
                }
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  width: "100%",
                  minWidth: { xs: "90%", sm: 300 },
                  maxWidth: { xs: "90%", sm: 300 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  height: "100%"
                }}
              >                
              <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: "purple", 
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  2
                </Avatar>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  {t('landing.stepLearn')}
                </Typography>
                <Typography color="textSecondary">
                  {t('landing.stepLearnDesc')}
                </Typography>
              </Paper>
            </Grid>
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              sx={{ 
                display: "flex", 
                justifyContent: "center",
                [theme.breakpoints.down("sm")]: {
                  display: "flex",
                  justifyContent: "center",
                }
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  width: "100%",
                  minWidth: { xs: "90%", sm: 300 },
                  maxWidth: { xs: "90%", sm: 300 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  height: "100%"
                }}
              >                
              <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: "green", 
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  3
                </Avatar>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  {t('landing.stepInvest')}
                </Typography>
                <Typography color="textSecondary">
                  {t('landing.stepInvestDesc')}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>      
      {/* Sección para registrarse */}
      <Box
        sx={{
          bgcolor: "#1976d2", 
          color: "white",
          py: 6,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom>
            {t('landing.ctaTitle')}
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4 }}>
            {t('landing.ctaSubtitle')}
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
              {t('landing.ctaButton')}
            </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: "background.paper", py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h6" align="center" gutterBottom>
            {t('brand')}
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="textSecondary"
            component="p"
          >
            {t('landing.footerTagline')}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 2 }}
          >
            {t('landing.footerRights', { year: new Date().getFullYear() })}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
