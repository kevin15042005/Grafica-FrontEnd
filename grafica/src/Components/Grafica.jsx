import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";
import "./Grafica.css";

const GraficaPlataformas = () => {
  const [datos, setDatos] = useState([]);
  const [tipoActivo, setTipoActivo] = useState("inhouse");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCargando(true);
        const response = await axios.get("https://grafica-bakend.onrender.com/porcentajes");
        console.log("Datos recibidos:", response.data);
        setDatos(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener datos:", err);
        setError("Error al cargar los datos. Por favor intenta más tarde.");
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, []);

  // Función mejorada para determinar el tipo de plataforma
  const determinarTipo = (plataforma) => {
    if (!plataforma) return "inhouse";
    const plataformaLower = plataforma.toLowerCase();
    
    // Palabras clave para identificar vendors
    const vendorKeywords = ["vendor", "tercero", "externo", "proveedor", "socio"];
    
    return vendorKeywords.some(keyword => plataformaLower.includes(keyword)) 
      ? "vendor" 
      : "inhouse";
  };

  // Filtrar y ordenar datos
  const datosFiltrados = datos
    .filter((item) => determinarTipo(item.plataforma) === tipoActivo)
    .sort((a, b) => b.porcentaje - a.porcentaje); // Ordenar por porcentaje descendente

  // Configuración de colores
  const colores = {
    verde: "#2ecc71",
    amarillo: "#f1c40f",
    naranja: "#e67e22",
    azul: "#3498db",
    rojo: "#e74c3c",
    rojoOscuro: "#c0392b"
  };

  // Opciones para gráfico de barras apiladas
  const obtenerOpcionesGrafica = (item) => {
    const datosGrafica = [
      { name: "Verde", value: item.verde, color: colores.verde },
      { name: "Amarillo", value: item.amarillo, color: colores.amarillo },
      { name: "Naranja", value: item.naranja, color: colores.naranja },
      { name: "Azul", value: item.azul, color: colores.azul },
      { name: "Rojo", value: item.rojo, color: colores.rojo },
      { name: "Rojo Oscuro", value: item.rojoOscuro, color: colores.rojoOscuro }
    ];

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function(params) {
          let result = `<strong>${item.plataforma}</strong><br/>`;
          params.forEach(param => {
            result += `${param.seriesName}: ${param.value} (${Math.round(param.percent)}%)<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: datosGrafica.map(item => item.name),
        bottom: 0
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true
      },
      xAxis: { type: "value" },
      yAxis: {
        type: "category",
        data: [""],
        axisLabel: { show: false }
      },
      series: datosGrafica.map(dataItem => ({
        name: dataItem.name,
        type: "bar",
        stack: "total",
        emphasis: { focus: "series" },
        data: [{ 
          value: dataItem.value,
          itemStyle: { color: dataItem.color }
        }],
        label: {
          show: true,
          position: "inside",
          formatter: "{c}",
          color: "#fff",
          fontWeight: "bold"
        }
      }))
    };
  };

  if (cargando) {
    return (
      <div className="estado-container">
        <div className="cargando">
          <div className="spinner"></div>
          <p>Cargando datos de plataformas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estado-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor-grafica">
      <h1>Dashboard de Plataformas - {tipoActivo.toUpperCase()}</h1>
      
      <div className="filtros">
        <button 
          className={tipoActivo === "inhouse" ? "activo" : ""}
          onClick={() => setTipoActivo("inhouse")}
        >
          <i className="icono-casa"></i> Inhouse
        </button>
        <button 
          className={tipoActivo === "vendor" ? "activo" : ""}
          onClick={() => setTipoActivo("vendor")}
        >
          <i className="icono-proveedor"></i> Vendor
        </button>
      </div>

      {datosFiltrados.length === 0 ? (
        <div className="sin-datos">
          <p>No se encontraron plataformas del tipo {tipoActivo}</p>
          <p>Verifica los datos o intenta con el otro tipo.</p>
        </div>
      ) : (
        <>
          <div className="resumen-gerencia">
            <p>
              Mostrando <strong>{datosFiltrados.length}</strong> plataformas {tipoActivo}
            </p>
            <div className="leyenda-colores">
              {Object.entries(colores).map(([nombre, color]) => (
                <span key={nombre} className="item-leyenda">
                  <span className="color-muestra" style={{backgroundColor: color}}></span>
                  {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid-graficas">
            {datosFiltrados.map((item, index) => (
              <div key={index} className="tarjeta-plataforma">
                <div className="encabezado-plataforma">
                  <h3>{item.plataforma}</h3>
                  <div className="porcentaje-total" style={{
                    backgroundColor: item.porcentaje >= 80 ? colores.verde :
                                    item.porcentaje >= 50 ? colores.amarillo : colores.rojo
                  }}>
                    {item.porcentaje}% completado
                  </div>
                </div>
                
                <div className="grafica-container">
                  <ReactECharts 
                    option={obtenerOpcionesGrafica(item)} 
                    style={{ height: "300px", width: "100%" }}
                  />
                </div>
                
                <div className="detalle-estados">
                  {Object.entries(colores).map(([nombre, color]) => (
                    <div key={nombre} className="estado-item">
                      <span className="color-muestra" style={{backgroundColor: color}}></span>
                      <span className="nombre-estado">
                        {nombre.charAt(0).toUpperCase() + nombre.slice(1)}:
                      </span>
                      <span className="valor-estado">{item[nombre]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GraficaPlataformas;