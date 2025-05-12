import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  CircularProgress
} from '@mui/material';

const UltraSimpleNewsForm = ({ open, onClose, initialData, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setUrl(initialData.url || '');
        setImageUrl(initialData.image_url || '');
      } else {
        setTitle('');
        setContent('');
        setUrl('');
        setImageUrl('');
      }
      setErrorMsg('');
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    // Basic validation
    if (!title.trim() || !content.trim() || !url.trim()) {
      setErrorMsg('Por favor, completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    const formData = {
      title: title.trim(),
      content: content.trim(),
      url: url.trim(),
      image_url: imageUrl.trim() || null
    };

    // Create request options
    const token = localStorage.getItem('token');
    const requestOptions = {
      method: initialData ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    };

    // Use plain fetch API instead of axios
    const endpoint = initialData
      ? `http://localhost:8000/news/${initialData.id}`
      : 'http://localhost:8000/news/';

    fetch(endpoint, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Clean success
        if (onSuccess) onSuccess(data);
        onClose();
      })
      .catch(error => {
        console.error('Error in news operation:', error);
        setErrorMsg(`Error: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {initialData ? 'Editar Noticia' : 'Crear Noticia'}
      </DialogTitle>
      <DialogContent>
        {errorMsg && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            {errorMsg}
          </div>
        )}
        <Grid container spacing={2} style={{ marginTop: '10px' }}>
          <Grid item xs={12}>
            <TextField
              label="Título *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Contenido *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={4}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="URL de la noticia *"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="URL de la imagen (opcional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions style={{ padding: '16px' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress size={20} style={{ marginRight: '8px' }} />
              Procesando...
            </>
          ) : initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UltraSimpleNewsForm; 