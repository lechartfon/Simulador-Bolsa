import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts/highstock';
import { simulateGBM } from '../../utils/simulateGBM';

const StockChart = ({ company, refExterno }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (refExterno) {
      refExterno.current = chartRef.current;
    }

    if (!company) return;

    // Parámetros aleatorios por empresa
    const S0 = 20 + Math.random() * 180;            // precio inicial entre 20 y 200
    const mu = 0.0005 + (Math.random() - 0.5) * 0.0002;
    const sigma = 0.01 + Math.random() * 0.02;

    // Simular 180 días
    const raw = simulateGBM({ S0, mu, sigma, days: 180 });
    const data = raw.map((p, i) => [
      Date.now() - (180 - i) * 24 * 3600 * 1000,
      p
    ]);

    if (chartRef.current) {
      chartRef.current.series[0].setData(data);
      chartRef.current.setTitle({ text: `Simulación GBM: ${company}` });
    } else {
      chartRef.current = Highcharts.stockChart(
        chartContainerRef.current,
        {
          rangeSelector: { selected: 1 },
          title: { text: `Simulación GBM: ${company}` },
          series: [{
            name: company,
            data,
            tooltip: { valueDecimals: 2 }
          }]
        }
      );
    }
  }, [company, refExterno]);

  return (
    <div ref={chartContainerRef} style={{ height: '500px', minWidth: '600px' }} />
  );
};

export default StockChart;
