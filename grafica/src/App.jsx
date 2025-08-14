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
      axisLabel: { 
        interval: 0, 
        rotate: 45, 
        fontSize: 10, 
        width: 80, 
        overflow: "truncate",
        textStyle: {
          color: '#333'
        }
      },
    },
    yAxis: { 
      type: "value", 
      max: 100, 
      min: 0, 
      axisLabel: { 
        formatter: "{value}%", 
        margin: 5,
        textStyle: {
          color: '#333'
        }
      } 
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
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 5,
            shadowOffsetY: 2
          },
        })),
        label: {
          show: true,
          position: "top",
          formatter: (params) => `${params.data.porcentaje}% (${params.data.completadas}/${params.data.totalColumnas})`,
          fontSize: 10,
          color: '#333'
        },
        barWidth: "60%",
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 10,
            shadowOffsetY: 5
          }
        }
      },
    ],
    backgroundColor: '#fff'
  };

  return (
    <div className="tab-content p-4">
      <div className="header-tab mb-6">
        <div className="filtros-container grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Buscar plataforma</label>
            <input
              className="border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              type="text"
              placeholder="Ej: ACS"
              value={filtroPlataforma}
              onChange={(e) => setFiltroPlataforma(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Filtrar por dueño</label>
            <input
              className="border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              type="text"
              placeholder="Ej: JUAN PEREZ"
              value={filtroDueño}
              onChange={(e) => setFiltroDueño(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Últ. act: {ultimaActualizacion}</span>
            <button 
              onClick={cargarDatos} 
              title="Actualizar ahora"
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : datosFiltrados.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {filtroPlataforma || filtroDueño
              ? "No hay resultados para los filtros aplicados"
              : `No hay plataformas ${tipo}`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      ) : (
        <div className="grafica-container overflow-x-auto">
          <div className="min-w-full" style={{ minWidth: `${Math.max(600, datosFiltrados.length * 60)}px` }}>
            <ReactECharts
              option={opcionesGrafica}
              style={{ height: "450px", width: "100%" }}
              className="shadow-md rounded-lg bg-white p-2"
            />
          </div>
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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="w-full px-4 py-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Calendario de Eventos</h2>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          events={eventos}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek"
          }}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            alert(
              `Evento: ${info.event.title}\n` +
              `Fecha: ${info.event.start.toLocaleDateString('es-ES')}\n` +
              `Descripción: ${info.event.extendedProps?.description || "Sin detalles"}`
            );
          }}
          eventClassNames="cursor-pointer"
          dayHeaderClassNames="text-gray-700 font-medium"
          height="auto"
        />
      </div>
    </div>
  );
};

// ==========================
// APP PRINCIPAL
// ==========================
const App = () => {
  const [tabActivo, setTabActivo] = useState("inhouse");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="contenedor mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Dashboard de Progreso de Plataformas</h1>
        
        <div className="tabs flex flex-wrap justify-center gap-2 mb-6">
          <button 
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              tabActivo === "inhouse" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
            onClick={() => setTabActivo("inhouse")}
          >
            Inhouse
          </button>
          <button 
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              tabActivo === "vendor" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
            onClick={() => setTabActivo("vendor")}
          >
            Vendor
          </button>
          <button 
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              tabActivo === "calendario" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
            onClick={() => setTabActivo("calendario")}
          >
            Calendario
          </button>
        </div>

        <div className="tab-container bg-white rounded-xl shadow-md overflow-hidden">
          {tabActivo === "inhouse" && <TabPlataformas tipo="inhouse" />}
          {tabActivo === "vendor" && <TabPlataformas tipo="vendor" />}
          {tabActivo === "calendario" && <Calendario />}
        </div>
      </div>
    </div>
  );
};

export default App;