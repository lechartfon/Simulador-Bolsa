import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockChart from "../Charts/StockChart"; 

const CompraAcciones = ({ empresa, chartRef, dineroDisponible, onCompraExitosa }) => {
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [empresaId, setEmpresaId] = useState(null);

  // Al montar el componente o cambiar la empresa, buscar su ID
  useEffect(() => {
    if (empresa && empresa.id) {
      setEmpresaId(empresa.id);
    } else if (empresa && empresa.name) {
      // Si no tenemos ID pero sí el nombre, intentamos obtener el ID
      const buscarIdPorNombre = async () => {
        try {
          const response = await axios.get('http://localhost:8000/empresas');
          const empresas = response.data;
          const empresaEncontrada = empresas.find(e => e.name === empresa.name);
          if (empresaEncontrada) {
            setEmpresaId(empresaEncontrada.id);
          }
        } catch (error) {
          console.error("Error al buscar ID de empresa:", error);
        }
      };
      buscarIdPorNombre();
    }
  }, [empresa]);

  const handleCompra = async () => {
    // Depuración del objeto empresa
    console.log('Objeto empresa:', empresa);
    console.log('ID de empresa:', empresaId);
    
    const chart = chartRef.current;
    if (!empresa || !chart) {
      setMensaje('Error: No hay empresa seleccionada o gráfica no cargada.');
      return;
    }

    if (!empresaId) {
      setMensaje('Error: No se pudo obtener el ID de la empresa.');
      return;
    }

    const precioActual = chart.series[0].data.at(-1)?.y;
    if (!precioActual) {
      setMensaje('No se pudo obtener el precio actual.');
      return;
    }

    const total = Math.round(precioActual * cantidad * 100) / 100;

    if (total > dineroDisponible) {
      setMensaje('No tienes suficiente dinero para esta compra.');
      return;
    }

    try {
      // Verificar login
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMensaje('Error: No hay sesión iniciada. Por favor, inicia sesión nuevamente.');
        return;
      }

      console.log('Token de autenticación:', token);

      // Crear una nueva instancia de axios con el token de autorización
      const authAxios = axios.create({
        baseURL: 'http://localhost:8000',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Convertir el precio a string con 2 decimales para asegurar compatibilidad con DECIMAL
      const precioFormateado = Number(precioActual).toFixed(2);

      // Datos para enviar en el cuerpo
      const data = {
        company_id: empresaId,
        quantity: cantidad,
        price_per_share: parseFloat(precioFormateado)
      };

      console.log('Enviando datos al backend:', data);

      // Enviar datos en el cuerpo de la petición al endpoint
      const response = await authAxios.post('/comprar', data);

      console.log('Respuesta del servidor:', response.data);

      if (response.status === 200) {
        onCompraExitosa(cantidad, total);
        setMensaje(`Compra realizada: ${cantidad} x ${empresa.name} a ${precioFormateado}€`);
      } else {
        setMensaje(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error en la compra:", error);
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
        if (error.response.status === 401) {
          // Si es un error de autenticación, borrar el token y recargar
          localStorage.removeItem('token');
          setMensaje('Error: Sesión expirada o inválida. Por favor, inicia sesión nuevamente.');
        } else if (error.response.status === 404) {
          setMensaje('Error: El endpoint de compra no está disponible. Contacte al administrador.');
        } else {
          setMensaje(`Error: ${error.response.data.detail || error.response.statusText}`);
        }
      } else {
        setMensaje('Error al guardar la compra en la base de datos.');
      }
    }
  };

  return (
    <div>
      <h3>Comprar acciones de {empresa.name}</h3>
      <p>Dinero disponible: <strong>{dineroDisponible.toFixed(2)}€</strong></p>
      {/* <p>Precio de la acción: <strong>{StockChart.}</strong></p> */}
      <div >
        <label>Cantidad:</label>
        <input
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(parseInt(e.target.value))}
        />
        <button
          onClick={handleCompra}
        >
          Comprar
        </button>
      </div>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default CompraAcciones;
