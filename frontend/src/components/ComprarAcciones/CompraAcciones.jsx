import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useTranslation } from 'react-i18next';

// Componente para comprar acciones
const CompraAcciones = ({ empresa, chartRef, dineroDisponible, onCompraExitosa }) => {
  const { t } = useTranslation();
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [mensajeType, setMensajeType] = useState('info');
  const [empresaId, setEmpresaId] = useState(null);
  const [precioActual, setPrecioActual] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    if (empresa && empresa.id) {
      setEmpresaId(empresa.id);
      console.log("ID de empresa establecido desde prop:", empresa.id);
    } else if (empresa && empresa.name) {
      // Si no tenemos ID pero sí el nombre, intentamos obtener el ID
      const buscarIdPorNombre = async () => {
        try {
          console.log("Buscando ID para empresa:", empresa.name);
          const response = await axios.get('http://localhost:8000/empresas');
          const empresas = response.data;
          const empresaEncontrada = empresas.find(e => e.name === empresa.name);
          if (empresaEncontrada) {
            console.log("Empresa encontrada:", empresaEncontrada);
            setEmpresaId(empresaEncontrada.id);
          } else {
            console.log("No se encontró la empresa en la lista");
          }
        } catch (error) {
          console.error("Error al buscar ID de empresa:", error);
        }
      };
      buscarIdPorNombre();
    }
  }, [empresa]);

  // Resetear precio actual cada vez que cambia la empresa
  useEffect(() => {
    setPrecioActual(null);
    
    const fetchNewPrice = async () => {
      if (empresa && empresa.name) {
        try {
          console.log("Forzando actualización del precio para:", empresa.name);
          const response = await axios.get(`http://localhost:8000/stocks/${encodeURIComponent(empresa.name)}`);
          const data = response.data;
          
          if (data && data.length > 0) {
            const lastPoint = data[data.length - 1];
            if (lastPoint && lastPoint.length >= 2) {
              const price = lastPoint[1]; 
              console.log("Precio actualizado:", price);
              setPrecioActual(price);
              
              if (!window.chartData) window.chartData = {};
              window.chartData[`${empresa.name}_lastPrice`] = price;
            }
          }
        } catch (error) {
          console.error("Error al obtener precio actualizado:", error);
        }
      }
    };
    
    fetchNewPrice();
  }, [empresa]);

  useEffect(() => {
    const obtenerPrecio = async () => {
      if (empresa && empresa.name) {
        // Intento obtener el precio de la variable global
        if (window.chartData && window.chartData[`${empresa.name}_lastPrice`]) {
          setPrecioActual(window.chartData[`${empresa.name}_lastPrice`]);
          return true;
        }
      }
      
      // Si tengo referencia al gráfico, intento sacar el precio de ahí
      if (chartRef && chartRef.current) {
        try {
          if (chartRef.current.lastPrice) {
            setPrecioActual(chartRef.current.lastPrice);
            return true;
          }
          
          if (chartRef.current.series && chartRef.current.series[0]) {
            const series = chartRef.current.series[0];
            
            if (series.points && series.points.length > 0) {
              const lastPoint = series.points[series.points.length - 1];
              if (lastPoint && lastPoint.y) {
                setPrecioActual(lastPoint.y);
                return true;
              }
            }
            
            if (series.data && series.data.length > 0) {
              const lastPoint = series.data[series.data.length - 1];
              if (lastPoint && lastPoint.y) {
                setPrecioActual(lastPoint.y);
                return true;
              }
            }
          }
        } catch (error) {
          console.error("Error con el gráfico:", error);
        }
      }
      
      if (empresa && empresa.name) {
        try {
          console.log("Obteniendo precio desde la API para:", empresa.name);
          const response = await axios.get(`http://localhost:8000/stocks/${encodeURIComponent(empresa.name)}`);
          const data = response.data;
          
          if (data && data.length > 0) {
            const lastPoint = data[data.length - 1];
            if (lastPoint && lastPoint.length >= 2) {
              const price = lastPoint[1]; 
              console.log("Precio obtenido de la API:", price);
              setPrecioActual(price);
              
              if (!window.chartData) window.chartData = {};
              window.chartData[`${empresa.name}_lastPrice`] = price;
              
              return true;
            }
          }
        } catch (error) {
          console.error("Error al obtener precio desde API:", error);
        }
      }
      
      return false;
    };
    
    obtenerPrecio();
    
    const timer = setTimeout(() => {
      obtenerPrecio();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [chartRef, empresa]);

  const handleOpenConfirmDialog = () => {
    if (!empresa) {
      setMensaje(t('comprar.noCompanyError'));
      setMensajeType('error');
      return;
    }
    
    if (!empresaId) {
      setMensaje(t('comprar.noIdError'));
      setMensajeType('error');
      return;
    }
    
    if (!precioActual) {
      setMensaje(t('comprar.noPriceError'));
      setMensajeType('error');
      return;
    }

    const total = Math.round(precioActual * cantidad * 100) / 100;

    if (total > dineroDisponible) {
      setMensaje(t('comprar.notEnoughMoney'));
      setMensajeType('warning');
      return;
    }

    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  // Función para comprar acciones
  const handleCompra = async () => {
    handleCloseConfirmDialog();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMensaje(t('comprar.noSessionError'));
        setMensajeType('error');
        setIsLoading(false);
        return;
      }

      // Creo el objeto para enviar la compra
      const data = {
        company_id: empresaId,
        quantity: cantidad,
        price_per_share: parseFloat(precioActual.toFixed(2))
      };

      // Hago la petición
      const response = await axios.post('http://localhost:8000/comprar', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        const total = precioActual * cantidad;
        
        if (window.updateHeaderWallet) {
          window.updateHeaderWallet();
        }
        
        onCompraExitosa(cantidad, total);
        
        setMensaje(t('comprar.purchaseDone', { quantity: cantidad, company: empresa.name }));
        setMensajeType('success');
      } else {
        setMensaje(`Error: ${response.statusText}`);
        setMensajeType('error');
      }
    } catch (error) {
      console.error("Error en la compra:", error);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        setMensaje(t('comprar.sessionExpired'));
      } else {
        setMensaje(t('comprar.purchaseError'));
      }
      setMensajeType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const calculaTotal = () => {
    if (!precioActual) return 0;
    return (precioActual * cantidad).toFixed(2);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t('comprar.title')}
          </Typography>
          {empresa && (
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {empresa.name} {empresa.symbol && `(${empresa.symbol})`}
            </Typography>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              {t('comprar.availableMoney', { amount: dineroDisponible ? `${dineroDisponible.toFixed(2)}€` : t('common.loading') })}
            </Typography>
          </Box>
          
          {precioActual && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                {t('comprar.currentPrice', { amount: `${precioActual.toFixed(2)}€` })}
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <TextField
              label={t('comprar.quantity')}
              type="number"
              fullWidth
              variant="outlined"
              value={cantidad}
              InputProps={{
                inputProps: { min: 1 },
                endAdornment: <InputAdornment position="end">{t('comprar.shares')}</InputAdornment>,
              }}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
            />
          </Box>
          
          {precioActual && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                {t('comprar.totalToPay')}
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="secondary">
                {calculaTotal()}€
              </Typography>
            </Box>
          )}
        </CardContent>
        
        <CardActions>
          <Button 
            variant="contained" 
            fullWidth
            color="primary"
            startIcon={<ShoppingCartIcon />}
            onClick={handleOpenConfirmDialog}
            disabled={isLoading || !empresaId || !precioActual}
          >
            {isLoading ? t('comprar.processing') : t('comprar.buy')}
          </Button>
        </CardActions>
        
        {mensaje && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity={mensajeType}>
              {mensaje}
            </Alert>
          </Box>
        )}
        
        {!empresaId && empresa && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="warning">
              {t('comprar.loadingCompany')}
            </Alert>
          </Box>
        )}
        
        {!precioActual && empresa && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="warning">
              {t('comprar.loadingPrice')}
            </Alert>
          </Box>
        )}
      </Card>
      
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('comprar.confirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('comprar.confirmText', { quantity: cantidad, company: empresa?.name, total: calculaTotal() })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="error">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCompra} color="primary" variant="contained" autoFocus>
            {t('comprar.confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompraAcciones;
