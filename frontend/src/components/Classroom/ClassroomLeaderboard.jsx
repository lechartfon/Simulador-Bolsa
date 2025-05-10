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

const ClassroomLeaderboard = ({ classroom }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classroom) {
      fetchLeaderboard();
    }
  }, [classroom]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const authAxios = axios.create({
        baseURL: 'http://localhost:8000',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await authAxios.get(`/classrooms/${classroom.id}/leaderboard`);
      setLeaderboard(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error al obtener tabla de clasificación:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.detail || 'Error al cargar la clasificación');
      } else {
        setError('Error al conectar con el servidor');
      }
    }
  };

  // Función para formatear el correo electrónico (ocultar parte del dominio)
  const formatEmail = (email) => {
    if (!email) return '';
    
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const username = parts[0];
    const domain = parts[1];
    
    // Mostrar solo el nombre de usuario y la primera parte del dominio
    const domainParts = domain.split('.');
    return `${username}@${domainParts[0].charAt(0)}***`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <LeaderboardIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Tabla de Clasificación: {classroom.name}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          {leaderboard.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No hay datos disponibles
            </Typography>
          ) : (
            <Paper elevation={0} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.light' }}>
                    <TableCell width="80px">
                      <Typography variant="subtitle2" fontWeight="bold">Posición</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">Estudiante</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <Typography variant="subtitle2" fontWeight="bold">Valor Actual</Typography>
                        <Tooltip 
                          title="El valor actual representa la suma del dinero en efectivo disponible más el valor de todas las acciones compradas al precio actual del mercado." 
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
                        <Typography variant="subtitle2" fontWeight="bold">Rendimiento</Typography>
                        <Tooltip 
                          title="El rendimiento muestra el porcentaje de ganancia o pérdida respecto a la inversión inicial de 50.000€. Se calcula como (Valor Actual - 50.000€) / 50.000€ × 100%." 
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
                  {leaderboard.map((member, index) => (
                    <TableRow 
                      key={member.user_id}
                      sx={{
                        bgcolor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 
                               index === 1 ? 'rgba(192, 192, 192, 0.1)' : 
                               index === 2 ? 'rgba(205, 127, 50, 0.1)' : 'inherit',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" justifyContent="center">
                          {index < 3 ? (
                            <EmojiEventsIcon 
                              color={index === 0 ? 'warning' : index === 1 ? 'action' : 'error'} 
                              fontSize="small"
                            />
                          ) : (
                            <Typography variant="body1" fontWeight="medium">
                              {index + 1}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccountCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography>{formatEmail(member.email)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip 
                          title={`Efectivo disponible + valor de acciones compradas. Inversión inicial: 50.000€`}
                          placement="left"
                          arrow
                        >
                          <Box display="inline-flex" alignItems="center">
                            <MonetizationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                            <Typography fontWeight="medium">
                              {member.current_value.toFixed(2)}€
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip 
                          title={`Ganancia o pérdida respecto a la inversión inicial de 50.000€`}
                          placement="left"
                          arrow
                        >
                          <Chip
                            icon={member.profit_percentage > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${member.profit_percentage > 0 ? '+' : ''}${member.profit_percentage.toFixed(2)}%`}
                            color={member.profit_percentage > 0 ? 'success' : 'error'}
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

export default ClassroomLeaderboard; 