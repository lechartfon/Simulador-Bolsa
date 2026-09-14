import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
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
import { useTranslation } from 'react-i18next';

const FormularioNoticias = ({ open, onClose, initialData, onSuccess }) => {
  const { t } = useTranslation();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [enlace, setEnlace] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const isHttpUrl = (value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitulo(initialData.title || '');
        setContenido(initialData.content || '');
        setEnlace(initialData.url || '');
        setImagenUrl(initialData.image_url || '');
      } else {
        setTitulo('');
        setContenido('');
        setEnlace('');
        setImagenUrl('');
      }
      setMensajeError('');
    }
  }, [open, initialData]);
  const enviarFormulario = async () => {
    if (!titulo.trim() || !contenido.trim() || !enlace.trim()) {
      setMensajeError(t('newsForm.requiredError'));
      return;
    }

    if (!isHttpUrl(enlace.trim())) {
      setMensajeError(t('newsForm.requiredError'));
      return;
    }

    if (imagenUrl.trim() && !isHttpUrl(imagenUrl.trim())) {
      setMensajeError(t('newsForm.requiredError'));
      return;
    }

    // Activamos indicador de carga
    setCargando(true);
    setMensajeError('');

    const datosFormulario = {
      title: titulo.trim(),
      content: contenido.trim(),
      url: enlace.trim(),
      image_url: imagenUrl.trim() || null
    };

    try {
      let datos;
      if (initialData) {
        const respuesta = await api.put(`/news/${initialData.id}`, datosFormulario);
        datos = respuesta.data;
      } else {
        const respuesta = await api.post('/news/', datosFormulario);
        datos = respuesta.data;
      }
      if (onSuccess) onSuccess(datos);
      onClose();
    } catch (error) {
      setMensajeError(error.response?.data?.detail || `Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={!cargando ? onClose : undefined} 
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {initialData ? t('newsForm.editTitle') : t('newsForm.createTitle')}
      </DialogTitle>
      
      <DialogContent>
        {mensajeError && (
          <div style={{ color: 'red', marginBottom: '10px', fontWeight: 'bold' }}>
            {mensajeError}
          </div>
        )}        
        <Grid container spacing={2} style={{ marginTop: '10px' }}>
          <Grid item xs={12}>
            <TextField
              label={t('newsForm.titleLabel')}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              fullWidth
              disabled={cargando}
              placeholder={t('newsForm.titlePlaceholder')}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label={t('newsForm.contentLabel')}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              fullWidth
              multiline
              rows={4}
              disabled={cargando}
              placeholder={t('newsForm.contentPlaceholder')}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label={t('newsForm.urlLabel')}
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              fullWidth
              disabled={cargando}
              placeholder="https://ejemplo.com/noticia"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label={t('newsForm.imageLabel')}
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              fullWidth
              disabled={cargando}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </Grid>
        </Grid>      </DialogContent>
      
      <DialogActions style={{ padding: '16px' }}>
        <Button 
          onClick={onClose} 
          disabled={cargando}
        >
          {t('common.cancel')}
        </Button>
        
        <Button
          onClick={enviarFormulario}
          variant="contained"
          color="primary"
          disabled={cargando}
        >
          {cargando ? (
            <>
              <CircularProgress size={20} style={{ marginRight: '8px' }} />
              {t('newsForm.saving')}
            </>
          ) : initialData ? t('newsForm.saveChanges') : t('newsForm.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormularioNoticias;