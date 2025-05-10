import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  Box, 
  Typography,
  ListItemButton,
  Divider,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';

const BuscadorAcciones = ({ onSelectEmpresa }) => {
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEmpresas = async () => {
            setLoading(true);
            try {
                const response = await axios.get('empresas');
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

    const handleChange = (e) => {
        const valor = e.target.value;
        setBusqueda(valor);

        if (valor.length === 0) {
            setResultados([]);
            return;
        }

        const filtrados = empresas.filter(empresa =>
            empresa.name.toLowerCase().includes(valor.toLowerCase()) ||
            empresa.symbol.toLowerCase().includes(valor.toLowerCase())
        );

        setResultados(filtrados);
    };

    const handleSeleccion = (empresa) => {
        console.log('Empresa seleccionada:', empresa);
        setBusqueda(empresa.name);
        setResultados([]);
        onSelectEmpresa(empresa);
    };

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <Autocomplete
                freeSolo
                id="buscador-empresas"
                options={empresas}
                getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name} (${option.symbol})`}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Buscar empresa..."
                        fullWidth
                        variant="outlined"
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                        }}
                    />
                )}
                renderOption={(props, option) => (
                    <ListItem {...props} key={option.id} onClick={() => handleSeleccion(option)}>
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
                noOptionsText="No se encontraron empresas"
            />
        </Box>
    );
};

export default BuscadorAcciones;
