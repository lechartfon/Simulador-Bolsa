import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AccountValueChart from '../components/Charts/AccountValueChart';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  AppBar, 
  Toolbar, 
  Button, 
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ClassIcon from '@mui/icons-material/Class';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const Dashboard = () => {
  const [accountSummary, setAccountSummary] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getAuthAxios = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    
    return axios.create({
      baseURL: 'http://localhost:8000',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    
    try {
      const authAxios = getAuthAxios();
      if (!authAxios) return;

      const walletResponse = await authAxios.get('/wallet');
      
      const portfolioResponse = await authAxios.get('/portfolio');
      setPortfolio(portfolioResponse.data);
      
      const valorAcciones = portfolioResponse.data.reduce(
        (total, stock) => total + (stock.shares_owned * stock.current_price), 
        0
      );
      
      const gananciasPerdidasTotales = portfolioResponse.data.reduce(
        (total, stock) => total + (stock.current_price - stock.avg_purchase_price) * stock.shares_owned, 
        0
      );
      
      const inversionTotal = portfolioResponse.data.reduce(
        (total, stock) => total + (stock.avg_purchase_price * stock.shares_owned), 
        0
      );
      
      const porcentajeCambio = inversionTotal > 0 
        ? (gananciasPerdidasTotales / inversionTotal) * 100 
        : 0;
      
      let mejorAccion = null;
      let peorAccion = null;
      
      if (portfolioResponse.data.length > 0) {
        const accionesOrdenadas = [...portfolioResponse.data].sort((a, b) => {
          const gananciaA = (a.current_price - a.avg_purchase_price) * a.shares_owned;
          const gananciaB = (b.current_price - b.avg_purchase_price) * b.shares_owned;
          return gananciaB - gananciaA;
        });
        
        mejorAccion = accionesOrdenadas[0];
        peorAccion = accionesOrdenadas[accionesOrdenadas.length - 1];
      }
      
      setAccountSummary({
        balance: walletResponse.data.balance,
        valorTotal: valorAcciones + walletResponse.data.balance,
        valorAcciones,
        gananciasPerdidasTotales,
        porcentajeCambio,
        mejorAccion,
        peorAccion
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar los datos. Por favor, recarga la página.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    cargarDatos();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Panel de Control
          </Typography>
          <Button 
            color="inherit" 
            component={Link} 
            to="/portfolio" 
            startIcon={<ShowChartIcon />}
          >
            Portfolio
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/Transacciones" 
            startIcon={<AccountBalanceWalletIcon />}
          >
            Transacciones
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/classroom" 
            startIcon={<ClassIcon />}
          >
            Classroom
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : accountSummary && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                Resumen de tu cuenta
              </Typography>
            </Box>

            {/* Gráfica del valor de la cuenta */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    mb: 4,
                    boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}15`
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      Evolución del valor de la cuenta
                    </Typography>
                    <Box sx={{ width: '100%', overflow: 'hidden' }}>
                      <AccountValueChart 
                        accountValue={accountSummary.valorTotal}
                        cashBalance={accountSummary.balance}
                        stocksValue={accountSummary.valorAcciones}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Valor Total de la Cuenta */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Valor Total de la Cuenta
                    </Typography>
                    <Typography variant="h3" component="div">
                      {formatCurrency(accountSummary.valorTotal)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {accountSummary.gananciasPerdidasTotales >= 0 ? (
                        <ArrowUpwardIcon color="success" />
                      ) : (
                        <ArrowDownwardIcon color="error" />
                      )}
                      <Typography
                        variant="body1"
                        color={accountSummary.gananciasPerdidasTotales >= 0 ? "success.main" : "error.main"}
                        component="span"
                      >
                        {accountSummary.porcentajeCambio.toFixed(2)}% ({formatCurrency(accountSummary.gananciasPerdidasTotales)})
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Dinero Disponible */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Dinero Disponible para Invertir
                    </Typography>
                    <Typography variant="h3" component="div">
                      {formatCurrency(accountSummary.balance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Valor de Acciones: {formatCurrency(accountSummary.valorAcciones)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Mejor Rendimiento */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Mejor Rendimiento
                    </Typography>
                    {accountSummary.mejorAccion ? (
                      <>
                        <Typography variant="h5" component="div">
                          {accountSummary.mejorAccion.company_name}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Precio de compra: {formatCurrency(accountSummary.mejorAccion.avg_purchase_price)}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            Precio actual: {formatCurrency(accountSummary.mejorAccion.current_price)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                            <Typography variant="body1" color="success.main">
                              Ganancia: {formatCurrency((accountSummary.mejorAccion.current_price - accountSummary.mejorAccion.avg_purchase_price) * accountSummary.mejorAccion.shares_owned)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1">No hay acciones en cartera</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Peor Rendimiento */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Peor Rendimiento
                    </Typography>
                    {accountSummary.peorAccion ? (
                      <>
                        <Typography variant="h5" component="div">
                          {accountSummary.peorAccion.company_name}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Precio de compra: {formatCurrency(accountSummary.peorAccion.avg_purchase_price)}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            Precio actual: {formatCurrency(accountSummary.peorAccion.current_price)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                            <Typography variant="body1" color="error.main">
                              Pérdida: {formatCurrency((accountSummary.peorAccion.current_price - accountSummary.peorAccion.avg_purchase_price) * accountSummary.peorAccion.shares_owned)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1">No hay acciones en cartera</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Resumen de Cartera */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Composición de Cartera</Typography>
                  <Typography variant="body2" gutterBottom>
                    Número total de acciones: {portfolio.reduce((total, stock) => total + stock.shares_owned, 0)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Número de empresas diferentes: {portfolio.length}
                  </Typography>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/portfolio" 
                    startIcon={<ShowChartIcon />}
                    sx={{ mt: 2 }}
                  >
                    Ver Portafolio Completo
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard; 