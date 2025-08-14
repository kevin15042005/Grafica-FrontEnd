import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

const Calendario = () => {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const response = await axios.get("https://grafica-bakend.onrender.com/calendario");
        setEventos(response.data);
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      }
    };

    cargarEventos();
  }, []);

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "900px", 
      margin: "0 auto",
      fontFamily: "Arial, sans-serif"
    }}>
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
          <div style={{ padding: "2px" }}>
            <b>{eventInfo.event.title}</b>
            {eventInfo.event.extendedProps?.description && (
              <div style={{ fontSize: "0.8em" }}>
                {eventInfo.event.extendedProps.description}
              </div>
            )}
          </div>
        )}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          alert(
            `Plataforma: ${info.event.title}\n` +
            `Fecha: ${info.event.start.toLocaleDateString('es-ES')}\n` +
            `Descripción: ${info.event.extendedProps?.description || "Sin detalles"}`
          );
        }}
      />
    </div>
  );
};

export default Calendario;