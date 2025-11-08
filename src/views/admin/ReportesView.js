/* ===============================
  📊 MÓDULO DE REPORTES COMPLETO
================================= */
import estilos from "./ReportesView.module.css";
import { apiObtenerMiembros } from "../../api/membersApi.js";
import { apiObtenerClases } from "../../api/apiClases.js";
import { apiObtenerMiembrosXClase } from "../../api/apiMiembroxClase.js";
import { apiObtenerAsistenciasCompletas } from "../../api/apiAsistencias.js";
import { apiObtenerPagos } from "../../api/apiPago.js";
import * as XLSX from "xlsx";

/* ===============================
  🧩 MENÚ PRINCIPAL DE REPORTES
================================= */
export const renderizarVistaReportes = async (contenedor) => {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.bloquesReportesFila}">
        <button class="${estilos.bloqueMini}" id="reporte-ingresos">💰 Ingresos</button>
        <button class="${estilos.bloqueMini}" id="reporte-asistencia-gimnasio">🏋️ Gimnasio</button>
        <button class="${estilos.bloqueMini}" id="reporte-asistencia-clases">📅 Clases</button>
      </div>
      <div id="contenedor-reporte"></div>
    </div>
  `;

  const contenedorReporte = contenedor.querySelector("#contenedor-reporte");

  // Eventos de los botones
  contenedor.querySelector("#reporte-ingresos")
    .addEventListener("click", () => renderizarReporteIngresos(contenedorReporte));
  contenedor.querySelector("#reporte-asistencia-gimnasio")
    .addEventListener("click", () => renderizarReporteAsistenciaGimnasio(contenedorReporte));
  contenedor.querySelector("#reporte-asistencia-clases")
    .addEventListener("click", () => renderizarReporteAsistenciaClases(contenedorReporte));

  // Abrir por defecto el primer reporte
  renderizarReporteIngresos(contenedorReporte);
};

/* ===============================
  💰 REPORTE DE INGRESOS POR MEMBRESÍAS
================================= */
async function renderizarReporteIngresos(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <h2>💰 Reporte de ingresos por membresías</h2>

      <div class="${estilos.filtros}">
        <label>Desde:</label>
        <input type="date" id="filtro-desde" class="${estilos.inputFecha}">
        <label>Hasta:</label>
        <input type="date" id="filtro-hasta" class="${estilos.inputFecha}">
        <label>Método:</label>
        <select id="filtro-metodo" class="${estilos.selectInput}">
          <option value="">Todos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
        </select>

        <button id="boton-filtrar" class="${estilos.botonFiltrar}">🔍 Ver Registro</button>
        <button id="boton-imprimir" class="${estilos.botonImprimir}">🖨️ Imprimir</button>
        <button id="boton-excel" class="${estilos.botonImprimir}">📥 Exportar Excel</button>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Método</th>
              <th>Monto</th>
              <th>Descuento</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla-reportes">
            <tr><td colspan="5">Cargando pagos...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const filtroDesde = contenedor.querySelector("#filtro-desde");
  const filtroHasta = contenedor.querySelector("#filtro-hasta");
  const filtroMetodo = contenedor.querySelector("#filtro-metodo");
  const botonFiltrar = contenedor.querySelector("#boton-filtrar");
  const botonImprimir = contenedor.querySelector("#boton-imprimir");
  const botonExcel = contenedor.querySelector("#boton-excel");
  const cuerpoTabla = contenedor.querySelector("#cuerpo-tabla-reportes");

  let pagos = await apiObtenerPagos();

  function renderizarTabla(lista) {
    if (!lista.length) {
      cuerpoTabla.innerHTML = `<tr><td colspan="5">No se encontraron pagos</td></tr>`;
      return;
    }

    cuerpoTabla.innerHTML = lista.map(p => {
      const total = (p.monto - p.descuentoAplicado).toFixed(2);
      return `
        <tr>
          <td>${new Date(p.fechaPago).toLocaleDateString("es-AR")}</td>
          <td>${p.metodoPago || "-"}</td>
          <td>$${p.monto.toFixed(2)}</td>
          <td>$${p.descuentoAplicado.toFixed(2)}</td>
          <td>$${total}</td>
        </tr>`;
    }).join("");
  }

  renderizarTabla(pagos);

  botonFiltrar.addEventListener("click", () => {
    const desde = filtroDesde.value ? new Date(filtroDesde.value) : null;
    const hasta = filtroHasta.value ? new Date(filtroHasta.value + "T23:59:59") : null;
    const metodo = filtroMetodo.value;

    const filtrados = pagos.filter(p => {
      const fechaPago = new Date(p.fechaPago);
      const okFecha = (!desde || fechaPago >= desde) && (!hasta || fechaPago <= hasta);
      const okMetodo = !metodo || p.metodoPago === metodo;
      return okFecha && okMetodo;
    });

    renderizarTabla(filtrados);
  });

  botonImprimir.addEventListener("click", () => {
    const metodoFiltro = filtroMetodo.value;
    const tituloReporte = "Reporte de Ingresos por Membresías";
    const subtitulo = metodoFiltro ? `Pagos con método: ${metodoFiltro}` : "Reporte general";
    const fechaImpresion = new Date().toLocaleDateString("es-AR");

    const tablaHTML = contenedor.querySelector("table").outerHTML;

    let total = 0;
    contenedor.querySelectorAll("tbody tr").forEach(fila => {
      const celdaTotal = fila.querySelector("td:last-child");
      if (celdaTotal) {
        const valor = parseFloat(celdaTotal.textContent.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(valor)) total += valor;
      }
    });

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${tituloReporte}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #999; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .total { margin-top: 20px; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h1>${tituloReporte}</h1>
          <h2>${subtitulo}</h2>
          <p><strong>Fecha de impresión:</strong> ${fechaImpresion}</p>
          ${tablaHTML}
          <p class="total">Monto total: $${total.toLocaleString("es-AR")}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  });

  botonExcel.addEventListener("click", () => {
    const tablaHTML = contenedor.querySelector("table").outerHTML;
    const blob = new Blob([tablaHTML], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reporte_ingresos.xls";
    a.click();
  });
}



/* ===============================
  🏋️ ASISTENCIA AL GIMNASIO
================================= */
async function renderizarReporteAsistenciaGimnasio(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <button id="volver" class="${estilos.botonVolver}">⬅️ Volver</button>
      <h2>🏋️ Reporte de Asistencia al Gimnasio</h2>
      <p>Funcionalidad en desarrollo...</p>
    </div>
  `;
  contenedor.querySelector("#volver").addEventListener("click", () => renderizarVistaReportes(contenedor));
}

/* ===============================
📅 REPORTE DE ASISTENCIA A CLASES (corregido)
================================= */
async function renderizarReporteAsistenciaClases(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <button id="volver" class="${estilos.botonVolver}">⬅️ Volver</button>
      <h2>📅 Reporte de Asistencia a Clases</h2>

      <div class="${estilos.filtros}">
        <label>Clase:</label>
        <select id="filtro-clase" class="${estilos.selectInput}">
          <option value="">Seleccione una clase</option>
        </select>

        <label>Miembro:</label>
        <select id="filtro-miembro" class="${estilos.selectInput}">
          <option value="">Todos</option>
        </select>

        <label>Desde:</label>
        <input type="date" id="filtro-desde" class="${estilos.inputFecha}">
        <label>Hasta:</label>
        <input type="date" id="filtro-hasta" class="${estilos.inputFecha}">

        <button id="boton-filtrar" class="${estilos.botonFiltrar}">🔍 Filtrar</button>
        <button id="boton-imprimir" class="${estilos.botonImprimir}">🖨️ Imprimir</button>
        <button id="boton-excel" class="${estilos.botonImprimir}">📥 Exportar Excel</button>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>DNI</th>
              <th>Clase</th>
              <th>Entrenador</th>
              <th>Fecha</th>
              <th>Asistencia</th>
            </tr>
          </thead>
          <tbody id="cuerpo-asistencias">
            <tr><td colspan="6">Seleccione una clase para ver los datos.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // referencias DOM
  const volverBtn = contenedor.querySelector("#volver");
  const selectClase = contenedor.querySelector("#filtro-clase");
  const selectMiembro = contenedor.querySelector("#filtro-miembro");
  const inputDesde = contenedor.querySelector("#filtro-desde");
  const inputHasta = contenedor.querySelector("#filtro-hasta");
  const botonFiltrar = contenedor.querySelector("#boton-filtrar");
  const botonImprimir = contenedor.querySelector("#boton-imprimir");
  const botonExcel = contenedor.querySelector("#boton-excel");
  const cuerpo = contenedor.querySelector("#cuerpo-asistencias");

  volverBtn.addEventListener("click", () => renderizarVistaReportes(contenedor));

  // traer todos los datos necesarios
  const [clasesFull, miembrosXClase, asistenciasFull, miembrosFull] = await Promise.all([
    apiObtenerClases(),          // clases con actividad y entrenador si tu api lo devuelve
    apiObtenerMiembrosXClase(),  // relaciones miembro<->clase (expandidas por api)
    apiObtenerAsistenciasCompletas(), // asistencias ya enriquecidas
    apiObtenerMiembros()
  ]);

  // --- map de clases por id para asegurarnos de tener actividad.nombre y entrenador.nombre
  const mapClases = Object.fromEntries(clasesFull.map(c => [c.id, c]));

  // llenar select miembro con todos los miembros (opcional para filtrar por nombre)
  selectMiembro.innerHTML += miembrosFull.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("");

  // llenar select de clases con actividad + hora (usa actividad si está disponible)
  clasesFull.forEach(c => {
    const actividadNombre = c.actividad?.nombre ?? (c.actividadId ? `Actividad ${c.actividadId}` : "Sin actividad");
    const entrenadorNombre = c.entrenador?.nombre ?? (c.entrenadorId ? `Entrenador ${c.entrenadorId}` : "Sin entrenador");
    const opcion = document.createElement("option");
    opcion.value = c.id;
    opcion.textContent = `${actividadNombre} - ${entrenadorNombre} (${c.horaInicio || "?"}hs)`;
    selectClase.appendChild(opcion);
  });

  // función util: obtener asistencias (array) para un miembroXClase dado
  const asistenciasPorMiembroXClase = {}; // cache map
  asistenciasFull.forEach(a => {
    const key = a.miembroXClase?.miembroXClaseId;
    if (!key) return;
    if (!asistenciasPorMiembroXClase[key]) asistenciasPorMiembroXClase[key] = [];
    asistenciasPorMiembroXClase[key].push(a);
  });

  // helper: elegir la asistencia más reciente (por fecha) de un array
  const elegirMasReciente = arr => {
    if (!arr || !arr.length) return null;
    return arr.slice().sort((A, B) => new Date(B.fecha) - new Date(A.fecha))[0];
  };

  // renderizar tabla aplicando filtros
  function renderTablaFiltrada() {
    const claseSel = selectClase.value;
    const miembroSel = selectMiembro.value;
    const desdeVal = inputDesde.value ? new Date(inputDesde.value) : null;
    const hastaVal = inputHasta.value ? new Date(inputHasta.value + "T23:59:59") : null;

    // tomar sólo miembrosXClase que coincidan con la clase seleccionada (si hay)
    let filas = miembrosXClase.slice();
    if (claseSel) filas = filas.filter(mx => String(mx.claseId ?? mx.clase?.id) === String(claseSel));
    if (miembroSel) filas = filas.filter(mx => String(mx.miembroId ?? mx.miembro?.id) === String(miembroSel));

    // construir filas
    if (!filas.length) {
      cuerpo.innerHTML = `<tr><td colspan="6">No hay registros que coincidan con los filtros.</td></tr>`;
      return;
    }

    cuerpo.innerHTML = filas.map(mx => {
      // asegurarnos de usar datos reales del mapa de clases/miembros si faltan en mx
      const claseObj = mapClases[mx.claseId] ?? mx.clase ?? null;
      const miembroObj = miembrosFull.find(m => m.id === (mx.miembroId ?? mx.miembro?.id)) ?? mx.miembro ?? null;

      // buscar asistencias (posible array). elegir la más reciente.
      const asistArray = asistenciasPorMiembroXClase[mx.id] ?? asistenciasFull.filter(a => {
        // fallback matching robusto: comparar por miembroXClaseId, o por miembro+clase si hace falta
        if (a.miembroXClase?.miembroXClaseId && mx.id) {
          return Number(a.miembroXClase.miembroXClaseId) === Number(mx.id);
        }
        // fallback: intentar emparejar por miembro id y clase id
        const aMiembroId = a.miembroXClase?.miembro?.id ?? a.miembroXClase?.miembroId;
        const aClaseId = a.miembroXClase?.clase?.claseId ?? a.miembroXClase?.claseId;
        const mxMiembroId = mx.miembroId ?? mx.miembro?.id;
        const mxClaseId = mx.claseId ?? mx.clase?.id;
        return Number(aMiembroId) === Number(mxMiembroId) && Number(aClaseId) === Number(mxClaseId);
      });

      const masReciente = elegirMasReciente(asistArray);
      // si hay fechas, chequeamos rango de filtros
      if (masReciente) {
        const f = new Date(masReciente.fecha);
        if (desdeVal && f < desdeVal) return ""; // eliminar fila (vía empty string) — será filtrada fuera
        if (hastaVal && f > hastaVal) return "";
      }

      const fechaStr = masReciente?.fecha ? new Date(masReciente.fecha).toLocaleDateString("es-AR") : "-";
      const asistenciaDesc = masReciente?.tipoDeAsistencia?.descripcion ?? "-";

      const actividadNombre = claseObj?.actividad?.nombre ?? claseObj?.actividad?.nombre ?? (claseObj?.actividadId ? `Actividad ${claseObj.actividadId}` : "Sin actividad");
      const entrenadorNombre = claseObj?.entrenador?.nombre ?? (claseObj?.entrenadorId ? `Entrenador ${claseObj.entrenadorId}` : "-");

      return `
        <tr>
          <td>${miembroObj?.nombre ?? "-"}</td>
          <td>${miembroObj?.dni ?? "-"}</td>
          <td>${actividadNombre}</td>
          <td>${entrenadorNombre}</td>
          <td>${fechaStr}</td>
          <td>${asistenciaDesc}</td>
        </tr>
      `;
    }).filter(Boolean).join("");

    // si el map devolvió filas vacías o todas filtradas por fecha -> mostrar mensaje
    if (!cuerpo.innerHTML) {
      cuerpo.innerHTML = `<tr><td colspan="6">No hay asistencias que coincidan con los filtros de fecha.</td></tr>`;
    } else {
      // deja el HTML como quedó
      cuerpo.innerHTML = cuerpo.innerHTML;
    }
  }

  // primer render (sin filtros)
  renderTablaFiltrada();

  // eventos
  botonFiltrar.addEventListener("click", renderTablaFiltrada);

  // Exportar Excel (con lo visible actualmente)
  botonExcel.addEventListener("click", () => {
    const tablaHTML = contenedor.querySelector("table").outerHTML;
    const blob = new Blob([tablaHTML], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reporte_asistencia_clases.xls";
    a.click();
  });

// ✅ Imprimir en la misma pestaña (sin abrir nueva ventana)
botonImprimir.addEventListener("click", () => {
  const claseId = selectClase.value;
  if (!claseId) {
    alert("⚠️ Seleccioná una clase antes de imprimir.");
    return;
  }

  // Buscar datos de la clase seleccionada
  const clase = clasesFull.find(c => c.id === Number(claseId));
  const actividadNombre = clase?.actividad?.nombre || "Clase sin nombre";
  const fechaImpresion = new Date().toLocaleDateString("es-AR");
  const horaInicio = clase?.horaInicio || "-";
  const horaFin = clase?.horaFin || "-";

  // Clonamos la tabla para imprimirla sin perder los estilos del resto del sistema
  const tablaHTML = contenedor.querySelector("table").outerHTML;

  // Crear ventana temporal para imprimir
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de Asistencia</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1, h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #999; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Reporte de Asistencia a Clases</h1>
        <h2>${actividadNombre}</h2>
        <p><strong>Horario:</strong> ${horaInicio} a ${horaFin}</p>
        <p><strong>Fecha de impresión:</strong> ${fechaImpresion}</p>
        ${tablaHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
});
}