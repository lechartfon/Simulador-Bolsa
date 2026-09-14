import React, { useState, useEffect } from 'react';
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
import { api } from '../../lib/api';

const BuscadorAcciones = ({ onSelectEmpresa }) => {
    const { t } = useTranslation();
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchEmpresas = async () => {
            setLoading(true);
            try {
                const response = await api.get('/empresas');
                setEmpresas(response.data);
            } finally {
                setLoading(false);
            }
        };

        fetchEmpresas();
    }, []);

    const handleSeleccion = (empresa) => {
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
