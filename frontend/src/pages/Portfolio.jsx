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

// Componente TabPanel para las pestañas
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PortfolioPage = () => {
  const [tabValue, setTabValue] = useState(0);
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

  const cargarSaldo = async () => {
    try {
      const authAxios = getAuthAxios();
      if (!authAxios) return;
      
      const response = await authAxios.get('/wallet');
      if (response.data && typeof response.data.balance === 'number') {
        setDineroDisponible(response.data.balance);
      } else {
        console.error("Formato de respuesta inesperado:", response.data);
        setError('No se pudo cargar el saldo correctamente');
      }
    } catch (error) {
      console.error("Error al cargar el saldo:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar el saldo. Por favor, recarga la página.');
      }
    }
  };

  const cargarPortfolio = async () => {
    try {
      const authAxios = getAuthAxios();
      if (!authAxios) return;
      
      const response = await authAxios.get('/portfolio');
      setPortfolio(response.data);
    } catch (error) {
      console.error("Error al cargar el portfolio:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar el portfolio. Por favor, recarga la página.');
      }
    }
  };

  const cargarTransacciones = async () => {
    try {
      const authAxios = getAuthAxios();
      if (!authAxios) return;
      
      const response = await authAxios.get('/transacciones');
      setTransactions(response.data);
    } catch (error) {
      console.error("Error al cargar las transacciones:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar las transacciones. Por favor, recarga la página.');
      }
    }
  };

  // Función para cargar todos los datos
  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    
    try {
      await Promise.all([
        cargarSaldo(),
        cargarPortfolio(),
        cargarTransacciones()
      ]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError('Error al cargar los datos. Por favor, recarga la página.');
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-ES', { 
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
      const authAxios = getAuthAxios();
      if (!authAxios) return;
      
      const data = {
        company_id: selectedStock.company_id,
        quantity: cantidadVenta,
        price_per_share: selectedStock.current_price
      };
      
      const response = await authAxios.post('/vender', data);
      
      if (response.status === 200) {
        setMensaje(`Venta exitosa: ${cantidadVenta} acciones de ${selectedStock.company_name}`);
        setMensajeType('success');
        
        cargarDatos();
        handleCloseVender();
      }
    } catch (error) {
      console.error("Error al vender:", error);
      setMensaje(error.response?.data?.detail || 'Error al procesar la venta');
      setMensajeType('error');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mi Portfolio
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
                  label="Mis Acciones" 
                  id="tab-0" 
                  aria-controls="tabpanel-0" 
                />
                <Tab 
                  icon={<HistoryIcon />} 
                  label="Historial de Transacciones" 
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
                    No tienes acciones en tu portfolio. Dirígete a la sección de compras para adquirir acciones.
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Empresa</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="right">Precio Compra Prom.</TableCell>
                        <TableCell align="right">Precio Actual</TableCell>
                        <TableCell align="right">Valor Total</TableCell>
                        <TableCell align="right">Ganancia/Pérdida</TableCell>
                        <TableCell align="center">Acciones</TableCell>
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
                              Vender
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
                    No has realizado ninguna transacción todavía.
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Empresa</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="right">Precio Unitario</TableCell>
                        <TableCell align="right">Precio Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatFecha(transaction.timestamp)}</TableCell>
                          <TableCell>
                            <Typography fontWeight="medium">
                              {transaction.company_name}
                            </Typography>
                            {transaction.company_symbol && (
                              <Typography variant="body2" color="text.secondary">
                                {transaction.company_symbol}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.type === 'buy' ? 'Compra' : 'Venta'} 
                              color={transaction.type === 'buy' ? 'info' : 'success'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="right">{transaction.quantity}</TableCell>
                          <TableCell align="right">{transaction.price_per_share.toFixed(2)}€</TableCell>
                          <TableCell align="right">{transaction.total_price.toFixed(2)}€</TableCell>
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
        <DialogTitle>Vender Acciones</DialogTitle>
        <DialogContent>
          {selectedStock && (
            <>
              <DialogContentText>
                Estás a punto de vender acciones de <strong>{selectedStock.company_name}</strong>
              </DialogContentText>
              <Box mt={2} mb={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Acciones disponibles
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedStock.shares_owned}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Precio actual
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedStock.current_price.toFixed(2)}€
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <TextField
                label="Cantidad a vender"
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
                  endAdornment: <InputAdornment position="end">acciones</InputAdornment>,
                }}
                margin="normal"
              />
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Total a recibir
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
            Cancelar
          </Button>
          <Button 
            onClick={handleVender} 
            color="primary" 
            variant="contained"
            disabled={!selectedStock || cantidadVenta < 1 || cantidadVenta > (selectedStock?.shares_owned || 0)}
          >
            Confirmar Venta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioPage; 