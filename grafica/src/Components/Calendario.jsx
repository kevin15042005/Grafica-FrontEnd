import React, { useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

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

  React.useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  if (cargando) return <div className="cargando">Cargando calendario...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif", gap: "20px" }}>
      
      {/* Calendario */}
      <div style={{ flex: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.2rem" }}>Calendario de Eventos</h2>
          <div>
            <span style={{ marginRight: "10px", fontSize: "0.8rem", color: "#555" }}>
              Últ. act: {ultimaActualizacion}
            </span>
            <button onClick={cargarEventos} style={{ padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}>
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
            <div style={{ padding: "2px", textAlign: "center" }}>
              <div style={{ fontWeight: "bold", fontSize: "0.7rem" }}>{eventInfo.event.extendedProps.dueño}</div>
              <div style={{ fontSize: "0.7rem" }}>{eventInfo.event.title}</div>
            </div>
          )}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            alert(
              `Fecha: ${info.event.start.toLocaleDateString("es-ES")}\n` +
              `Descripción: ${info.event.extendedProps?.description || "Sin detalles"}`
            );
          }}
        />
      </div>

      {/* Panel lateral */}
      <div style={{ flex: 1, border: "1px solid #ddd", borderRadius: "5px", padding: "10px", height: "fit-content" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "10px" }}>Eventos del Mes</h3>
        {eventos.length === 0 ? (
          <div style={{ fontSize: "0.8rem" }}>No hay eventos</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, fontSize: "0.75rem", lineHeight: "1.2rem" }}>
            {eventos.map((e, idx) => (
              <li key={idx} style={{ marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                <div><b>Dueño:</b> {e.extendedProps.dueño}</div>
                <div><b>Plataforma:</b> {e.title}</div>
                <div><b>Descripción:</b> {e.extendedProps.description || "Sin detalles"}</div>
                <div><b>Fecha:</b> {new Date(e.start).toLocaleDateString("es-ES")}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default Calendario;
