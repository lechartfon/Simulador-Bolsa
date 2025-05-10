import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import axios from 'axios';

window.chartData = window.chartData || {};

/**
 * Componente para mostrar gráfica de precios de acciones
 * @param {Object} props - Propiedades del componente
 * @param {string} props.company - Nombre de la empresa
 * @param {Object} props.refExterno - Referencia externa para acceder al gráfico desde otros componentes
 */
const StockChart = ({ company, refExterno }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    if (refExterno) {
      refExterno.current = chartRef.current;
    }

    if (!company) return;

    const fetchStockData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/stocks/${encodeURIComponent(company)}`);
        const data = response.data;
        
        if (data && data.length > 0) {
          window.chartData[company] = data;
          
          const lastPoint = data[data.length - 1];
          if (lastPoint && lastPoint.length >= 2) {
            setLastPrice(lastPoint[1]);
            window.chartData[`${company}_lastPrice`] = lastPoint[1];
          }
        }
        
        if (chartRef.current) {
          chartRef.current.series[0].setData(data);
          chartRef.current.setTitle({ text: `Histórico: ${company}` });
          chartRef.current.lastPrice = lastPoint ? lastPoint[1] : null;
        } else {
          chartRef.current = Highcharts.stockChart(
            chartContainerRef.current,
            {
              rangeSelector: { selected: 1 },
              title: { text: `Histórico: ${company}` },
              series: [{
                name: company,
                data,
                tooltip: { valueDecimals: 2 }
              }]
            }
          );
          
          if (chartRef.current) {
            chartRef.current.lastPrice = lastPoint ? lastPoint[1] : null;
          }
        }
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [company, refExterno]);

  return (
    <div>
      {isLoading && <div style={{ textAlign: 'center', marginBottom: '10px' }}>Cargando datos...</div>}
      <div ref={chartContainerRef} style={{ height: '500px', minWidth: '600px' }} />
      {lastPrice && (
        <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold' }}>
          Último precio: {lastPrice.toFixed(2)}€
        </div>
      )}
    </div>
  );
};

export default StockChart;
