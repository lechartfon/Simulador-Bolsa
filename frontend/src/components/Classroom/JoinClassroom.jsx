import { useState } from 'react';
import { api } from '../../lib/api';
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
import { useTranslation } from 'react-i18next';

const JoinClassroom = ({ onClassroomJoined }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError(t('joinClassroom.codeRequired'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/classrooms/join', { code });
      setCode('');
      setIsLoading(false);
      onClassroomJoined();
    } catch (error) {
      setIsLoading(false);
      if (error.response && error.response.data) {
        setError(error.response.data.detail || t('joinClassroom.joinError'));
      } else {
        setError(t('joinClassroom.serverError'));
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <JoinFullIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        {t('joinClassroom.title')}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="classCode"
          label={t('joinClassroom.codeLabel')}
          name="classCode"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t('joinClassroom.codePlaceholder')}
          disabled={isLoading}
          helperText={t('joinClassroom.codeHelper')}
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
          {isLoading ? t('joinClassroom.joining') : t('joinClassroom.join')}
        </Button>
      </Box>
    </Box>
  );
};

export default JoinClassroom; 