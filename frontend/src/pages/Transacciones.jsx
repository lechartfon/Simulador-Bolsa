import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StockChart from './../components/Charts/StockChart';
import CompraAcciones from './../components/ComprarAcciones/CompraAcciones';
import BuscadorAcciones from './../components/Buscador/BuscadorAcciones';

const TransaccionesPage = () => {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [dineroDisponible, setDineroDisponible] = useState(50000); 
  const chartRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleEmpresaSeleccionada = (empresa) => {
    setEmpresaSeleccionada(empresa);
  };

  const handleCompra = (cantidad, precioTotal) => {
    const nuevoSaldo = dineroDisponible - precioTotal;
    setDineroDisponible(Math.round(nuevoSaldo * 100) / 100);
  };

  return (
    <div>
      <h1>Transacciones</h1>

      {/* Buscador */}
      <BuscadorAcciones onSelectEmpresa={handleEmpresaSeleccionada} />

      {/* Gráfica */}
      {empresaSeleccionada && (
        <div>
          <StockChart company={empresaSeleccionada.name} refExterno={chartRef} />
        </div>
      )}

      {/* Compra de acciones */}
      {empresaSeleccionada && (
        <CompraAcciones
          empresa={empresaSeleccionada}
          chartRef={chartRef}
          dineroDisponible={dineroDisponible}
          onCompraExitosa={handleCompra}
        />
      )}
    </div>
  );
};

export default TransaccionesPage;
