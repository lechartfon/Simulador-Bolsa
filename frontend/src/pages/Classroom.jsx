import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import ClassroomList from '../components/Classroom/ClassroomList';
import CreateClassroom from '../components/Classroom/CreateClassroom';
import JoinClassroom from '../components/Classroom/JoinClassroom';
import ClassroomLeaderboard from '../components/Classroom/ClassroomLeaderboard';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  AppBar, 
  Toolbar, 
  Button, 
  Alert,
  Snackbar
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';

const Classroom = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  // Verificar si hay sesión activa
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchMyClassrooms();
    }
  }, [navigate]);

  const fetchMyClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const authAxios = axios.create({
        baseURL: 'http://localhost:8000',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await authAxios.get('/classrooms/my');
      setClassrooms(response.data);
    } catch (error) {
      console.error('Error al obtener clases:', error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setMensaje('Error al cargar tus clases. Por favor, intenta nuevamente.');
      setOpenSnackbar(true);
    }
  };

  // Seleccionar una clase para ver su tabla de clasificación
  const handleSelectClassroom = (classroom) => {
    setSelectedClassroom(classroom);
  };

  // Manejar la creación exitosa de una clase
  const handleClassroomCreated = () => {
    fetchMyClassrooms();
    setMensaje('Clase creada con éxito!');
    setOpenSnackbar(true);
  };

  // Manejar la unión exitosa a una clase
  const handleClassroomJoined = () => {
    fetchMyClassrooms();
    setMensaje('Te has unido a la clase con éxito!');
    setOpenSnackbar(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Simulador de Bolsa - Competición
          </Typography>
          <Button 
            color="inherit" 
            component={Link} 
            to="/transacciones"
            startIcon={<ArrowBackIcon />}
          >
            Volver a Transacciones
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/dashboard"
            startIcon={<DashboardIcon />}
          >
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<ExitToAppIcon />}
          >
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
          Competición de Trading
        </Typography>

        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {mensaje}
          </Alert>
        </Snackbar>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CreateClassroom onClassroomCreated={handleClassroomCreated} />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <JoinClassroom onClassroomJoined={handleClassroomJoined} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ClassroomList 
                classrooms={classrooms} 
                onSelectClassroom={handleSelectClassroom}
                selectedClassroom={selectedClassroom}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {selectedClassroom ? (
                <ClassroomLeaderboard classroom={selectedClassroom} />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '300px'
                }}>
                  <Typography variant="h6" color="text.secondary">
                    Selecciona una clase para ver su tabla de clasificación
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Classroom; 