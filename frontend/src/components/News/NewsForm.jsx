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

const FormularioNoticias = ({ open, onClose, initialData, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [enlace, setEnlace] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
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
  const enviarFormulario = () => {
    if (!titulo.trim() || !contenido.trim() || !enlace.trim()) {
      setMensajeError('¡Atención! Debes completar todos los campos obligatorios');
      return;
    }

    // Activamos indicador de carga
    setCargando(true);

    const datosFormulario = {
      title: titulo.trim(),
      content: contenido.trim(),
      url: enlace.trim(),
      image_url: imagenUrl.trim() || null 
    };

    const token = localStorage.getItem('token');
    
    const opcionesPeticion = {
      method: initialData ? 'PUT' : 'POST', 
      headers: {
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`  
      },
      body: JSON.stringify(datosFormulario) 
    };   
    const urlServidor = initialData
      ? `http://localhost:8000/news/${initialData.id}` 
      : 'http://localhost:8000/news/';                 

    fetch(urlServidor, opcionesPeticion)
      .then(respuesta => {
        if (!respuesta.ok) {
          throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }
        return respuesta.json();
      })
      .then(datos => {
        if (onSuccess) onSuccess(datos);
        onClose();
      })
      .catch(error => {
        console.error('¡Error al guardar la noticia!', error);
        setMensajeError(`Error: ${error.message}`);
      })
      .finally(() => {
        setCargando(false);
      });
  };
  return (
    <Dialog
      open={open}
      onClose={!cargando ? onClose : undefined} 
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {initialData ? 'Editar Noticia' : 'Crear Nueva Noticia'}
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
              label="Título de la noticia *"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              fullWidth
              disabled={cargando}
              placeholder="Ej: Nueva tecnología blockchain revoluciona el mercado"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Contenido de la noticia *"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              fullWidth
              multiline
              rows={4}
              disabled={cargando}
              placeholder="Escribe aquí el texto completo de la noticia..."
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Enlace a la fuente original *"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              fullWidth
              disabled={cargando}
              placeholder="https://ejemplo.com/noticia"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Enlace a la imagen (opcional)"
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
          Cancelar
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
              Guardando datos...
            </>
          ) : initialData ? 'Guardar cambios' : 'Crear noticia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormularioNoticias;