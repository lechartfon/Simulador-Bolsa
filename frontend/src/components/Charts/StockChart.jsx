import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

// Este componente muestra un gráfico con los precios de las acciones
const StockChart = ({ company, refExterno }) => {
  const { t, i18n } = useTranslation();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    if (refExterno) {
      refExterno.current = chartRef.current;
    }

    if (!company) return;
    let cancelled = false;

    const fetchStockData = async () => {
      setIsLoading(true);
      let lastPoint = null;
      try {
        const response = await api.get(`/stocks/${encodeURIComponent(company)}`);
        const data = response.data || [];

        if (data.length > 0) {
          lastPoint = data[data.length - 1];
          if (lastPoint && lastPoint.length >= 2 && !cancelled) {
            setLastPrice(lastPoint[1]);
          }
        }

        if (cancelled) return;
        if (chartRef.current) {
          chartRef.current.series[0].setData(data);
          chartRef.current.setTitle({ text: t('charts.historyTitle', { company }) });
        } else if (chartContainerRef.current) {
          chartRef.current = Highcharts.stockChart(chartContainerRef.current, {
            rangeSelector: { selected: 1 },
            title: { text: t('charts.historyTitle', { company }) },
            series: [{ name: company, data, tooltip: { valueDecimals: 2 } }],
          });
        }

        if (chartRef.current && lastPoint) {
          chartRef.current.lastPrice = lastPoint[1];
        }
        if (refExterno) {
          refExterno.current = chartRef.current;
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchStockData();
    return () => {
      cancelled = true;
    };
  }, [company, refExterno, i18n.language, t]);

  useEffect(() => () => {
    if (chartRef.current) {
      try {
        chartRef.current.destroy();
      } catch {
        // ignorar errores de limpieza
      }
      chartRef.current = null;
    }
  }, []);

  return (
    <div>
      {isLoading && <div style={{ textAlign: 'center', marginBottom: '10px' }}>{t('charts.loading')}</div>}
      <div ref={chartContainerRef} style={{ height: '500px', width: '100%' }} />
      {lastPrice !== null && lastPrice !== undefined && (
        <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold' }}>
          {t('charts.lastPrice', { amount: `${Number(lastPrice).toFixed(2)}€` })}
        </div>
      )}
    </div>
  );
};

export default StockChart;
