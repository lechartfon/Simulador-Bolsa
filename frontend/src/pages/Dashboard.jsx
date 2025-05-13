import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AccountValueChart from '../components/Charts/AccountValueChart';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const Dashboard = () => {
  const [accountSummary, setAccountSummary] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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


  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress size={60} />
        </Box>
      ) : accountSummary && (
        <>
          <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Dashboard
          </Typography>

          {/* Gráfica del valor de la cuenta */}
          <Paper 
            elevation={3} 
            sx={{ 
              mb: 4, 
              p: { xs: 2, md: 3 },
              borderRadius: 2,
              backgroundColor: 'white'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 2, textAlign: { xs: 'center', md: 'left' } }}>
              Evolución del valor de la cuenta
            </Typography>
            <Box sx={{ width: '100%', height: { xs: '300px', md: '400px' }, overflow: 'hidden' }}>
              <AccountValueChart 
                accountValue={accountSummary.valorTotal}
                cashBalance={accountSummary.balance}
                stocksValue={accountSummary.valorAcciones}
              />
            </Box>
          </Paper>

          {/* Información de la cuenta*/}
          <Paper 
            elevation={3} 
            sx={{ 
              mb: 4, 
              p: { xs: 2, md: 3 },
              borderRadius: 2,
              backgroundColor: 'white'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 2, textAlign: { xs: 'center', md: 'left' } }}>
              Información de Cuenta
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {/* Valor Total de la Cuenta */}
              <Grid item xs={12} sm={10} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    width: { xs: '100%', sm: '90%', md: '400px' }
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                      Valor Total de la Cuenta
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ textAlign: 'center' }}>
                      {formatCurrency(accountSummary.valorTotal)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'center' }}>
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
              <Grid item xs={12} sm={10} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    width: { xs: '100%', sm: '90%', md: '400px' }
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                      Dinero Disponible para Invertir
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ textAlign: 'center' }}>
                      {formatCurrency(accountSummary.balance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Valor de Acciones: {formatCurrency(accountSummary.valorAcciones)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Performance Cards */}
          <Paper 
            elevation={3} 
            sx={{ 
              mb: 4, 
              p: { xs: 2, md: 3 },
              borderRadius: 2,
              backgroundColor: 'white'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 2, textAlign: { xs: 'center', md: 'left' } }}>
              Rendimiento de Inversiones
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {/* Mejor Rendimiento */}
              <Grid item xs={12} sm={10} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    width: { xs: '100%', sm: '90%', md: '400px' }
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                      Mejor Rendimiento
                    </Typography>
                    {accountSummary.mejorAccion ? (
                      <>
                        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                          {accountSummary.mejorAccion.company_name}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            Precio de compra: {formatCurrency(accountSummary.mejorAccion.avg_purchase_price)}
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            Precio actual: {formatCurrency(accountSummary.mejorAccion.current_price)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'center' }}>
                            <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                            <Typography variant="body1" color="success.main">
                              Ganancia: {formatCurrency((accountSummary.mejorAccion.current_price - accountSummary.mejorAccion.avg_purchase_price) * accountSummary.mejorAccion.shares_owned)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" sx={{ textAlign: 'center' }}>No hay acciones en cartera</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Peor Rendimiento */}
              <Grid item xs={12} sm={10} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    width: { xs: '100%', sm: '90%', md: '400px' }
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                      Peor Rendimiento
                    </Typography>
                    {accountSummary.peorAccion ? (
                      <>
                        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                          {accountSummary.peorAccion.company_name}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            Precio de compra: {formatCurrency(accountSummary.peorAccion.avg_purchase_price)}
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            Precio actual: {formatCurrency(accountSummary.peorAccion.current_price)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'center' }}>
                            <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                            <Typography variant="body1" color="error.main">
                              Pérdida: {formatCurrency((accountSummary.peorAccion.current_price - accountSummary.peorAccion.avg_purchase_price) * accountSummary.peorAccion.shares_owned)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" sx={{ textAlign: 'center' }}>No hay acciones en cartera</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Portfolio Composition */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 2, md: 3 },
              borderRadius: 2,
              backgroundColor: 'white'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 2, textAlign: { xs: 'center', md: 'left' } }}>
              Composición de Cartera
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'center', sm: 'center' }, 
              flexWrap: 'wrap',
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Número total de acciones: {portfolio.reduce((total, stock) => total + stock.shares_owned, 0)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Número de empresas diferentes: {portfolio.length}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                component={Link} 
                to="/portfolio" 
                startIcon={<ShowChartIcon />}
                size="large"
                sx={{ 
                  mt: { xs: 2, sm: 0 },
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                  }
                }}
              >
                Ver Portfolio Completo
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Dashboard; 