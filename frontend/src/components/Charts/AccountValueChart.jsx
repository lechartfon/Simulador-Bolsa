import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';

/**
 * Componente para mostrar gráfica del valor total de la cuenta
 * @param {Object} props - Propiedades del componente
 * @param {number} props.accountValue - Valor actual de la cuenta
 * @param {number} props.cashBalance - Saldo en efectivo
 * @param {number} props.stocksValue - Valor de las acciones
 */
const AccountValueChart = ({ accountValue, cashBalance, stocksValue }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const generateMockData = () => {
      const today = new Date();
      const data = [];
      const cashData = [];
      const stocksData = [];
      
      const currentTotal = accountValue || 50000;
      const currentCash = cashBalance || 50000;
      const currentStocks = stocksValue || 0;
      
      // Check if we're dealing with a new account (only cash, no stocks)
      const isNewAccount = currentStocks === 0 && Math.abs(currentCash - 50000) < 0.01;
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const timestamp = date.getTime();
        
        if (isNewAccount) {
          // For new accounts, just use constant values (50000€)
          data.push([timestamp, 50000]);
          cashData.push([timestamp, 50000]);
          stocksData.push([timestamp, 0]);
        } else {
          // For active accounts with history, generate some mock historical data
          const randomFactor = 0.95 + (Math.random() * 0.1);
          const dayFactor = 0.95 + ((29 - i) / 29) * 0.1;
          
          const value = currentTotal * randomFactor * dayFactor;
          
          const stocksRandomFactor = 0.90 + (Math.random() * 0.2);
          const stockRatio = currentTotal > 0 ? (currentStocks / currentTotal) : 0;
          const tempStocksValue = (value * stockRatio) * stocksRandomFactor;
          const tempCashValue = value - tempStocksValue;
          
          data.push([timestamp, Math.round(value * 100) / 100]);
          cashData.push([timestamp, Math.round(tempCashValue * 100) / 100]);
          stocksData.push([timestamp, Math.round(tempStocksValue * 100) / 100]);
        }
      }
      
      if (data.length > 0) {
        const lastTimestamp = today.getTime();
        data[data.length - 1] = [lastTimestamp, currentTotal];
        cashData[cashData.length - 1] = [lastTimestamp, currentCash];
        stocksData[stocksData.length - 1] = [lastTimestamp, currentStocks];
      }
      
      return { data, cashData, stocksData };
    };

    const createChart = () => {
      const { data, cashData, stocksData } = generateMockData();
      
      if (chartRef.current) {
        chartRef.current.series[0].setData(data);
        chartRef.current.series[1].setData(cashData);
        chartRef.current.series[2].setData(stocksData);
        chartRef.current.series[3].setData([data[data.length - 1]]);
      } else {
        chartRef.current = Highcharts.chart(chartContainerRef.current, {
          chart: {
            height: 400,
            spacingRight: 20,
            events: {
              render: function() {
                const chart = this;
                const legendOptions = chart.legend.options;
                
                if (chart.chartWidth < 600) {
                  if (legendOptions.align !== 'center') {
                    chart.update({
                      legend: {
                        align: 'center',
                        verticalAlign: 'bottom',
                        layout: 'horizontal',
                        x: 0,
                        y: 0,
                        itemMarginTop: 5,
                        itemMarginBottom: 5
                      }
                    }, false);
                    chart.redraw();
                  }
                } else {
                  if (legendOptions.align !== 'right') {
                    chart.update({
                      legend: {
                        align: 'right',
                        verticalAlign: 'top',
                        layout: 'vertical',
                        x: -10,
                        y: 50,
                        itemMarginTop: 8,
                        itemMarginBottom: 8
                      }
                    }, false);
                    chart.redraw();
                  }
                }
              }
            }
          },
          title: {
            text: null
          },
          xAxis: {
            type: 'datetime',
            labels: {
              format: '{value:%d %b}'
            },
            minPadding: 0,
            maxPadding: 0
          },
          yAxis: {
            title: {
              text: null
            },
            labels: {
              formatter: function() {
                return Highcharts.numberFormat(this.value, 0) + ' €';
              }
            },
            min: 0
          },
          legend: {
            enabled: true,
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: -10,
            y: 50,
            itemMarginTop: 8,
            itemMarginBottom: 8,
            itemStyle: {
              fontWeight: 'normal',
              fontSize: '14px'
            }
          },
          credits: {
            enabled: false
          },
          tooltip: {
            shared: true,
            valueDecimals: 2,
            valuePrefix: '',
            valueSuffix: ' €',
            xDateFormat: '%d %b, %Y',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            shadow: true
          },
          plotOptions: {
            series: {
              marker: {
                enabled: false,
                radius: 4,
                states: {
                  hover: {
                    enabled: true,
                    lineColor: '#FFFFFF'
                  }
                }
              },
              states: {
                hover: {
                  lineWidth: 2
                }
              },
              animation: {
                duration: 1000
              }
            }
          },
          series: [{
            name: 'Valor total',
            type: 'spline',
            data: data,
            color: '#1976d2',
            lineWidth: 3,
            marker: {
              enabled: false
            },
            enableMouseTracking: true,
            showInLegend: true
          }, {
            name: 'Efectivo',
            type: 'spline',
            data: cashData,
            color: '#4caf50',
            lineWidth: 2,
            marker: {
              enabled: false
            },
            enableMouseTracking: true,
            showInLegend: true
          }, {
            name: 'Acciones',
            type: 'spline',
            data: stocksData,
            color: '#ff9800',
            lineWidth: 2,
            marker: {
              enabled: false
            },
            enableMouseTracking: true,
            showInLegend: true
          }, {
            name: 'Valor actual',
            type: 'scatter',
            data: [data[data.length - 1]],
            marker: {
              enabled: true,
              radius: 6,
              symbol: 'circle',
              fillColor: '#1976d2',
              lineColor: '#ffffff',
              lineWidth: 2
            },
            showInLegend: false,
            enableMouseTracking: false
          }]
        });
      }
    };

    if (accountValue !== null && chartContainerRef.current) {
      createChart();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [accountValue, cashBalance, stocksValue]);

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '400px', marginBottom: '20px' }} />
  );
};

export default AccountValueChart; 