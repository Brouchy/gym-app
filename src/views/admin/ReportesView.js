import estilos from "./ReportesView.module.css";
import { apiObtenerPagos } from "../../api/apiPago.js";
import { apiObtenerMembresias } from "../../api/membershipApi.js";
import { apiObtenerMiembros } from "../../api/membersApi.js";
import { apiObtenerMembresiasXMiembros } from "../../api/membershipApi.js";

let listaReportes = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 6;

export const renderizarVistaReportes = async (contenedor) => {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
        <h2>Reporte de Pagos Recibidos</h2>
      <div class="${estilos.cabecera}">

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

          <button id="boton-filtrar" class="${estilos.botonFiltrar}">Filtrar</button>
        </div>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Miembro</th>
              <th>Membresía</th>
              <th>Método</th>
              <th>Monto</th>
              <th>Descuento</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla-reportes">
            <tr><td colspan="7">Cargando pagos...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="${estilos.resumen}">
        <p id="resumen-total"></p>
      </div>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Página 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>
    </div>
  `;

  // Cargar datos
  const pagos = await apiObtenerPagos();
  const membresias = await apiObtenerMembresias();
  const miembros = await apiObtenerMiembros();
  const membresiasXMiembros = await apiObtenerMembresiasXMiembros();

  listaReportes = pagos.map(pago => {
    const relacion = membresiasXMiembros.find(r => r.pagoId === pago.id);
    const miembro = miembros.find(m => m.id === relacion?.miembroId);
    const membresia = membresias.find(m => m.id === relacion?.membresiaId);

    return {
      id: pago.id,
      fecha: pago.fechaPago,
      metodo: pago.metodoPago,
      monto: pago.monto || 0,
      descuento: pago.descuentoAplicado || 0,
      total: (pago.monto || 0) - (pago.descuentoAplicado || 0),
      miembro: miembro?.nombre || "—",
      membresia: membresia?.nombrePlan || "—"
    };
  });

  renderizarTabla(contenedor, listaReportes);

  contenedor.querySelector("#boton-filtrar").addEventListener("click", () => {
    aplicarFiltros(contenedor);
  });

  contenedor.querySelector("#boton-prev").addEventListener("click", () => {
    paginaActual--;
    renderizarTabla(contenedor, listaReportes);
  });

  contenedor.querySelector("#boton-next").addEventListener("click", () => {
    paginaActual++;
    renderizarTabla(contenedor, listaReportes);
  });
};

function aplicarFiltros(contenedor) {
  const desde = contenedor.querySelector("#filtro-desde").value;
  const hasta = contenedor.querySelector("#filtro-hasta").value;
  const metodo = contenedor.querySelector("#filtro-metodo").value;

  let filtrados = [...listaReportes];

  if (metodo) filtrados = filtrados.filter(r => r.metodo === metodo);

  if (desde) {
    const d = new Date(desde);
    filtrados = filtrados.filter(r => new Date(r.fecha) >= d);
  }

  if (hasta) {
    const h = new Date(hasta);
    filtrados = filtrados.filter(r => new Date(r.fecha) <= h);
  }

  paginaActual = 1;
  renderizarTabla(contenedor, filtrados);
}

function renderizarTabla(contenedor, lista) {
  const cuerpo = contenedor.querySelector("#cuerpo-tabla-reportes");
  const indicador = contenedor.querySelector("#indicador-pagina");
  const btnPrev = contenedor.querySelector("#boton-prev");
  const btnNext = contenedor.querySelector("#boton-next");
  const resumen = contenedor.querySelector("#resumen-total");

  if (!lista || lista.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="7">No hay pagos registrados.</td></tr>`;
    resumen.textContent = "";
    return;
  }

  const totalPaginas = Math.ceil(lista.length / FILAS_POR_PAGINA);
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML = "";
  pagina.forEach(r => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${new Date(r.fecha).toLocaleDateString()}</td>
      <td>${r.miembro}</td>
      <td>${r.membresia}</td>
      <td>${r.metodo}</td>
      <td>$${r.monto.toLocaleString()}</td>
      <td>$${r.descuento.toLocaleString()}</td>
      <td>$${r.total.toLocaleString()}</td>
    `;
    cuerpo.appendChild(fila);
  });

  indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas;

  const totalPagado = lista.reduce((acc, r) => acc + r.total, 0);
  resumen.textContent = `💰 Total cobrado: $${totalPagado.toLocaleString()} (${lista.length} transacciones)`;
}
