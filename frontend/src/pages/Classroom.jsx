import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import '../App.css';
import ClassroomList from '../components/Classroom/ClassroomList';
import CreateClassroom from '../components/Classroom/CreateClassroom';
import JoinClassroom from '../components/Classroom/JoinClassroom';
import TablaClasificacion from '../components/Classroom/ClassroomLeaderboard';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Alert,
  Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const Classroom = () => {
  const { t } = useTranslation();
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
      const response = await api.get('/classrooms/my');
      setClassrooms(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setMensaje(t('classroom.loadError'));
      setOpenSnackbar(true);
    }
  };

  const handleSelectClassroom = (classroom) => {
    setSelectedClassroom(classroom);
  };

  const handleClassroomCreated = () => {
    fetchMyClassrooms();
    setMensaje(t('classroom.createdSuccess'));
    setOpenSnackbar(true);
  };

  const handleClassroomJoined = () => {
    fetchMyClassrooms();
    setMensaje(t('classroom.joinedSuccess'));
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
          {t('classroom.title')}
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
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%',  width: '100%' }}>
              <CreateClassroom onClassroomCreated={handleClassroomCreated} />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              <JoinClassroom onClassroomJoined={handleClassroomJoined} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ClassroomList 
                classrooms={classrooms} 
                onSelectClassroom={handleSelectClassroom}
                selectedClassroom={selectedClassroom}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={7}>            
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {selectedClassroom ? (
                <TablaClasificacion classroom={selectedClassroom} />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '300px'
                }}>
                  <Typography variant="h6" color="text.secondary">
                    {t('classroom.selectClass')}
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