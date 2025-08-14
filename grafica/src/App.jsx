import React, { useState, useEffect, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./App.css";

// ==========================
// COMPONENTE GRAFICAS
// ==========================
const TabPlataformas = ({ tipo }) => {
  const [datos, setDatos] = useState([]);
  const [filtroPlataforma, setFiltroPlataforma] = useState("");
  const [filtroDueño, setFiltroDueño] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");

  const normalizarDueño = (dueño) => {
    if (!dueño || dueño === "#N/A") return "NO ASIGNADO";
    return dueño.toUpperCase();
  };

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtroDueño) params.append("dueño", filtroDueño.toUpperCase());

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
      console.error(`❌ Error cargando ${tipo}:`, err);
    } finally {
      setCargando(false);
    }
  }, [tipo, filtroDueño]);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 300000);
    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  const datosFiltrados = datos.filter(
    (item) =>
      item.plataforma?.toLowerCase().includes(filtroPlataforma.toLowerCase()) &&
      (filtroDueño === "" || item.dueño?.includes(filtroDueño.toUpperCase()))
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
            .map((d) => {
              const estado = d.estado?.toString().trim().toUpperCase();
              if (estado === "1" || estado === "TRUE") {
                return `${d.nombre}: ✅`;
              } else if (!estado || estado === "0") {
                return `${d.nombre}: ❌`;
              } else {
                return `${d.nombre}: <strong>${d.estado}</strong>`;
              }
            })
            .join("<br/>")}
        `;
      },
    },
    grid: { top: "15%", left: "3%", right: "3%", bottom: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: datosFiltrados.map((item) => item.plataforma),
      axisLabel: { interval: 0, rotate: 45, fontSize: 10, width: 80, overflow: "truncate" },
    },
    yAxis: { type: "value", max: 100, min: 0, axisLabel: { formatter: "{value}%", margin: 5 } },
    series: [
      {
        type: "bar",
        data: datosFiltrados.map((item) => ({
          value: item.porcentaje,
          name: `${item.plataforma} (${item.dueño})`,
          ...item,
          itemStyle: { color: getColorPorPorcentaje(item.porcentaje), borderRadius: [4, 4, 0, 0] },
        })),
        label: {
          show: true,
          position: "top",
          formatter: (params) => `${params.data.porcentaje}% (${params.data.completadas}/${params.data.totalColumnas})`,
          fontSize: 10,
        },
        barWidth: "60%",
      },
    ],
  };

  return (
    <div className="tab-content">
      <div className="header-tab">
        <div className="filtros-container grid gap-2 ">
          <input
          className="border-2 p-2 rounded-3xl"
            type="text"
            placeholder="Buscar plataforma..."
            value={filtroPlataforma}
            onChange={(e) => setFiltroPlataforma(e.target.value)}
          />
          <input
                    className="border-2 p-2 rounded-3xl"
            type="text"
            placeholder="Filtrar por dueño..."
            value={filtroDueño}
            onChange={(e) => setFiltroDueño(e.target.value)}
          />
          <div className="actualizacion">
            <span>Últ. act: {ultimaActualizacion}</span>
            <button onClick={cargarDatos} title="Actualizar ahora">↻</button>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="cargando">Cargando plataforma</div>
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
            style={{ height: "450px", minWidth: `${Math.max(600, datosFiltrados.length * 60)}px` }}
          />
        </div>
      )}
    </div>
  );
};

// ==========================
// COMPONENTE CALENDARIO
// ==========================
const Calendario = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const response = await axios.get("https://grafica-bakend.onrender.com/calendario");
        const eventosFormateados = response.data.map(evento => ({
          ...evento,
          start: evento.start || new Date().toISOString().split('T')[0],
          extendedProps: {
            description: evento.description || ""
          }
        }));
        setEventos(eventosFormateados);
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEventos();
  }, []);

  if (loading) return <div>Cargando calendario...</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center" }}>Calendario de Eventos</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="es"
        events={eventos}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          alert(
            `Evento: ${info.event.title}\n` +
            `Fecha: ${info.event.start.toLocaleDateString('es-ES')}\n` +
            `Descripción: ${info.event.extendedProps?.description || "Sin detalles"}`
          );
        }}
      />
    </div>
  );
};

// ==========================
// APP PRINCIPAL
// ==========================
const App = () => {
  const [tabActivo, setTabActivo] = useState("inhouse");

  return (
    <div className="contenedor">
      <h1>Dashboard de Progreso de Plataformas</h1>
      <div className="tabs">
        <button 
          className={tabActivo === "inhouse" ? "activo" : ""} 
          onClick={() => setTabActivo("inhouse")}
        >
          Vendor
          
        </button>
        <button 
          className={tabActivo === "vendor" ? "activo" : ""} 
          onClick={() => setTabActivo("vendor")}
        >
          Inhouse
        </button>
        <button 
          className={tabActivo === "calendario" ? "activo" : ""} 
          onClick={() => setTabActivo("calendario")}
        >
          Calendario
        </button>
      </div>

      <div className="tab-container">
        {tabActivo === "inhouse" && <TabPlataformas tipo="inhouse" />}
        {tabActivo === "vendor" && <TabPlataformas tipo="vendor" />}
        {tabActivo === "calendario" && <Calendario />}
      </div>
    </div>
  );
};

export default App;