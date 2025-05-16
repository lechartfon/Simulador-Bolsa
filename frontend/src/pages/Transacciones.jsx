import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StockChart from './../components/Charts/StockChart';
import CompraAcciones from './../components/ComprarAcciones/CompraAcciones';
import BuscadorAcciones from './../components/Buscador/BuscadorAcciones';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Alert,
  CircularProgress
} from '@mui/material';

const TransaccionesPage = () => {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [dineroDisponible, setDineroDisponible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const navigate = useNavigate();
  const cargarSaldo = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Hacer petición al servidor
      const response = await axios.get('http://localhost:8000/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Guardar el saldo si es correcto
      if (response.data && response.data.balance) {
        setDineroDisponible(response.data.balance);
      } else {
        setError('No se pudo cargar el saldo');
      }
    } catch (error) {
      console.error("Error al cargar el saldo:", error);
      
      if (error.response && error.response.status === 401) {
        // Si hay error de autenticación, redirigir al login
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar el saldo');
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    cargarSaldo();
  }, [navigate]);

  const handleEmpresaSeleccionada = (empresa) => {
    setEmpresaSeleccionada(empresa);
  };
  const handleCompra = async (precioTotal) => {
    const nuevoSaldo = dineroDisponible - precioTotal;
    setDineroDisponible(Math.round(nuevoSaldo * 100) / 100);
    
    // Actualizar el saldo en el header
    if (window.updateHeaderWallet) {
      window.updateHeaderWallet();
    }
    
    await cargarSaldo();
  };


  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transacciones
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Paper 
              elevation={3} 
              sx={{ p: 2, mb: 3 }}
            >
              <Typography variant="h6" gutterBottom>
                Buscar Empresas
              </Typography>
              <BuscadorAcciones onSelectEmpresa={handleEmpresaSeleccionada} />
            </Paper>

            {empresaSeleccionada && (
              <>
                <Paper 
                  elevation={3} 
                  sx={{ p: 2, mb: 3 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Gráfica: {empresaSeleccionada.name}
                  </Typography>
                  <StockChart company={empresaSeleccionada.name} refExterno={chartRef} />
                </Paper>

                <Paper 
                  elevation={3} 
                  sx={{ p: 2, mb: 3 }}
                >
                  <CompraAcciones
                    empresa={empresaSeleccionada}
                    chartRef={chartRef}
                    dineroDisponible={dineroDisponible}
                    onCompraExitosa={handleCompra}
                  />
                </Paper>
              </>
            )}

            {!empresaSeleccionada && (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  mb: 3, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '300px',
                  bgcolor: 'background.default'
                }}
              >
                <Typography variant="h5" color="text.secondary" align="center">
                  Selecciona una empresa para ver su gráfica y realizar transacciones
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default TransaccionesPage;
