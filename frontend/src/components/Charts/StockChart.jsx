import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts/highstock';

const StockChart = ({ empresa }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current || !empresa) return;

        // Si ya hay un gráfico, destruirlo antes de crear uno nuevo
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = Highcharts.stockChart(chartContainerRef.current, {
            rangeSelector: {
                selected: 1
            },
            title: {
                text: `${empresa.nombre} (${empresa.ticker}) - Simulación de datos`
            },
            series: [{
                name: 'Precio',
                data: generateInitialData(),
                tooltip: {
                    valueDecimals: 2
                }
            }]
        });

        // Añadir nuevos datos cada 10 segundos
        const intervalId = setInterval(() => {
            const x = Date.now();
            const y = generateRandomPrice();
            chartRef.current.series[0].addPoint([x, y], true, false);
        }, 10000);

        return () => {
            clearInterval(intervalId);
        };
    }, [empresa]); // se reinicia si cambia la empresa

    const generateInitialData = () => {
        const data = [];
        const now = Date.now();
        const oneDay = 24 * 3600 * 1000;
        const startTime = now - (365 * oneDay);

        let time = startTime;
        let price = 100;

        while (time <= now) {
            price += (Math.random() - 0.5) * 0.2;
            data.push([time, Math.round(price * 100) / 100]);
            time += oneDay;
        }

        return data;
    };

    const generateRandomPrice = () => {
        const lastPrice = chartRef.current?.series[0]?.data.at(-1)?.y || 100;
        const priceChange = (Math.random() - 0.5) * 0.2;
        return Math.round((lastPrice + priceChange) * 100) / 100;
    };

    return (
        <div ref={chartContainerRef} style={{ height: '500px', minWidth: '600px' }} />
    );
};

export default StockChart;
