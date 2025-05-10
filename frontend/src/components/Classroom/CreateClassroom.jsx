import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';

const CreateClassroom = ({ onClassroomCreated }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre de la clase es obligatorio');
      return;
    }

    setIsLoading(true);
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

      await authAxios.post('/classrooms', { name });
      setName('');
      setIsLoading(false);
      onClassroomCreated();
    } catch (error) {
      setIsLoading(false);
      console.error('Error al crear clase:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.detail || 'Error al crear la clase');
      } else {
        setError('Error al conectar con el servidor');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Crear Nueva Clase
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="className"
          label="Nombre de la Clase"
          name="className"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Economía 101"
          disabled={isLoading}
          helperText="Introduce un nombre descriptivo para tu clase"
          sx={{ mb: 3 }}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {isLoading ? 'Creando...' : 'Crear Clase'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateClassroom; 