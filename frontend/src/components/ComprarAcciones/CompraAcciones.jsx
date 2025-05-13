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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

/**
 * Componente para comprar acciones de una empresa
 * @param {Object} props
 * @param {Object} props.empresa - Datos de la empresa seleccionada
 * @param {Object} props.chartRef - Referencia al gráfico de la empresa
 * @param {number} props.dineroDisponible - Saldo disponible del usuario
 * @param {Function} props.onCompraExitosa - Función a ejecutar tras una compra exitosa
 */
const CompraAcciones = ({ empresa, chartRef, dineroDisponible, onCompraExitosa }) => {
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
        const storedPrice = window.chartData && window.chartData[`${empresa.name}_lastPrice`];
        if (typeof storedPrice === 'number') {
          console.log("Precio obtenido del almacén global:", storedPrice);
          setPrecioActual(storedPrice);
          return true;
        }
      }
      
      if (chartRef && chartRef.current) {
        try {
          if (chartRef.current.lastPrice) {
            console.log("Precio obtenido de chartRef.lastPrice:", chartRef.current.lastPrice);
            setPrecioActual(chartRef.current.lastPrice);
            return true;
          }
          
          if (chartRef.current.series && chartRef.current.series[0]) {
            const series = chartRef.current.series[0];
            
            if (series.points && series.points.length > 0) {
              const lastPoint = series.points[series.points.length - 1];
              if (lastPoint && typeof lastPoint.y === 'number') {
                console.log("Precio obtenido de series.points:", lastPoint.y);
                setPrecioActual(lastPoint.y);
                return true;
              }
            }
            
            if (series.data && series.data.length > 0) {
              const lastPoint = series.data[series.data.length - 1];
              if (lastPoint && typeof lastPoint.y === 'number') {
                console.log("Precio obtenido de series.data:", lastPoint.y);
                setPrecioActual(lastPoint.y);
                return true;
              }
            }
          }
        } catch (error) {
          console.error("Error al acceder al gráfico:", error);
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
      setMensaje('Error: No hay empresa seleccionada.');
      setMensajeType('error');
      return;
    }
    
    if (!empresaId) {
      setMensaje('Error: No se pudo obtener el ID de la empresa. Intente seleccionando la empresa nuevamente.');
      setMensajeType('error');
      return;
    }
    
    if (!precioActual) {
      setMensaje('No se pudo obtener el precio actual. Intente refrescar la página.');
      setMensajeType('error');
      return;
    }

    const total = Math.round(precioActual * cantidad * 100) / 100;

    if (total > dineroDisponible) {
      setMensaje('No tienes suficiente dinero para esta compra.');
      setMensajeType('warning');
      return;
    }

    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleCompra = async () => {
    handleCloseConfirmDialog();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMensaje('Error: No hay sesión iniciada. Por favor, inicia sesión nuevamente.');
        setMensajeType('error');
        setIsLoading(false);
        return;
      }

      const authAxios = axios.create({
        baseURL: 'http://localhost:8000',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const precioFormateado = Number(precioActual).toFixed(2);

      const data = {
        company_id: empresaId,
        quantity: cantidad,
        price_per_share: parseFloat(precioFormateado)
      };

      const response = await authAxios.post('/comprar', data);

      if (response.status === 200) {
        const total = Math.round(precioActual * cantidad * 100) / 100;
        
        // Update the header wallet balance
        if (window.updateHeaderWallet) {
          window.updateHeaderWallet();
        }
        
        onCompraExitosa(cantidad, total);
        setMensaje(`Compra realizada: ${cantidad} x ${empresa.name} a ${precioFormateado}€`);
        setMensajeType('success');
      } else {
        setMensaje(`Error: ${response.statusText}`);
        setMensajeType('error');
      }
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error en la compra:", error);
      
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          setMensaje('Error: Sesión expirada o inválida. Por favor, inicia sesión nuevamente.');
          setMensajeType('error');
        } else if (error.response.status === 404) {
          setMensaje('Error: El endpoint de compra no está disponible. Contacte al administrador.');
          setMensajeType('error');
        } else {
          setMensaje(`Error: ${error.response.data.detail || error.response.statusText}`);
          setMensajeType('error');
        }
      } else {
        setMensaje('Error al guardar la compra en la base de datos.');
        setMensajeType('error');
      }
    }
  };

  const calculaTotal = () => {
    if (!precioActual) return 0;
    return (precioActual * cantidad).toFixed(2);
  };

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Comprar acciones
          </Typography>
          {empresa && (
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {empresa.name} {empresa.symbol && `(${empresa.symbol})`}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body1">
              Dinero disponible:
            </Typography>
            <Chip 
              icon={<AttachMoneyIcon />} 
              label={`${dineroDisponible.toFixed(2)}€`} 
              color="primary"
              variant="outlined"
            />
          </Box>
          
          {precioActual && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">
                Precio actual:
              </Typography>
              <Chip 
                label={`${precioActual.toFixed(2)}€`} 
                color="secondary"
                variant="outlined"
              />
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Cantidad"
              type="number"
              fullWidth
              variant="outlined"
              value={cantidad}
              InputProps={{
                inputProps: { min: 1 },
                endAdornment: <InputAdornment position="end">acciones</InputAdornment>,
              }}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
            />
          </Box>
          
          {precioActual && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                Total a pagar:
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
            {isLoading ? "Procesando..." : "Comprar"}
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
              Cargando datos de la empresa...
            </Alert>
          </Box>
        )}
        
        {!precioActual && empresa && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="warning">
              Esperando a que se cargue el precio actual...
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
          {"Confirmar compra de acciones"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Estás a punto de comprar {cantidad} acciones de {empresa?.name} por un total de {calculaTotal()}€. 
            ¿Estás seguro de que deseas realizar esta operación?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="error">
            Cancelar
          </Button>
          <Button onClick={handleCompra} color="primary" variant="contained" autoFocus>
            Confirmar compra
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompraAcciones;
