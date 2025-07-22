import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import './App.css';

const TabPlataformas = ({ tipo }) => {
  const [datos, setDatos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');
  const [ultimaModificacion, setUltimaModificacion] = useState(0);

  const cargarDatos = async (forzar = false) => {
    try {
      // Primero verificar si hubo cambios
      const verificacion = await axios.get(
        'https://grafica-bakend.onrender.com/porcentajes/verificar-actualizacion'
      );
      
      const modificacionActual = verificacion.data[tipo]?.modificado || 0;
      
      if (!forzar && modificacionActual <= ultimaModificacion) {
        // No hay cambios, no es necesario recargar
        setUltimaActualizacion(new Date().toLocaleTimeString());
        return;
      }
      
      setCargando(true);
      const response = await axios.get(
        `https://grafica-bakend.onrender.com/porcentajes/${tipo}?timestamp=${Date.now()}`
      );
      
      const datosOrdenados = [...response.data].sort((a, b) => 
        a.plataforma.localeCompare(b.plataforma)
      );
      
      setDatos(datosOrdenados);
      setUltimaModificacion(modificacionActual);
      setUltimaActualizacion(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(`Error cargando ${tipo}:`, err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos(true); // Carga inicial forzada
    
    const intervalo = setInterval(() => cargarDatos(), 30000); // Verificar cada 30 segundos
    return () => clearInterval(intervalo);
  }, [tipo]);

  const datosFiltrados = datos.filter(item =>
    item.plataforma.toLowerCase().includes(filtro.toLowerCase())
  );

  const getColorGradient = (porcentaje) => {
    if (porcentaje < 50) {
      const intensity = porcentaje / 50;
      return `rgb(255, ${Math.floor(255 * intensity)}, 0)`;
    } else {
      const intensity = (porcentaje - 50) / 50;
      return `rgb(${Math.floor(255 * (1 - intensity))}, 255, 0)`;
    }
  };

  const opcionesGrafica = {
    tooltip: {
      trigger: 'item',
      formatter: params => {
        const item = params.data;
        return `
          <strong>${item.plataforma}</strong><br/>
          Completado: ${item.porcentaje}% (${item.verde}/${item.totalCasillas})<br/>
          Verde: ${item.verde} | Amarillo: ${item.amarillo}<br/>
          Naranja: ${item.naranja} | Azul: ${item.azul}<br/>
          Rojo: ${item.rojo}
        `;
      }
    },
    grid: {
      top: '15%',
      left: '3%',
      right: '3%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: datosFiltrados.map(item => item.plataforma),
      axisLabel: { 
        interval: 0,
        rotate: 45,
        fontSize: 10,
        width: 80,
        overflow: 'truncate'
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      min: 0,
      axisLabel: { 
        formatter: '{value}%',
        margin: 5
      }
    },
    series: [{
      type: 'bar',
      data: datosFiltrados.map(item => ({
        value: item.porcentaje,
        name: item.plataforma,
        ...item,
        itemStyle: {
          color: getColorGradient(item.porcentaje),
          borderRadius: [4, 4, 0, 0]
        }
      })),
      label: {
        show: true,
        position: 'top',
        formatter: (params) => {
          const data = params.data;
          return `${data.porcentaje}% (${data.verde}/${data.totalCasillas})`;
        },
        fontSize: 10
      },
      barWidth: '60%'
    }]
  };

  return (
    <div className="tab-content">
      <div className="header-tab">
        <div className="buscador">
          <input
            type="text"
            placeholder={`Buscar plataforma ${tipo}...`}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <div className="actualizacion">
          <span>Últ. act: {ultimaActualizacion}</span>
          <button onClick={() => cargarDatos(true)} title="Actualizar ahora">
            ↻
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="cargando">Cargando plataformas {tipo}...</div>
      ) : datosFiltrados.length === 0 ? (
        <div className="sin-datos">
          {filtro ? 'No hay resultados para la búsqueda' : `No hay plataformas ${tipo}`}
        </div>
      ) : (
        <div className="grafica-container">
          <ReactECharts
            option={opcionesGrafica}
            style={{ 
              height: '400px',
              minWidth: `${Math.max(600, datosFiltrados.length * 50)}px`
            }}
          />
        </div>
      )}

      <div className="leyenda-gradiente">
        <span>0% (Crítico)</span>
        <div className="gradiente"></div>
        <span>100% (Óptimo)</span>
      </div>
    </div>
  );
};

const App = () => {
  const [tabActivo, setTabActivo] = useState('inhouse');

  return (
    <div className="contenedor">
      <h1>Dashboard de Plataformas</h1>
      
      <div className="tabs">
        <button
          className={tabActivo === 'inhouse' ? 'activo' : ''}
          onClick={() => setTabActivo('inhouse')}
        >
          Inhouse
        </button>
        <button
          className={tabActivo === 'vendor' ? 'activo' : ''}
          onClick={() => setTabActivo('vendor')}
        >
          Vendor
        </button>
      </div>

      <div className="tab-container">
        {tabActivo === 'inhouse' ? (
          <TabPlataformas tipo="inhouse" />
        ) : (
          <TabPlataformas tipo="vendor" />
        )}
      </div>
    </div>
  );
};

export default App;