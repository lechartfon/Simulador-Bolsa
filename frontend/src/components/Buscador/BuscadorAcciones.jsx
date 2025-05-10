import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BuscadorAcciones = ({ onSelectEmpresa }) => {
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [empresas, setEmpresas] = useState([]);

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const response = await axios.get('http://localhost:8000/empresas');
                console.log('Empresas recibidas del backend:', response.data);
                setEmpresas(response.data);
            } catch (error) {
                console.error('Error al obtener las empresas:', error);
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
        <div style={{ position: 'relative', maxWidth: '400px' }}>
            <input
                type="text"
                value={busqueda}
                onChange={handleChange}
                placeholder="Buscar empresa..."
                style={{ width: '100%', padding: '8px' }}
            />
            {resultados.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    width: '100%',
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000
                }}>
                    {resultados.map((empresa, i) => (
                        <li
                            key={i}
                            onClick={() => handleSeleccion(empresa)}
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            {empresa.name} ({empresa.symbol})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BuscadorAcciones;
