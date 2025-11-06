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

  // Cargar datos con validación
  try {
    const pagos = await apiObtenerPagos() || [];
    const membresias = await apiObtenerMembresias() || [];
    const miembros = await apiObtenerMiembros() || [];
    const membresiasXMiembros = await apiObtenerMembresiasXMiembros() || [];

    // Validar que sean arrays
    if (!Array.isArray(pagos)) {
      console.error('apiObtenerPagos no retornó un array:', pagos);
      throw new Error('Error al cargar los pagos');
    }
    if (!Array.isArray(membresias)) {
      console.error('apiObtenerMembresias no retornó un array:', membresias);
      throw new Error('Error al cargar las membresías');
    }
    if (!Array.isArray(miembros)) {
      console.error('apiObtenerMiembros no retornó un array:', miembros);
      throw new Error('Error al cargar los miembros');
    }
    if (!Array.isArray(membresiasXMiembros)) {
      console.error('apiObtenerMembresiasXMiembros no retornó un array:', membresiasXMiembros);
      throw new Error('Error al cargar las relaciones de membresías');
    }

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
  } catch (error) {
    console.error('Error al cargar reportes:', error);
    const cuerpo = contenedor.querySelector("#cuerpo-tabla-reportes");
    if (cuerpo) {
      cuerpo.innerHTML = `<tr><td colspan="7">Error al cargar los datos: ${error.message}</td></tr>`;
    }
  }

  const botonFiltrar = contenedor.querySelector("#boton-filtrar");
  const botonPrev = contenedor.querySelector("#boton-prev");
  const botonNext = contenedor.querySelector("#boton-next");

  if (botonFiltrar) {
    botonFiltrar.addEventListener("click", () => {
      aplicarFiltros(contenedor);
    });
  }

  if (botonPrev) {
    botonPrev.addEventListener("click", () => {
      paginaActual--;
      renderizarTabla(contenedor, listaReportes);
    });
  }

  if (botonNext) {
    botonNext.addEventListener("click", () => {
      paginaActual++;
      renderizarTabla(contenedor, listaReportes);
    });
  }
};

function aplicarFiltros(contenedor) {
  const desdeInput = contenedor.querySelector("#filtro-desde");
  const hastaInput = contenedor.querySelector("#filtro-hasta");
  const metodoInput = contenedor.querySelector("#filtro-metodo");

  if (!desdeInput || !hastaInput || !metodoInput) {
    console.error('Elementos de filtro no encontrados');
    return;
  }

  const desde = desdeInput.value;
  const hasta = hastaInput.value;
  const metodo = metodoInput.value;

  // Validar que listaReportes sea un array
  if (!Array.isArray(listaReportes)) {
    console.error('listaReportes no es un array:', listaReportes);
    listaReportes = [];
  }

  let filtrados = [...listaReportes];

  if (metodo) {
    filtrados = filtrados.filter(r => r.metodo === metodo);
  }

  if (desde) {
    try {
      const d = new Date(desde);
      filtrados = filtrados.filter(r => {
        if (!r.fecha) return false;
        const fechaR = new Date(r.fecha);
        return !isNaN(fechaR.getTime()) && fechaR >= d;
      });
    } catch (error) {
      console.error('Error al filtrar por fecha desde:', error);
    }
  }

  if (hasta) {
    try {
      const h = new Date(hasta);
      filtrados = filtrados.filter(r => {
        if (!r.fecha) return false;
        const fechaR = new Date(r.fecha);
        return !isNaN(fechaR.getTime()) && fechaR <= h;
      });
    } catch (error) {
      console.error('Error al filtrar por fecha hasta:', error);
    }
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

  // Validar que los elementos existan
  if (!cuerpo || !indicador || !btnPrev || !btnNext || !resumen) {
    console.error('Elementos del DOM no encontrados en renderizarTabla');
    return;
  }

  // Validar que lista sea un array
  if (!Array.isArray(lista)) {
    console.error('lista no es un array:', lista);
    cuerpo.innerHTML = `<tr><td colspan="7">Error: Datos inválidos</td></tr>`;
    resumen.textContent = "";
    return;
  }

  if (lista.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="7">No hay pagos registrados.</td></tr>`;
    resumen.textContent = "";
    indicador.textContent = "Página 0 de 0";
    btnPrev.disabled = true;
    btnNext.disabled = true;
    return;
  }

  const totalPaginas = Math.ceil(lista.length / FILAS_POR_PAGINA);
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const pagina = lista.slice(inicio, fin);

  cuerpo.innerHTML = "";
  pagina.forEach(r => {
    const fila = document.createElement("tr");
    const fecha = r.fecha ? new Date(r.fecha).toLocaleDateString() : '—';
    const monto = typeof r.monto === 'number' ? r.monto : 0;
    const descuento = typeof r.descuento === 'number' ? r.descuento : 0;
    const total = typeof r.total === 'number' ? r.total : monto - descuento;
    
    fila.innerHTML = `
      <td>${fecha}</td>
      <td>${r.miembro || '—'}</td>
      <td>${r.membresia || '—'}</td>
      <td>${r.metodo || '—'}</td>
      <td>$${monto.toLocaleString()}</td>
      <td>$${descuento.toLocaleString()}</td>
      <td>$${total.toLocaleString()}</td>
    `;
    cuerpo.appendChild(fila);
  });

  indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas || totalPaginas === 0;

  const totalPagado = lista.reduce((acc, r) => {
    const total = typeof r.total === 'number' ? r.total : 0;
    return acc + total;
  }, 0);
  resumen.textContent = `💰 Total cobrado: $${totalPagado.toLocaleString()} (${lista.length} transacciones)`;
}
