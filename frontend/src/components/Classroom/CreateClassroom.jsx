import { useState } from 'react';
import { api } from '../../lib/api';
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
import { useTranslation } from 'react-i18next';

const CreateClassroom = ({ onClassroomCreated }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError(t('createClassroom.nameRequired'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/classrooms', { name });
      setName('');
      setIsLoading(false);
      onClassroomCreated();
    } catch (error) {
      setIsLoading(false);
      if (error.response && error.response.data) {
        setError(error.response.data.detail || t('createClassroom.createError'));
      } else {
        setError(t('createClassroom.serverError'));
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        {t('createClassroom.title')}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="className"
          label={t('createClassroom.nameLabel')}
          name="className"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('createClassroom.namePlaceholder')}
          disabled={isLoading}
          helperText={t('createClassroom.nameHelper')}
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
          {isLoading ? t('createClassroom.creating') : t('createClassroom.create')}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateClassroom; 