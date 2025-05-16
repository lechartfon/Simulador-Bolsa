import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';

const GraficaValorCuenta = ({ accountValue, cashBalance, stocksValue }) => { 
  const contenedorGrafica = useRef(null);
  const grafica = useRef(null);

  useEffect(() => {
    const generarDatosHistoricos = () => {
      const hoy = new Date();
      const datosTotal = [];
      const datosEfectivo = [];
      const datosAcciones = [];
      
      const valorTotal = accountValue || 50000;
      const dineroEfectivo = cashBalance || 50000;
      const valorAcciones = stocksValue || 0;
      const esCuentaNueva = valorAcciones === 0 && Math.abs(dineroEfectivo - 50000) < 0.01;
      
      // Generar datos para los últimos 30 días
      for (let i = 29; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() - i);
        const tiempo = fecha.getTime();
        
        if (esCuentaNueva) {
          datosTotal.push([tiempo, 50000]);
          datosEfectivo.push([tiempo, 50000]);
          datosAcciones.push([tiempo, 0]);
        } else {
          
          const factorAleatorio = 0.95 + (Math.random() * 0.1);
          const factorDia = 0.95 + ((29 - i) / 29) * 0.1;
          
          const valor = valorTotal * factorAleatorio * factorDia;
          
          const factorAcciones = 0.90 + (Math.random() * 0.2);
          const proporcionAcciones = valorTotal > 0 ? (valorAcciones / valorTotal) : 0;
          const valorAccionesDia = (valor * proporcionAcciones) * factorAcciones;
          const valorEfectivoDia = valor - valorAccionesDia;
          datosTotal.push([tiempo, Math.round(valor * 100) / 100]);
          datosEfectivo.push([tiempo, Math.round(valorEfectivoDia * 100) / 100]);
          datosAcciones.push([tiempo, Math.round(valorAccionesDia * 100) / 100]);
        }
      }
      
      // Asegurar que el último punto muestra los valores actuales exactos
      if (datosTotal.length > 0) {
        const tiempoActual = hoy.getTime();
        datosTotal[datosTotal.length - 1] = [tiempoActual, valorTotal];
        datosEfectivo[datosEfectivo.length - 1] = [tiempoActual, dineroEfectivo];
        datosAcciones[datosAcciones.length - 1] = [tiempoActual, valorAcciones];
      }
      
      return { 
        datosTotal, 
        datosEfectivo, 
        datosAcciones 
      };
    };    
    const crearGrafica = () => {
      const { datosTotal, datosEfectivo, datosAcciones } = generarDatosHistoricos();
      
      // Si ya existe la gráfica, solo actualizar los datos
      if (grafica.current) {
        grafica.current.series[0].setData(datosTotal);
        grafica.current.series[1].setData(datosEfectivo);
        grafica.current.series[2].setData(datosAcciones);
        grafica.current.series[3].setData([datosTotal[datosTotal.length - 1]]);
      } 
      // Si no existe, crear la gráfica completa
      else {
        grafica.current = Highcharts.chart(contenedorGrafica.current, {
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
            data: datosTotal,
            color: '#1976d2', // azul
            lineWidth: 3,
            marker: {
              enabled: false
            },
            enableMouseTracking: true,
            showInLegend: true
          }, {
            name: 'Efectivo',
            type: 'spline',
            data: datosEfectivo,
            color: '#4caf50', // verde
            lineWidth: 2,
            marker: {
              enabled: false
            },
            enableMouseTracking: true,
            showInLegend: true
          }, {
            name: 'Acciones',
            type: 'spline',
            data: datosAcciones,
            color: '#ff9800', // naranja
            lineWidth: 2,
            marker: {
              enabled: false
            },
            enableMouseTracking: true,
            showInLegend: true
          }, {
            name: 'Valor actual',
            type: 'scatter',
            data: [datosTotal[datosTotal.length - 1]],
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
    if (accountValue !== null && contenedorGrafica.current) {
      crearGrafica();
    }

    return () => {
      if (grafica.current) {
        grafica.current.destroy();
        grafica.current = null;
      }
    };
  }, [accountValue, cashBalance, stocksValue]);

  return (
    <div ref={contenedorGrafica} style={{ width: '100%', height: '400px', marginBottom: '20px' }} />
  );
};

export default GraficaValorCuenta;