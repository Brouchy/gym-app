import estilos from "./ReportesView.module.css";
import { apiObtenerPagos } from "../../api/apiPago.js";
import { apiObtenerClases } from "../../api/apiClases.js";
import { apiObtenerMiembros } from "../../api/membersApi.js";
import { apiObtenerMiembrosXClase } from "../../api/apiMiembroxClase.js";
import { apiObtenerAsistenciasCompletas } from "../../api/apiAsistencias.js";
import ExcelJS from "exceljs";

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

  contenedor.querySelector("#reporte-ingresos")
    .addEventListener("click", () => renderizarReporteIngresos(contenedorReporte));

  contenedor.querySelector("#reporte-asistencia-gimnasio")
    .addEventListener("click", () => renderizarReporteAsistenciaGimnasio(contenedorReporte));

  contenedor.querySelector("#reporte-asistencia-clases")
    .addEventListener("click", () => renderizarReporteAsistenciaClases(contenedorReporte));

  // mostrar por defecto el reporte de ingresos
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
        </select>
        <button id="boton-filtrar" class="${estilos.botonFiltrar}">🔍 Ver Registro</button>
        <button id="boton-imprimir" class="${estilos.botonImprimir}">🖨️ Imprimir</button>
        <button id="boton-excel" class="${estilos.botonImprimir}">📥 Exportar Excel</button>
      </div>
      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>N° Transacción</th>
              <th>N° Documento</th>
              <th>Miembro</th>
              <th>Plan</th>
              <th>Monto</th>
              <th>Descuento aplicado</th>
              <th>Fecha de cobro</th>
              <th>Pago total</th>
              <th>Método de pago</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla-reportes">
            <tr><td colspan="9">Cargando pagos...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const cuerpoTabla = contenedor.querySelector("#cuerpo-tabla-reportes");
  const filtroDesde = contenedor.querySelector("#filtro-desde");
  const filtroHasta = contenedor.querySelector("#filtro-hasta");
  const filtroMetodo = contenedor.querySelector("#filtro-metodo");

  let pagos = [];
  try {
    pagos = await apiObtenerPagos();
  } catch (err) {
    console.error("Error obteniendo pagos:", err);
    cuerpoTabla.innerHTML = `<tr><td colspan="9">Error al cargar datos.</td></tr>`;
    return;
  }

  const metodosUnicos = [...new Set(pagos.map(p => p.metodoDescripcion).filter(Boolean))];
  metodosUnicos.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    filtroMetodo.appendChild(opt);
  });

  const datosCombinados = pagos.map(p => ({
    numeroTransaccion: p.numeroTransaccion ?? `T-${String(p.id).padStart(4, "0")}`,
    documento: p.miembroDocumento ?? "-",
    miembro: p.miembroNombre ?? "-",
    plan: p.planNombre ?? "-",
    monto: Number(p.monto ?? 0),
    descuento: Number(p.descuentoAplicado ?? 0),
    fechaObj: p.fechaPago ? new Date(p.fechaPago) : null,
    fecha: p.fechaPago ? new Date(p.fechaPago).toLocaleDateString("es-AR") : "-",
    total: Number(p.pagoTotal ?? (p.monto - (p.descuentoAplicado ?? 0))),
    metodo: p.metodoDescripcion ?? "No definido"
  }));  

  const renderizarTabla = () => {
    const desde = filtroDesde.value ? new Date(filtroDesde.value) : null;
    const hasta = filtroHasta.value ? new Date(filtroHasta.value) : null;
    const metodo = filtroMetodo.value;

    const filtrados = datosCombinados.filter(d => {
      const fechaOk = d.fechaObj ? (!desde || d.fechaObj >= desde) && (!hasta || d.fechaObj <= hasta) : true;
      const metodoOk = metodo ? d.metodo === metodo : true;
      return fechaOk && metodoOk;
    });

    if (!filtrados.length) {
      cuerpoTabla.innerHTML = `<tr><td colspan="9">No hay pagos para mostrar</td></tr>`;
      return;
    }

    cuerpoTabla.innerHTML = filtrados.map(d => `
      <tr>
        <td>${d.numeroTransaccion}</td>
        <td>${d.documento}</td>
        <td>${d.miembro}</td>
        <td>${d.plan}</td>
        <td>$${d.monto.toLocaleString()}</td>
        <td>${d.descuento ? `$${d.descuento.toLocaleString()}` : "No aplica"}</td>
        <td>${d.fecha}</td>
        <td>$${d.total.toLocaleString()}</td>
        <td>${d.metodo}</td>
      </tr>
    `).join("");
  };

  renderizarTabla();
  contenedor.querySelector("#boton-filtrar").addEventListener("click", renderizarTabla);

  contenedor.querySelector("#boton-excel").addEventListener("click", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Pagos");
    sheet.addRow(["N° Transacción", "N° Documento", "Miembro", "Plan", "Monto", "Descuento aplicado", "Fecha de cobro", "Pago total", "Método de pago"]);
    datosCombinados.forEach(d => sheet.addRow([d.numeroTransaccion, d.documento, d.miembro, d.plan, d.monto, d.descuento, d.fecha, d.total, d.metodo]));
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_pagos.xlsx";
    link.click();
  });

  contenedor.querySelector("#boton-imprimir").addEventListener("click", () => {
    const tablaHtml = contenedor.querySelector("table").outerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Reporte de Pagos</title></head><body><h2>💰 Reporte de ingresos por membresías</h2>${tablaHtml}</body></html>`);
    win.document.close();
    win.print();
  });
}

/* ===============================
  🏋️ REPORTE DE ASISTENCIA AL GIMNASIO
================================= */
async function renderizarReporteAsistenciaGimnasio(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <h2>🏋️ Reporte de Asistencia al Gimnasio</h2>
      <div class="${estilos.filtros}">
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
              <th>Fecha</th>
              <th>Asistencia</th>
            </tr>
          </thead>
          <tbody id="cuerpo-asistencias-gimnasio">
            <tr><td colspan="4">Cargando asistencias...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const selectMiembro = contenedor.querySelector("#filtro-miembro");
  const inputDesde = contenedor.querySelector("#filtro-desde");
  const inputHasta = contenedor.querySelector("#filtro-hasta");
  const botonFiltrar = contenedor.querySelector("#boton-filtrar");
  const botonImprimir = contenedor.querySelector("#boton-imprimir");
  const botonExcel = contenedor.querySelector("#boton-excel");
  const cuerpo = contenedor.querySelector("#cuerpo-asistencias-gimnasio");

  const [asistenciasFull, miembrosFull] = await Promise.all([
    apiObtenerAsistenciasCompletas(),
    apiObtenerMiembros()
  ]);

  // llenar select de miembros
  selectMiembro.innerHTML += miembrosFull.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("");

  function renderTabla() {
    const miembroSel = selectMiembro.value;
    const desdeVal = inputDesde.value ? new Date(inputDesde.value) : null;
    const hastaVal = inputHasta.value ? new Date(inputHasta.value + "T23:59:59") : null;

    let filtradas = asistenciasFull.filter(a => a.tipo === "gimnasio"); // solo gimnasio
    if (miembroSel) filtradas = filtradas.filter(a => String(a.miembro?.id) === String(miembroSel));
    filtradas = filtradas.filter(a => {
      const f = new Date(a.fecha);
      if (desdeVal && f < desdeVal) return false;
      if (hastaVal && f > hastaVal) return false;
      return true;
    });

    if (!filtradas.length) {
      cuerpo.innerHTML = `<tr><td colspan="4">No hay registros que coincidan con los filtros.</td></tr>`;
      return;
    }

    cuerpo.innerHTML = filtradas.map(a => `
      <tr>
        <td>${a.miembro?.nombre ?? "-"}</td>
        <td>${a.miembro?.dni ?? "-"}</td>
        <td>${new Date(a.fecha).toLocaleDateString("es-AR")}</td>
        <td>${a.tipoDeAsistencia?.descripcion ?? "-"}</td>
      </tr>
    `).join("");
  }

  renderTabla();
  botonFiltrar.addEventListener("click", renderTabla);

  botonExcel.addEventListener("click", () => {
    const tablaHTML = contenedor.querySelector("table").outerHTML;
    const blob = new Blob([tablaHTML], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reporte_asistencia_gimnasio.xls";
    a.click();
  });

  botonImprimir.addEventListener("click", () => {
    const fechaImpresion = new Date().toLocaleDateString("es-AR");
    const tablaHTML = contenedor.querySelector("table").outerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Asistencia al Gimnasio</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #999; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Reporte de Asistencia al Gimnasio</h1>
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


async function renderizarReporteAsistenciaClases(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <h2>📅 Reporte de Asistencia a Clases</h2>
      <div class="${estilos.filtros}">
        <label>Clase:</label>
        <select id="filtro-clase" class="${estilos.selectInput}">
          <option value="">Todas</option>
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
            <tr><td colspan="6">Cargando datos...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Obtener referencias después de renderizar
  const selectClase = contenedor.querySelector("#filtro-clase");
  const selectMiembro = contenedor.querySelector("#filtro-miembro");
  const inputDesde = contenedor.querySelector("#filtro-desde");
  const inputHasta = contenedor.querySelector("#filtro-hasta");
  const botonFiltrar = contenedor.querySelector("#boton-filtrar");
  const botonImprimir = contenedor.querySelector("#boton-imprimir");
  const botonExcel = contenedor.querySelector("#boton-excel");
  const cuerpo = contenedor.querySelector("#cuerpo-asistencias");

  // Obtener datos
  const [clasesFull, miembrosXClase, asistenciasFull, miembrosFull] = await Promise.all([
    apiObtenerClases(),
    apiObtenerMiembrosXClase(),
    apiObtenerAsistenciasCompletas(),
    apiObtenerMiembros()
  ]);

  // Llenar select de miembros
  selectMiembro.innerHTML += miembrosFull.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("");

  // Llenar select de clases
  clasesFull.forEach(c => {
    const actividadNombre = c.actividad?.nombre ?? `Actividad ${c.actividadId ?? "?"}`;
    const entrenadorNombre = c.entrenador?.nombre ?? `Entrenador ${c.entrenadorId ?? "?"}`;
    const opcion = document.createElement("option");
    opcion.value = c.id;
    opcion.textContent = `${actividadNombre} - ${entrenadorNombre} (${c.horaInicio || "?"}hs)`;
    selectClase.appendChild(opcion);
  });

  // Preparar datos de asistencia
  const asistenciasPorMiembroXClase = {};
  asistenciasFull.forEach(a => {
    const key = a.miembroXClase?.miembroXClaseId;
    if (!key) return;
    if (!asistenciasPorMiembroXClase[key]) asistenciasPorMiembroXClase[key] = [];
    asistenciasPorMiembroXClase[key].push(a);
  });

  const elegirMasReciente = arr => arr?.length ? arr.slice().sort((A,B)=>new Date(B.fecha)-new Date(A.fecha))[0] : null;

  function renderTablaFiltrada() {
    const claseSel = selectClase.value;
    const miembroSel = selectMiembro.value;
    const desdeVal = inputDesde.value ? new Date(inputDesde.value) : null;
    const hastaVal = inputHasta.value ? new Date(inputHasta.value + "T23:59:59") : null;

    let filas = miembrosXClase.slice();
    if (claseSel) filas = filas.filter(mx => String(mx.claseId ?? mx.clase?.id) === String(claseSel));
    if (miembroSel) filas = filas.filter(mx => String(mx.miembroId ?? mx.miembro?.id) === String(miembroSel));

    if (!filas.length) {
      cuerpo.innerHTML = `<tr><td colspan="6">No hay registros que coincidan con los filtros.</td></tr>`;
      return;
    }

    cuerpo.innerHTML = filas.map(mx => {
      const claseObj = clasesFull.find(c => c.id === (mx.claseId ?? mx.clase?.id));
      const miembroObj = miembrosFull.find(m => m.id === (mx.miembroId ?? mx.miembro?.id));
      const asistArray = asistenciasPorMiembroXClase[mx.id] ?? [];
      const masReciente = elegirMasReciente(asistArray);
      if (masReciente) {
        const f = new Date(masReciente.fecha);
        if (desdeVal && f < desdeVal) return "";
        if (hastaVal && f > hastaVal) return "";
      }
      const fechaStr = masReciente?.fecha ? new Date(masReciente.fecha).toLocaleDateString("es-AR") : "-";
      const asistenciaDesc = masReciente?.tipoDeAsistencia?.descripcion ?? "-";
      const actividadNombre = claseObj?.actividad?.nombre ?? "-";
      const entrenadorNombre = claseObj?.entrenador?.nombre ?? "-";
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

    if (!cuerpo.innerHTML) {
      cuerpo.innerHTML = `<tr><td colspan="6">No hay asistencias que coincidan con los filtros de fecha.</td></tr>`;
    }
  }

  renderTablaFiltrada();
  botonFiltrar.addEventListener("click", renderTablaFiltrada);

  botonExcel.addEventListener("click", () => {
    const tablaHTML = contenedor.querySelector("table").outerHTML;
    const blob = new Blob([tablaHTML], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reporte_asistencia_clases.xls";
    a.click();
  });

  botonImprimir.addEventListener("click", () => {
    const tablaHTML = contenedor.querySelector("table").outerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Reporte de Asistencia</title></head>
        <body>${tablaHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  });
}
