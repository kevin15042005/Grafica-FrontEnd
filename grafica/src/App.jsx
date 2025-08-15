import React, { useState, useCallback, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

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
              if (estado === "1" || estado === "TRUE") return `${d.nombre}: ✅`;
              if (!estado || estado === "0") return `${d.nombre}: ❌`;
              return `${d.nombre}: <strong>${d.estado}</strong>`;
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
    <div className="tab-content p-4">
      <div className="header-tab flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Buscar plataforma..."
            value={filtroPlataforma}
            onChange={(e) => setFiltroPlataforma(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="Filtrar por dueño..."
            value={filtroDueño}
            onChange={(e) => setFiltroDueño(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Últ. act: {ultimaActualizacion}</span>
          <button onClick={cargarDatos} title="Actualizar ahora" className="px-2 py-1 border rounded hover:bg-gray-100">
            ↻
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center text-gray-500">Cargando plataforma...</div>
      ) : datosFiltrados.length === 0 ? (
        <div className="text-center text-gray-500">
          {filtroPlataforma || filtroDueño
            ? "No hay resultados para los filtros aplicados"
            : `No hay plataformas ${tipo}`}
        </div>
      ) : (
        <div className="grafica-container overflow-x-auto">
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
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");

  const cargarEventos = useCallback(async () => {
    try {
      setCargando(true);
      const response = await axios.get("https://grafica-bakend.onrender.com/calendario");

      const eventosFormateados = response.data.map(evento => ({
        ...evento,
        start: evento.start || new Date().toISOString().split('T')[0],
        extendedProps: {
          description: evento.description || "",
          dueño: evento.dueño || "NO ASIGNADO"
        }
      }));

      setEventos(eventosFormateados);
      setUltimaActualizacion(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  if (cargando) return <div className="text-center p-4 text-gray-500">Cargando calendario...</div>;

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Calendario de Eventos</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Últ. act: {ultimaActualizacion}</span>
          <button onClick={cargarEventos} className="px-2 py-1 border rounded hover:bg-gray-100 text-sm">
            ↻ Actualizar
          </button>
        </div>
      </div>

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
        eventContent={(eventInfo) => (
          <div className="text-center p-1">
            <div className="font-bold text-xs">{eventInfo.event.extendedProps.dueño}</div>
            <div className="text-xs">{eventInfo.event.title}</div>
          </div>
        )}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          alert(
            `Dueño: ${info.event.extendedProps?.dueño}\n` +
            `Plataforma: ${info.event.title}\n` +
            `Fecha: ${info.event.start.toLocaleDateString("es-ES")}\n` +
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
    <div className="contenedor p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard de Progreso de Plataformas</h1>
      <div className="tabs flex gap-2 mb-4">
        <button 
          className={`px-3 py-1 rounded ${tabActivo === "inhouse" ? "bg-blue-500 text-white" : "bg-gray-200"}`} 
          onClick={() => setTabActivo("inhouse")}
        >
          Vendor
        </button>
        <button 
          className={`px-3 py-1 rounded ${tabActivo === "vendor" ? "bg-blue-500 text-white" : "bg-gray-200"}`} 
          onClick={() => setTabActivo("vendor")}
        >
          Inhouse
        </button>
        <button 
          className={`px-3 py-1 rounded ${tabActivo === "calendario" ? "bg-blue-500 text-white" : "bg-gray-200"}`} 
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
