import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
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
import { useTranslation } from 'react-i18next';

const TransaccionesPage = () => {
  const { t } = useTranslation();
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
      const response = await api.get('/wallet');
      
      // Guardar el saldo si es correcto
      if (response.data && response.data.balance != null) {
        setDineroDisponible(response.data.balance);
      } else {
        setError(t('transactions.loadBalanceError'));
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Si hay error de autenticación, redirigir al login
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(t('transactions.loadBalanceError2'));
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
  const handleCompra = async (total) => {
    const amount = Number(total);
    if (Number.isFinite(amount)) {
      setDineroDisponible((prev) => {
        if (prev == null) return prev;
        return Math.round((prev - amount) * 100) / 100;
      });
    }
    
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
          {t('transactions.title')}
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
                {t('transactions.searchCompanies')}
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
                    {t('transactions.chartTitle', { company: empresaSeleccionada.name })}
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
                  {t('transactions.emptyMessage')}
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
