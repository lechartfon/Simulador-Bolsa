import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,  
  Button, 
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  InputAdornment
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SellIcon from '@mui/icons-material/Sell';
import HistoryIcon from '@mui/icons-material/History';
import { useTranslation } from 'react-i18next';

// Panel para las pestañas
function TabPanel(props) {
  if (props.value === props.index) {
    return (
      <div id={`tabpanel-${props.index}`}>
        <Box sx={{ p: 3 }}>
          {props.children}
        </Box>
      </div>
    );
  }
  return null;
}

const PortfolioPage = () => {  const [tabValue, setTabValue] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dineroDisponible, setDineroDisponible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openVender, setOpenVender] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [cantidadVenta, setCantidadVenta] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [mensajeType, setMensajeType] = useState('info');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
   const cargarSaldo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8000/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.balance) {
        setDineroDisponible(response.data.balance);
      } else {
        setError(t('portfolio.loadBalanceError'));
      }
    } catch (error) {
      console.error("Error al cargar el saldo:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(t('portfolio.loadBalanceError2'));
      }
    }
  };

  const cargarPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8000/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setPortfolio(response.data);
    } catch (error) {
      console.error("Error al cargar el portfolio:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(t('portfolio.loadPortfolioError'));
      }
    }
  };

  const cargarTransacciones = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8000/transacciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setTransactions(response.data);
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(t('portfolio.loadTransactionsError'));
      }
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    
    try {
      await cargarSaldo();
      
      await cargarPortfolio();
      
      await cargarTransacciones();
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError(t('portfolio.loadDataError'));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    cargarDatos();
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString(i18n.language === 'en' ? 'en-GB' : 'es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVenderClick = (stock) => {
    setSelectedStock(stock);
    setCantidadVenta(1);
    setOpenVender(true);
  };

  const handleCloseVender = () => {
    setOpenVender(false);
    setSelectedStock(null);
    setCantidadVenta(1);
  };
  const handleVender = async () => {
    if (!selectedStock) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Datos para la venta
      const data = {
        company_id: selectedStock.company_id,
        quantity: cantidadVenta,
        price_per_share: selectedStock.current_price
      };
      
      // Enviar petición
      const response = await axios.post('http://localhost:8000/vender', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        setMensaje(t('portfolio.soldMessage', { quantity: cantidadVenta, company: selectedStock.company_name }));
        setMensajeType('success');
        
        // Actualizar el saldo en el header
        if (window.updateHeaderWallet) {
          window.updateHeaderWallet();
        }
        
        cargarDatos();
        handleCloseVender();
      }
    } catch (error) {
      console.error("Error al vender:", error);
      setMensaje(t('portfolio.sellError'));
      setMensajeType('error');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('portfolio.title')}
        </Typography>
        
        {mensaje && (
          <Alert 
            severity={mensajeType} 
            sx={{ mb: 3 }}
            onClose={() => setMensaje('')}
          >
            {mensaje}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth"
              >
                <Tab 
                  icon={<SellIcon />} 
                  label={t('portfolio.myStocks')} 
                  id="tab-0" 
                  aria-controls="tabpanel-0" 
                />
                <Tab 
                  icon={<HistoryIcon />} 
                  label={t('portfolio.transactionHistory')} 
                  id="tab-1" 
                  aria-controls="tabpanel-1" 
                />
              </Tabs>
            </Box>

            {/* Pestaña de Acciones Actuales */}
            <TabPanel value={tabValue} index={0}>
              {portfolio.length === 0 ? (
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 4, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '200px',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" align="center">
                    {t('portfolio.emptyPortfolio')}
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('portfolio.colCompany')}</TableCell>
                        <TableCell align="right">{t('portfolio.colQuantity')}</TableCell>
                        <TableCell align="right">{t('portfolio.colAvgPrice')}</TableCell>
                        <TableCell align="right">{t('portfolio.colCurrentPrice')}</TableCell>
                        <TableCell align="right">{t('portfolio.colTotalValue')}</TableCell>
                        <TableCell align="right">{t('portfolio.colProfitLoss')}</TableCell>
                        <TableCell align="center">{t('portfolio.colActions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {portfolio.map((stock) => (
                        <TableRow key={stock.company_id}>
                          <TableCell component="th" scope="row">
                            <Typography fontWeight="medium">
                              {stock.company_name}
                            </Typography>
                            {stock.company_symbol && (
                              <Typography variant="body2" color="text.secondary">
                                {stock.company_symbol}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{stock.shares_owned}</TableCell>
                          <TableCell align="right">{stock.avg_purchase_price.toFixed(2)}€</TableCell>
                          <TableCell align="right">{stock.current_price.toFixed(2)}€</TableCell>
                          <TableCell align="right">{stock.total_value.toFixed(2)}€</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {stock.profit_loss >= 0 ? (
                                <ArrowDropUpIcon color="success" />
                              ) : (
                                <ArrowDropDownIcon color="error" />
                              )}
                              <Typography
                                color={stock.profit_loss >= 0 ? 'success.main' : 'error.main'}
                              >
                                {stock.profit_loss.toFixed(2)}€ ({stock.profit_loss_percent.toFixed(2)}%)
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<SellIcon />}
                              size="small"
                              onClick={() => handleVenderClick(stock)}
                            >
                              {t('portfolio.sellButton')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* Pestaña de Historial de Transacciones */}            
            <TabPanel value={tabValue} index={1}>
              {transactions.length === 0 ? (
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '200px',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" align="center">
                    {t('portfolio.emptyTransactions')}
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('portfolio.colDate')}</TableCell>
                        <TableCell>{t('portfolio.colCompany')}</TableCell>
                        <TableCell>{t('portfolio.colType')}</TableCell>
                        <TableCell align="right">{t('portfolio.colQuantity')}</TableCell>
                        <TableCell align="right">{t('portfolio.colUnitPrice')}</TableCell>
                        <TableCell align="right">{t('portfolio.colTotalPrice')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatFecha(transaction.timestamp)}</TableCell>
                          <TableCell>{transaction.company_name}</TableCell>
                          <TableCell>
                            {transaction.type === 'buy' ? t('portfolio.buy') : t('portfolio.sell')}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.type === 'buy' ? t('portfolio.buy') : t('portfolio.sell')} 
                              color={transaction.type === 'buy' ? 'info' : 'success'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="right">{transaction.quantity}</TableCell>
                          <TableCell align="right">{transaction.price_per_share.toFixed(2)}€</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Box>
        )}
      </Container>

      {/* Diálogo para vender acciones */}
      <Dialog open={openVender} onClose={handleCloseVender}>
        <DialogTitle>{t('portfolio.sellDialogTitle')}</DialogTitle>
        <DialogContent>
          {selectedStock && (
            <>
              <DialogContentText>
                {t('portfolio.sellDialogText', { company: selectedStock.company_name })}
              </DialogContentText>
              <Box mt={2} mb={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('portfolio.availableShares')}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedStock.shares_owned}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('portfolio.currentPrice')}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedStock.current_price.toFixed(2)}€
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <TextField
                label={t('portfolio.quantityToSell')}
                type="number"
                fullWidth
                variant="outlined"
                value={cantidadVenta}
                onChange={(e) => setCantidadVenta(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedStock.shares_owned)))}
                InputProps={{
                  inputProps: { 
                    min: 1, 
                    max: selectedStock.shares_owned 
                  },
                  endAdornment: <InputAdornment position="end">{t('portfolio.shares')}</InputAdornment>,
                }}
                margin="normal"
              />
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  {t('portfolio.totalToReceive')}
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {(cantidadVenta * selectedStock.current_price).toFixed(2)}€
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVender} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleVender} 
            color="primary" 
            variant="contained"
            disabled={!selectedStock || cantidadVenta < 1 || cantidadVenta > (selectedStock?.shares_owned || 0)}
          >
            {t('portfolio.confirmSale')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioPage; 