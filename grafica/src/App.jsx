import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";
import "./App.css";

const TabPlataformas = ({ tipo }) => {
  const [datos, setDatos] = useState([]);
  const [filtroPlataforma, setFiltroPlataforma] = useState("");
  const [filtroDueño, setFiltroDueño] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");

  const normalizarDueño = (dueño) => {
    if (!dueño || dueño === "#N/A") return "NO ASIGNADO";
    return dueño.toUpperCase(); // Aseguramos mayúsculas
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtroDueño) params.append("dueño", filtroDueño.toUpperCase()); // Enviamos en mayúsculas

      const response = await axios.get(
        `https://grafica-bakend.onrender.com/porcentajes/${tipo}?${params.toString()}`
      );

      const datosLimpios = response.data.map((item) => ({
        ...item,
        dueño: normalizarDueño(item.dueño),
      }));

      const datosOrdenados = [...datosLimpios].sort((a, b) =>
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
    const intervalo = setInterval(() => cargarDatos(), 300000);
    return () => clearInterval(intervalo);
  }, [tipo, filtroDueño]);

  const datosFiltrados = datos.filter((item) =>
    item.plataforma?.toLowerCase().includes(filtroPlataforma.toLowerCase()) &&
    (filtroDueño === "" || item.dueño?.includes(filtroDueño.toUpperCase())) // Filtro local en mayúsculas
  );

  const getColorPorPorcentaje = (porcentaje) => {
    if (porcentaje >= 75) return "#4CAF50";
    if (porcentaje >= 40) return "#FFC107";
    return "#F44336";
  };

  const opcionesGrafica = {
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const item = params.data;
        return `
          <strong>${item.plataforma}</strong><br/>
          Dueño: ${item.dueño}<br/>
          Progreso: ${item.porcentaje}% (${item.completadas}/${item.totalColumnas})<br/>
          <hr style="margin: 5px 0; opacity: 0.2"/>
          ${item.detalle
            .map((d) => `${d.nombre}: ${d.completada ? "✅" : "❌"}`)
            .join("<br/>")}
        `;
      },
    },
    grid: {
      top: "15%",
      left: "3%",
      right: "3%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: datosFiltrados.map((item) => item.plataforma),
      axisLabel: {
        interval: 0,
        rotate: 45,
        fontSize: 10,
        width: 80,
        overflow: "truncate",
      },
    },
    yAxis: {
      type: "value",
      max: 100,
      min: 0,
      axisLabel: {
        formatter: "{value}%",
        margin: 5,
      },
    },
    series: [
      {
        type: "bar",
        data: datosFiltrados.map((item) => ({
          value: item.porcentaje,
          name: `${item.plataforma} (${item.dueño})`,
          ...item,
          itemStyle: {
            color: getColorPorPorcentaje(item.porcentaje),
            borderRadius: [4, 4, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top",
          formatter: (params) => {
            const data = params.data;
            return `${data.porcentaje}% (${data.completadas}/${data.totalColumnas})`;
          },
          fontSize: 10,
        },
        barWidth: "60%",
      },
    ],
  };

  return (
    <div className="tab-content">
      <div className="header-tab">
        <div className="filtros-container">
          <div className="buscador">
            <input
              type="text"
              placeholder="Buscar plataforma..."
              value={filtroPlataforma}
              onChange={(e) => setFiltroPlataforma(e.target.value)}
            />
          </div>
          <div className="buscador">
            <input
              type="text"
              placeholder="Filtrar por dueño..."
              value={filtroDueño}
              onChange={(e) => setFiltroDueño(e.target.value)}
            />
          </div>
          <div className="actualizacion">
            <span>Últ. act: {ultimaActualizacion}</span>
            <button onClick={cargarDatos} title="Actualizar ahora">
              ↻
            </button>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="cargando">Cargando plataformas {tipo}...</div>
      ) : datosFiltrados.length === 0 ? (
        <div className="sin-datos">
          {filtroPlataforma || filtroDueño
            ? "No hay resultados para los filtros aplicados"
            : `No hay plataformas ${tipo}`}
        </div>
      ) : (
        <div className="grafica-container">
          <ReactECharts
            option={opcionesGrafica}
            style={{
              height: "450px",
              minWidth: `${Math.max(600, datosFiltrados.length * 60)}px`,
            }}
          />
        </div>
      )}

      <div className="leyenda">
        <div className="leyenda-item">
          <span className="leyenda-color" style={{ backgroundColor: "#4CAF50" }}></span>
          <span>75-100% (Óptimo)</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color" style={{ backgroundColor: "#FFC107" }}></span>
          <span>40-74% (En progreso)</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color" style={{ backgroundColor: "#F44336" }}></span>
          <span>0-39% (Pendiente)</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [tabActivo, setTabActivo] = useState("vendor");

  return (
    <div className="contenedor">
      <h1>Dashboard de Progreso de Plataformas</h1>

      <div className="tabs">
        <button
          className={tabActivo === "vendor" ? "activo" : ""}
          onClick={() => setTabActivo("vendor")}
        >
          Vendor
        </button>
        <button
          className={tabActivo === "inhouse" ? "activo" : ""}
          onClick={() => setTabActivo("inhouse")}
        >
          Inhouse
        </button>
      </div>

      <div className="tab-container">
        {tabActivo === "vendor" ? (
          <TabPlataformas tipo="vendor" />
        ) : (
          <TabPlataformas tipo="inhouse" />
        )}
      </div>
    </div>
  );
};

export default App;