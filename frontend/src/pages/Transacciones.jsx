import React, { useState } from 'react';
import BuscadorAcciones from '../components/Buscador/BuscadorAcciones';
import StockChart from '../components/Charts/StockChart';

const Transacciones = () => {
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

    return (
        <div>
            <h1>Transacciones</h1>
            <BuscadorAcciones onSelectEmpresa={setEmpresaSeleccionada} />

            {empresaSeleccionada && (
                <div>
                    <h2>{empresaSeleccionada.nombre} ({empresaSeleccionada.ticker})</h2>
                    <StockChart empresa={empresaSeleccionada} />
                </div>
            )}
        </div>
    );
};

export default Transacciones;
