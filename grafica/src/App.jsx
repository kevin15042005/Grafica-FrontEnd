import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import './App.css';

const TabPlataformas = ({ tipo }) => {
  const [datos, setDatos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const response = await axios.get(
        `http://localhost:8080/porcentajes/${tipo}?timestamp=${Date.now()}`
      );

      const datosOrdenados = [...response.data].sort((a, b) =>
        a.plataforma.localeCompare(b.plataforma)
      );

      setDatos(datosOrdenados);
      setUltimaActualizacion(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(`Error cargando ${tipo}:`, err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(() => cargarDatos(), 30000);
    return () => clearInterval(intervalo);
  }, [tipo]);

  const datosFiltrados = datos.filter(item =>
    item.plataforma.toLowerCase().includes(filtro.toLowerCase())
  );

  const getColorPorPorcentaje = (porcentaje) => {
    if (porcentaje >= 75) return '#4CAF50';  // Verde
    if (porcentaje >= 40) return '#FFC107';  // Amarillo
    return '#F44336';  // Rojo
  };

  const opcionesGrafica = {
    tooltip: {
      trigger: 'item',
      formatter: params => {
        const item = params.data;
        return `
          <strong>${item.plataforma}</strong><br/>
          Progreso: ${item.porcentaje}% (${item.completadas}/9 columnas)<br/>
          <hr style="margin: 5px 0; opacity: 0.2"/>
          ${item.detalle.map(d => 
            `${d.nombre}: ${d.completada ? '✅' : '❌'}`
          ).join('<br/>')}
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
          color: getColorPorPorcentaje(item.porcentaje),
          borderRadius: [4, 4, 0, 0]
        }
      })),
      label: {
        show: true,
        position: 'top',
        formatter: (params) => {
          const data = params.data;
          return `${data.porcentaje}% (${data.completadas}/9)`;
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
          <button onClick={cargarDatos} title="Actualizar ahora">
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

      <div className="leyenda">
        <div className="leyenda-item">
          <span className="leyenda-color" style={{backgroundColor: '#4CAF50'}}></span>
          <span>75-100% (Óptimo)</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color" style={{backgroundColor: '#FFC107'}}></span>
          <span>40-74% (En progreso)</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color" style={{backgroundColor: '#F44336'}}></span>
          <span>0-39% (Pendiente)</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [tabActivo, setTabActivo] = useState('inhouse');

  return (
    <div className="contenedor">
      <h1>Dashboard de Progreso de Plataformas</h1>
      
      <div className="tabs">
        <button
          className={tabActivo === 'inhouse' ? 'activo' : ''}
          onClick={() => setTabActivo('inhouse')}
        >
          Vendor
        </button>
        <button
          className={tabActivo === 'vendor' ? 'activo' : ''}
          onClick={() => setTabActivo('vendor')}
        >
          Inhouse
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