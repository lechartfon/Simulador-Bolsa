import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment
} from '@mui/material';
import JoinFullIcon from '@mui/icons-material/JoinFull';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const JoinClassroom = ({ onClassroomJoined }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('El código de la clase es obligatorio');
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

      await authAxios.post('/classrooms/join', { code });
      setCode('');
      setIsLoading(false);
      onClassroomJoined();
    } catch (error) {
      setIsLoading(false);
      console.error('Error al unirse a la clase:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.detail || 'Error al unirse a la clase');
      } else {
        setError('Error al conectar con el servidor');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <JoinFullIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Unirse a una Clase
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="classCode"
          label="Código de la Clase"
          name="classCode"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej: ABC123"
          disabled={isLoading}
          helperText="Introduce el código que te ha proporcionado tu profesor"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VpnKeyIcon />
              </InputAdornment>
            ),
          }}
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
          color="secondary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <JoinFullIcon />}
        >
          {isLoading ? 'Uniéndose...' : 'Unirse a Clase'}
        </Button>
      </Box>
    </Box>
  );
};

export default JoinClassroom; 