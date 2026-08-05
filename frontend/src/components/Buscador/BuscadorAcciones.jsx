import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TextField, 
  ListItem, 
  ListItemText, 
  Box, 
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import { useTranslation } from 'react-i18next';

const BuscadorAcciones = ({ onSelectEmpresa }) => {
    const { t } = useTranslation();
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchEmpresas = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8000/empresas', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Empresas recibidas del backend:', response.data);
                setEmpresas(response.data);
            } catch (error) {
                console.error('Error al obtener las empresas:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmpresas();
    }, []);

    const handleSeleccion = (empresa) => {
        console.log('Empresa seleccionada:', empresa);
        setBusqueda(empresa.name);
        setResultados([]);
        setOpen(false);
        onSelectEmpresa(empresa);
    };

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <Autocomplete
                freeSolo
                id="buscador-empresas"
                options={empresas}
                getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name} (${option.symbol})`}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={t('buscador.searchLabel')}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                        }}
                    />
                )}
                renderOption={(props, option) => (
                    <ListItem {...props} key={option.id}>
                        <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <ListItemText
                            primary={option.name}
                            secondary={option.symbol}
                        />
                    </ListItem>
                )}
                onChange={(event, newValue) => {
                    if (newValue && typeof newValue !== 'string') {
                        handleSeleccion(newValue);
                    }
                }}
                loading={loading}
                noOptionsText={t('buscador.noResults')}
            />
        </Box>
    );
};

export default BuscadorAcciones;
