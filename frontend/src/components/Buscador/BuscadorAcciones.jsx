import React, { useState } from 'react';

const empresas = [
    { nombre: 'Apple', ticker: 'AAPL' },
    { nombre: 'Microsoft', ticker: 'MSFT' },
    { nombre: 'Amazon', ticker: 'AMZN' },
    { nombre: 'Tesla', ticker: 'TSLA' },
    { nombre: 'Google', ticker: 'GOOGL' },
    { nombre: 'Meta (Facebook)', ticker: 'META' },
    { nombre: 'Netflix', ticker: 'NFLX' },
    { nombre: 'Nvidia', ticker: 'NVDA' },
];

const BuscadorAcciones = ({ onSelectEmpresa }) => {
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);

    const handleChange = (e) => {
        const valor = e.target.value;
        setBusqueda(valor);

        if (valor.length === 0) {
            setResultados([]);
            return;
        }

        const filtrados = empresas.filter(empresa =>
            empresa.nombre.toLowerCase().includes(valor.toLowerCase()) ||
            empresa.ticker.toLowerCase().includes(valor.toLowerCase())
        );

        setResultados(filtrados);
    };

    const handleSeleccion = (empresa) => {
        setBusqueda(empresa.nombre); // opcional: mostrar el nombre en el input
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
                            {empresa.nombre} ({empresa.ticker})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BuscadorAcciones;
