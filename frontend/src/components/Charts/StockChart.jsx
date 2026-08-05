import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

window.chartData = window.chartData || {};

// Este componente muestra un gráfico con los precios de las acciones
const StockChart = ({ company, refExterno }) => {
  const { t, i18n } = useTranslation();
  const chartContainerRef = useRef(null); 
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [lastPrice, setLastPrice] = useState(null); 

  useEffect(() => {
    // Guardamos referencia si nos pasan una
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
          window.chartData = window.chartData || {};
          window.chartData[company] = data;
          
          // Obtengo último precio
          const lastPoint = data[data.length - 1];
          if (lastPoint && lastPoint.length >= 2) {
            setLastPrice(lastPoint[1]);
            window.chartData[`${company}_lastPrice`] = lastPoint[1];
          }
        }
        
        // Creo o actualizo la gráfica
        if (chartRef.current) {
          chartRef.current.series[0].setData(data);
          chartRef.current.setTitle({ text: t('charts.historyTitle', { company }) });
        } else {
          chartRef.current = Highcharts.stockChart(
            chartContainerRef.current,
            {
              rangeSelector: { selected: 1 },
              title: { text: t('charts.historyTitle', { company }) },
              series: [{
                name: company,
                data,
                tooltip: { valueDecimals: 2 }
              }]
            }
          );
        }
        
        // Guardo último precio en la referencia
        if (chartRef.current && lastPoint) {
          chartRef.current.lastPrice = lastPoint[1];
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [company, refExterno, i18n.language, t]);

  return (
    <div>
      {isLoading && <div style={{ textAlign: 'center', marginBottom: '10px' }}>{t('charts.loading')}</div>}
      <div ref={chartContainerRef} style={{ height: '500px', width: '100%' }} />
      {lastPrice && (
        <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold' }}>
          {t('charts.lastPrice', { amount: `${lastPrice.toFixed(2)}€` })}
        </div>
      )}
    </div>
  );
};

export default StockChart;
