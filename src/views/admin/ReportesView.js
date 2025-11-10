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
      <div class="${estilos.tituloModulo}">
        <h2>Módulo de Reportes</h2>
      </div>
      <div class="${estilos.bloquesReportesFila}">
        <button class="${estilos.bloqueMini}" id="reporte-ingresos"> Reporte de Ingresos </button>
        <button class="${estilos.bloqueMini}" id="reporte-asistencia-gimnasio">Reporte de Asistencia de socios al Gimnasio</button>
        <button class="${estilos.bloqueMini}" id="reporte-asistencia-clases">Reporte de Asistencia de socios a Clases</button>
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
  REPORTE DE INGRESOS POR MEMBRESÍAS
================================= */
async function renderizarReporteIngresos(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <h2>
        Reporte de ingresos por membresías
      </h2>

      <div class="${estilos.filtros}" style="display:flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <label>Desde:</label>
          <input type="date" id="filtro-desde" class="${estilos.inputFecha}">
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <label>Hasta:</label>
          <input type="date" id="filtro-hasta" class="${estilos.inputFecha}">
        </div>
        <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
          <label>Método:</label>
          <select id="filtro-metodo" class="${estilos.selectInput}" style="padding:4px 6px; min-width:120px;">
            <option value="">Todos</option>
          </select>
        </div>
        <button id="boton-filtrar" class="${estilos.accionIcon}" title="Ver registro" aria-label="Ver registro">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M10 2a8 8 0 106.32 12.9l4.39 4.39 1.41-1.41-4.39-4.39A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/>
          </svg>
        </button>
        <button id="boton-imprimir" class="${estilos.accionIcon}" title="Imprimir" aria-label="Imprimir">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v4h4v4h12v-4h4v-4c0-1.66-1.34-3-3-3zm-3 9H8v-5h8v5zM18 3H6v4h12V3z"/>
          </svg>
        </button>
        <button id="boton-excel" class="${estilos.accionIcon}" title="Exportar Excel" aria-label="Exportar Excel">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M19 2H8c-1.1 0-2 .9-2 2v3h2V4h11v16H8v-3H6v3c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            <path d="M10 9l-4 3 4 3v-2h4v-2h-4V9z"/>
          </svg>
        </button>
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
              <th>Fecha de emision</th>
              <th>Pago total</th>
              <th>Método de pago</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla-reportes">
            <tr><td colspan="9">Cargando pagos...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="${estilos.paginacion}">
        <button id="prev-ingresos" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-ingresos">Mostrando 0–0 de 0 | Página 1 de 1</span>
        <button id="next-ingresos" class="${estilos.botonPagina}" disabled>Siguiente</button>
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

  // llenar select de métodos, excluyendo "Transferencia" y "Tarjeta"
  const metodosUnicos = [...new Set(
    pagos.map(p => p.metodoDescripcion)
        .filter(m => m && m !== "Transferencia" && m !== "Tarjeta")
  )];
  metodosUnicos.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    filtroMetodo.appendChild(opt);
  });

  // preparar datos combinados (normalizamos fecha a yyyy-mm-dd local)
  const aYmd = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const datosCombinados = pagos.map((p, idx) => ({
    numeroTransaccion: `T-${String(idx + 1).padStart(4, "0")}`,
    documento: p.miembroDocumento ?? "-",
    miembro: p.miembroNombre ?? "-",
    plan: p.planNombre ?? "-",
    monto: Number(p.monto ?? 0),
    descuento: Number(p.descuentoAplicado ?? 0),
    fechaYmd: aYmd(p.fechaPago),
    fecha: p.fechaPago ? new Date(p.fechaPago).toLocaleDateString("es-AR") : "-",
    total: Number(p.pagoTotal ?? (p.monto - (p.descuentoAplicado ?? 0))),
    metodo: p.metodoDescripcion ?? "No definido"
  }));

  // Paginación
  let paginaIng = 1;
  let porPaginaIng = 5;
  let cacheFiltradosIng = [];

  const btnPrevIng = contenedor.querySelector('#prev-ingresos');
  const btnNextIng = contenedor.querySelector('#next-ingresos');
  const indicadorIng = contenedor.querySelector('#indicador-ingresos');

  const renderPaginaIngresos = () => {
    const total = cacheFiltradosIng.length;
    const totalPag = Math.max(1, Math.ceil(total / porPaginaIng));
    if (paginaIng > totalPag) paginaIng = totalPag;
    const ini = (paginaIng - 1) * porPaginaIng;
    const fin = Math.min(ini + porPaginaIng, total);
    const vista = cacheFiltradosIng.slice(ini, fin);
    cuerpoTabla.innerHTML = vista.map((d, idx) => `
      <tr>
        <td>T-${String(ini + idx + 1).padStart(4,"0")}</td>
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
    indicadorIng.textContent = `Mostrando ${total ? ini + 1 : 0}–${fin} de ${total} | Página ${paginaIng} de ${totalPag}`;
    btnPrevIng.disabled = paginaIng <= 1;
    btnNextIng.disabled = paginaIng >= totalPag;
  };

  const renderizarTabla = () => {
    const desdeYmd = filtroDesde.value || null; // yyyy-mm-dd
    const hastaYmd = filtroHasta.value || null; // yyyy-mm-dd
    const metodo = filtroMetodo.value;

    cacheFiltradosIng = datosCombinados.filter(d => {
      if (!d.fechaYmd) return false; // solo registros con fecha válida
      const fechaOk = (!desdeYmd || d.fechaYmd >= desdeYmd) && (!hastaYmd || d.fechaYmd <= hastaYmd);
      const metodoOk = metodo ? d.metodo === metodo : true;
      return fechaOk && metodoOk;
    });

    if (!cacheFiltradosIng.length) {
      cuerpoTabla.innerHTML = `<tr><td colspan="9">No hay pagos para mostrar</td></tr>`;
      indicadorIng.textContent = `Mostrando 0–0 de 0 | Página 1 de 1`;
      btnPrevIng.disabled = true;
      btnNextIng.disabled = true;
      return;
    }

    paginaIng = 1;
    renderPaginaIngresos();
  };

  renderizarTabla();
  contenedor.querySelector("#boton-filtrar").addEventListener("click", renderizarTabla);
  btnPrevIng.addEventListener('click', () => { if (paginaIng > 1) { paginaIng--; renderPaginaIngresos(); } });
  btnNextIng.addEventListener('click', () => { paginaIng++; renderPaginaIngresos(); });

  // Exportar a Excel
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

  // Imprimir
contenedor.querySelector("#boton-imprimir").addEventListener("click", () => {
  const tablaHtml = contenedor.querySelector("table").outerHTML;
  const fechaActual = new Date().toLocaleDateString("es-AR");

  const estiloTabla = `
    <style>
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #000; padding: 4px; text-align: left; }
      th { background-color: #f2f2f2; }
      h2 { font-family: Arial, sans-serif; }
      p { font-family: Arial, sans-serif; }
    </style>
  `;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Reporte de Pagos</title>
        ${estiloTabla}
      </head>
      <body>
        <h2>Reporte de ingresos por membresías</h2>
        <p>Fecha de impresión: ${fechaActual}</p>
        ${tablaHtml}
        <script>
          window.onload = () => {
            window.print();
            window.close(); // cierra la pestaña después de imprimir
          }
        </script>
      </body>
    </html>
  `);
  win.document.close();
});


}

/* ===============================
  🏋️ REPORTE DE ASISTENCIA AL GIMNASIO
================================= */
async function renderizarReporteAsistenciaGimnasio(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <h2>Reporte de Asistencia al Gimnasio</h2>
      <div class="${estilos.filtros}">
        <label>Miembro:</label>
        <select id="filtro-miembro" class="${estilos.selectInput}">
          <option value="">Todos</option>
        </select>
        <label>Desde:</label>
        <input type="date" id="filtro-desde" class="${estilos.inputFecha}">
        <label>Hasta:</label>
        <input type="date" id="filtro-hasta" class="${estilos.inputFecha}">
        <button id="boton-filtrar" class="${estilos.accionIcon}" title="Ver registro" aria-label="Ver registro">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M10 2a8 8 0 106.32 12.9l4.39 4.39 1.41-1.41-4.39-4.39A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/>
          </svg>
        </button>
        <button id="boton-imprimir" class="${estilos.accionIcon}" title="Imprimir" aria-label="Imprimir">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v4h4v4h12v-4h4v-4c0-1.66-1.34-3-3-3zm-3 9H8v-5h8v5zM18 3H6v4h12V3z"/>
          </svg>
        </button>
        <button id="boton-excel" class="${estilos.accionIcon}" title="Exportar Excel" aria-label="Exportar Excel">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M19 2H8c-1.1 0-2 .9-2 2v3h2V4h11v16H8v-3H6v3c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            <path d="M10 9l-4 3 4 3v-2h4v-2h-4V9z"/>
          </svg>
        </button>
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

  const [asistenciasGym, miembrosFull] = await Promise.all([
    apiObtenerAsistenciasGenerales(),
    apiObtenerMiembros()
  ]);

  // Enriquecer asistencias generales con datos del miembro
  const asistenciasEnriquecidas = asistenciasGym.map(a => {
    const m = miembrosFull.find(mm => String(mm.id) === String(a.miembroId));
    return { ...a, miembro: m || null };
  });

  // llenar select de miembros
  selectMiembro.innerHTML += miembrosFull.map(m => `<option value="${m.id}">${`${m.nombre} ${m.apellidos || m.apellido || ""}`.trim()}</option>`).join("");

  function renderTabla() {
    const miembroSel = selectMiembro.value;
    const desdeVal = inputDesde.value ? new Date(inputDesde.value) : null;
    const hastaVal = inputHasta.value ? new Date(inputHasta.value + "T23:59:59") : null;

    let filtradas = asistenciasEnriquecidas.slice(); // todas son de gimnasio
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

    cuerpo.innerHTML = filtradas.map(a => {
      const nombreCompleto = a.miembro ? `${a.miembro.nombre || ""} ${a.miembro.apellidos || a.miembro.apellido || ""}`.trim() : "-";
      const dni = a.miembro?.dni ?? "-";
      return `
        <tr>
          <td>${nombreCompleto || "-"}</td>
          <td>${dni}</td>
          <td>${new Date(a.fecha).toLocaleDateString("es-AR")}</td>
          <td>${a.tipoDeAsistenciaId ? (/* descripcion no disponible aquí */ "Presente") : (a.tipoDeAsistencia?.descripcion ?? "-")}</td>
        </tr>
      `;
    }).join("");
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

/* ===============================
  🏋️ REPORTE DE ASISTENCIA A CLASE
================================= */
async function renderizarReporteAsistenciaClases(contenedor) {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <h2>Reporte de Asistencia a Clases</h2>
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
        <button id="boton-filtrar" class="${estilos.accionIcon}" title="Ver registro" aria-label="Ver registro">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M10 2a8 8 0 106.32 12.9l4.39 4.39 1.41-1.41-4.39-4.39A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/>
          </svg>
        </button>
        <button id="boton-imprimir" class="${estilos.accionIcon}" title="Imprimir" aria-label="Imprimir">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v4h4v4h12v-4h4v-4c0-1.66-1.34-3-3-3zm-3 9H8v-5h8v5zM18 3H6v4h12V3z"/>
          </svg>
        </button>
        <button id="boton-excel" class="${estilos.accionIcon}" title="Exportar Excel" aria-label="Exportar Excel">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M19 2H8c-1.1 0-2 .9-2 2v3h2V4h11v16H8v-3H6v3c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            <path d="M10 9l-4 3 4 3v-2h4v-2h-4V9z"/>
          </svg>
        </button>
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
            <tr><td colspan="6">Seleccione una clase para ver registros.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const selectClase = contenedor.querySelector("#filtro-clase");
  const selectMiembro = contenedor.querySelector("#filtro-miembro");
  const inputDesde = contenedor.querySelector("#filtro-desde");
  const inputHasta = contenedor.querySelector("#filtro-hasta");
  const botonFiltrar = contenedor.querySelector("#boton-filtrar");
  const botonImprimir = contenedor.querySelector("#boton-imprimir");
  const botonExcel = contenedor.querySelector("#boton-excel");
  const cuerpo = contenedor.querySelector("#cuerpo-asistencias");

  // Datos
  const [clasesFull, miembrosXClase, asistenciasFull, miembrosFull] = await Promise.all([
    apiObtenerClases(),
    apiObtenerMiembrosXClase(),
    apiObtenerAsistenciasCompletas(),
    apiObtenerMiembros()
  ]);

  // Llenar select de clases
  clasesFull.forEach(c => {
    const actividadNombre = c.actividad?.nombre ?? `Actividad ${c.actividadId ?? "?"}`;
    const entrenadorNombre = c.entrenador?.nombre ?? `Entrenador ${c.entrenadorId ?? "?"}`;
    const opcion = document.createElement("option");
    opcion.value = c.id;
    opcion.textContent = `${actividadNombre} - ${entrenadorNombre} (${c.horaInicio || "?"}hs)`;
    selectClase.appendChild(opcion);
  });

  // Preparar asistencias por miembroXClase
  const asistenciasPorMiembroXClase = {};
  asistenciasFull.forEach(a => {
    const key = a.miembroXClase?.miembroXClaseId;
    if (!key) return;
    if (!asistenciasPorMiembroXClase[key]) asistenciasPorMiembroXClase[key] = [];
    asistenciasPorMiembroXClase[key].push(a);
  });

  const elegirMasReciente = arr => arr?.length ? arr.slice().sort((A,B)=>new Date(B.fecha)-new Date(A.fecha))[0] : null;

  // Actualiza select de miembros cuando se elige clase
  selectClase.addEventListener("change", () => {
    const claseSel = selectClase.value;
    let miembrosParaClase = miembrosXClase.slice();
    if (claseSel) miembrosParaClase = miembrosParaClase.filter(mx => String(mx.claseId ?? mx.clase?.id) === String(claseSel));
    // Mapear a miembros completos
    let miembrosOpciones = miembrosParaClase.map(mx => {
      const m = miembrosFull.find(mi => mi.id === (mx.miembroId ?? mx.miembro?.id));
      return m ? {id: m.id, nombreCompleto: `${m.nombre} ${m.apellido ?? ""}`.trim()} : null;
    }).filter(Boolean);
    // Ordenar alfabéticamente
    miembrosOpciones.sort((a,b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    // Llenar select
    selectMiembro.innerHTML = `<option value="">Todos</option>`;
    miembrosOpciones.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.nombreCompleto;
      selectMiembro.appendChild(opt);
    });

    // Limpiar tabla hasta filtrar
    cuerpo.innerHTML = `<tr><td colspan="6">Seleccione un miembro o presione Filtrar para ver registros.</td></tr>`;
  });

  function renderTablaFiltrada() {
    const claseSel = selectClase.value;
    if (!claseSel) {
      cuerpo.innerHTML = `<tr><td colspan="6">Seleccione una clase para ver registros.</td></tr>`;
      return;
    }

    const miembroSel = selectMiembro.value;
    const desdeVal = inputDesde.value ? new Date(inputDesde.value) : null;
    const hastaVal = inputHasta.value ? new Date(inputHasta.value + "T23:59:59") : null;

    let filas = miembrosXClase.slice().filter(mx => String(mx.claseId ?? mx.clase?.id) === String(claseSel));
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
          <td>${miembroObj?.nombre ?? "-"} ${miembroObj?.apellido ?? ""}</td>
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
  const tablaHtml = contenedor.querySelector("table").outerHTML;
  const fechaActual = new Date().toLocaleDateString("es-AR");

  // Crear ventana temporal para impresión
  const printWindow = window.open("", "_blank", "width=900,height=700");
  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de Asistencias</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 6px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Reporte de Asistencia a Clases</h2>
        <p>Fecha de impresión: ${fechaActual}</p>
        ${tablaHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
});
}
