import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  CircularProgress, 
  Alert, 
  Divider,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from 'react-i18next';

const TablaClasificacion = ({ classroom }) => {
  const { t } = useTranslation();
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(false); 
  const [error, setError] = useState('');

  // Cargar datos cuando se muestra el componente o cambia la clase
  useEffect(() => {
    if (classroom) {
      cargarClasificacion();
    }
  }, [classroom]);

  const cargarClasificacion = async () => {
    setCargando(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const clienteHTTP = axios.create({
        baseURL: 'http://localhost:8000',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      });

      const respuesta = await clienteHTTP.get(`/classrooms/${classroom.id}/leaderboard`);
      
      setRanking(respuesta.data);
      
      setCargando(false);
    } catch (error) {
      setCargando(false);
      
      console.error('¡Ups! No pudimos cargar la clasificación:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.detail || t('leaderboard.loadError'));
      } else {
        setError(t('leaderboard.serverError'));
      }
    }
  };

  const ocultarEmail = (email) => {
    if (!email) return '';
    
    const partes = email.split('@');
    if (partes.length !== 2) return email;
    
    const usuario = partes[0];
    const dominio = partes[1];
    
    const partesDominio = dominio.split('.');
    const dominioOculto = `${partesDominio[0].charAt(0)}***`;
    
    return `${usuario}@${dominioOculto}`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <LeaderboardIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        {t('leaderboard.title', { name: classroom.name })}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {cargando ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          {/* Si no hay datos, mostrar mensaje */}
          {ranking.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {t('leaderboard.noData')}
            </Typography>
          ) : (
            <Paper elevation={0} variant="outlined">
              <Table>
                {/* Cabecera de la tabla */}
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.light' }}>
                    {/* Columna de posición */}
                    <TableCell width="80px">
                      <Typography variant="subtitle2" fontWeight="bold">{t('leaderboard.colPosition')}</Typography>
                    </TableCell>
                    
                    {/* Columna de estudiante */}
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">{t('leaderboard.colStudent')}</Typography>
                    </TableCell>
                    
                    {/* Columna de valor actual */}
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <Typography variant="subtitle2" fontWeight="bold">{t('leaderboard.colCurrentValue')}</Typography>
                        <Tooltip 
                          title={t('leaderboard.valueTooltip')} 
                          placement="top"
                          arrow
                        >
                          <IconButton size="small" sx={{ ml: 0.5 }}>
                            <InfoIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <Typography variant="subtitle2" fontWeight="bold">{t('leaderboard.colPerformance')}</Typography>
                        <Tooltip 
                          title={t('leaderboard.performanceTooltip')} 
                          placement="top"
                          arrow
                        >
                          <IconButton size="small" sx={{ ml: 0.5 }}>
                            <InfoIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                
                <TableBody>
                  {ranking.map((estudiante, indice) => (
                    <TableRow 
                      key={estudiante.user_id}
                      sx={{
                        bgcolor: indice === 0 ? 'rgba(255, 215, 0, 0.1)' : // Oro para el primero
                               indice === 1 ? 'rgba(192, 192, 192, 0.1)' : // Plata para el segundo
                               indice === 2 ? 'rgba(205, 127, 50, 0.1)' : // Bronce para el tercero
                               'inherit', // Normal para el resto
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" justifyContent="center">
                          {indice < 3 ? (
                            <EmojiEventsIcon 
                              color={indice === 0 ? 'warning' : indice === 1 ? 'action' : 'error'} 
                              fontSize="small"
                            />
                          ) : (
                            <Typography variant="body1" fontWeight="medium">
                              {indice + 1}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccountCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography>{ocultarEmail(estudiante.email)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip 
                          title={t('leaderboard.valueCellTooltip')}
                          placement="left"
                          arrow
                        >
                          <Box display="inline-flex" alignItems="center">
                            <MonetizationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                            <Typography fontWeight="medium">
                              {estudiante.current_value.toFixed(2)}€
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Tooltip 
                          title={t('leaderboard.performanceCellTooltip')}
                          placement="left"
                          arrow
                        >
                          <Chip
                            icon={estudiante.profit_percentage > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${estudiante.profit_percentage > 0 ? '+' : ''}${estudiante.profit_percentage.toFixed(2)}%`}
                            color={estudiante.profit_percentage > 0 ? 'success' : 'error'}
                            variant="outlined"
                            size="small"
                          />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TablaClasificacion; 