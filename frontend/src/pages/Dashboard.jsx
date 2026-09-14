import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import GraficaValorCuenta from '../components/Charts/AccountValueChart';
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
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [accountSummary, setAccountSummary] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const checkLogin = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };
  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Comprobar si hay token
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const walletResponse = await api.get('/wallet');
      
      const portfolioResponse = await api.get('/portfolio');
      setPortfolio(portfolioResponse.data);
      
      let valorAcciones = 0;
      for (let i = 0; i < portfolioResponse.data.length; i++) {
        valorAcciones += portfolioResponse.data[i].shares_owned * portfolioResponse.data[i].current_price;
      }
      
      let gananciasPerdidasTotales = 0;
      for (let i = 0; i < portfolioResponse.data.length; i++) {
        const stock = portfolioResponse.data[i];
        gananciasPerdidasTotales += (stock.current_price - stock.avg_purchase_price) * stock.shares_owned;
      }
      
      let inversionTotal = 0;
      for (let i = 0; i < portfolioResponse.data.length; i++) {
        inversionTotal += portfolioResponse.data[i].avg_purchase_price * portfolioResponse.data[i].shares_owned;
      }
      
      let porcentajeCambio = 0;
      if (inversionTotal > 0) {
        porcentajeCambio = (gananciasPerdidasTotales / inversionTotal) * 100;
      }
      let mejorAccion = null;
      let peorAccion = null;
      
      if (portfolioResponse.data.length > 0) {
        let accionesOrdenadas = [];
        for (let i = 0; i < portfolioResponse.data.length; i++) {
          accionesOrdenadas.push(portfolioResponse.data[i]);
        }
        
        accionesOrdenadas.sort(function(a, b) {
          const gananciaA = (a.current_price - a.avg_purchase_price) * a.shares_owned;
          const gananciaB = (b.current_price - b.avg_purchase_price) * b.shares_owned;
          if (gananciaB > gananciaA) return 1;
          if (gananciaB < gananciaA) return -1;
          return 0;
        });
        
        mejorAccion = accionesOrdenadas[0];
        peorAccion = accionesOrdenadas[accionesOrdenadas.length - 1];
      }
      
      setAccountSummary({
        balance: walletResponse.data.balance,
        valorTotal: valorAcciones + walletResponse.data.balance,
        valorAcciones: valorAcciones,
        gananciasPerdidasTotales: gananciasPerdidasTotales,
        porcentajeCambio: porcentajeCambio,
        mejorAccion: mejorAccion,
        peorAccion: peorAccion
      });
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(t('dashboard.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!checkLogin()) return;
    cargarDatos();
  }, [navigate]);


  const formatCurrency = (value) => {
    return value.toFixed(2) + " €";
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
          {t('dashboard.title')}
          </Typography>

          {/* Gráfica del valor de la cuenta */}          
          <Paper 
            elevation={2} 
            sx={{ 
              mb: 3, 
              p: 2,
              backgroundColor: 'white'
            }}
          >            <Typography variant="h5" gutterBottom>
              {t('dashboard.accountEvolution')}
            </Typography>
            <Box sx={{ width: '100%', height: { xs: '300px', md: '400px' }, overflow: 'hidden' }}>
              <GraficaValorCuenta 
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
              mb: 3, 
              p: 2,
              backgroundColor: 'white'
            }}
          >
            <Typography variant="h5" gutterBottom>
              {t('dashboard.accountInfo')}
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {/* Valor Total de la Cuenta */}              
              <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'center' }}>
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
                      {t('dashboard.totalAccountValue')}
                    </Typography>
                    <Typography variant="h3" align="center">
                      {formatCurrency(accountSummary.valorTotal)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, justifyContent: 'center' }}>
                      {accountSummary.gananciasPerdidasTotales >= 0 ? (
                        <ArrowUpwardIcon color="success" sx={{ mr: 1 }} />
                      ) : (
                        <ArrowDownwardIcon color="error" sx={{ mr: 1 }} />
                      )}
                      <Typography
                        variant="body1"
                        color={accountSummary.gananciasPerdidasTotales >= 0 ? "success.main" : "error.main"}
                      >
                        {accountSummary.porcentajeCambio.toFixed(2)}% ({formatCurrency(accountSummary.gananciasPerdidasTotales)})
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Dinero Disponible */}              
              <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'center' }}>
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
                      {t('dashboard.availableCash')}
                    </Typography>
                    <Typography variant="h3" align="center">
                      {formatCurrency(accountSummary.balance)}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        {t('dashboard.stocksValue', { value: formatCurrency(accountSummary.valorAcciones) })}
                      </Typography>
                    </Box>
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
              {t('dashboard.investmentPerformance')}
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
                      {t('dashboard.bestPerformer')}
                    </Typography>
                    {accountSummary.mejorAccion ? (
                      <>
                        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                          {accountSummary.mejorAccion.company_name}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            {t('dashboard.purchasePrice', { value: formatCurrency(accountSummary.mejorAccion.avg_purchase_price) })}
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            {t('dashboard.currentPrice', { value: formatCurrency(accountSummary.mejorAccion.current_price) })}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'center' }}>
                            <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                            <Typography variant="body1" color="success.main">
                              {t('dashboard.profit', { value: formatCurrency((accountSummary.mejorAccion.current_price - accountSummary.mejorAccion.avg_purchase_price) * accountSummary.mejorAccion.shares_owned) })}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" sx={{ textAlign: 'center' }}>{t('dashboard.noStocks')}</Typography>
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
                      {t('dashboard.worstPerformer')}
                    </Typography>
                    {accountSummary.peorAccion ? (
                      <>
                        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                          {accountSummary.peorAccion.company_name}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            {t('dashboard.purchasePrice', { value: formatCurrency(accountSummary.peorAccion.avg_purchase_price) })}
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ textAlign: 'center' }}>
                            {t('dashboard.currentPrice', { value: formatCurrency(accountSummary.peorAccion.current_price) })}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'center' }}>
                            <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                            <Typography variant="body1" color="error.main">
                              {t('dashboard.loss', { value: formatCurrency((accountSummary.peorAccion.current_price - accountSummary.peorAccion.avg_purchase_price) * accountSummary.peorAccion.shares_owned) })}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" sx={{ textAlign: 'center' }}>{t('dashboard.noStocks')}</Typography>
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
              {t('dashboard.portfolioComposition')}
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
                  {t('dashboard.totalShares', { count: portfolio.reduce((total, stock) => total + stock.shares_owned, 0) })}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {t('dashboard.differentCompanies', { count: portfolio.length })}
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
                {t('dashboard.viewFullPortfolio')}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Dashboard;