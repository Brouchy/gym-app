import estilos from "./ClasesView.module.css";
import { apiObtenerClases } from "../../../api/apiClases.js";

let listaClases = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 6;
const COLUMNAS_TABLA = 7;

const marcarListenersRegistrados = (contenedor) => {
  if (contenedor.dataset.clasesConsultaListeners === "true") return false;
  contenedor.dataset.clasesConsultaListeners = "true";
  return true;
};

const manejarInput = (e) => {
  const contenedor = e.currentTarget;
  if (contenedor.dataset.vistaActiva !== "consulta") return;
  if (!e.target.closest('[data-clases-consulta="true"]')) return;

  if (e.target.matches("#buscador")) {
    paginaActual = 1;
    renderizarTabla(contenedor);
  }
};

const manejarClick = (e) => {
  const contenedor = e.currentTarget;
  if (contenedor.dataset.vistaActiva !== "consulta") return;
  if (!e.target.closest('[data-clases-consulta="true"]')) return;

  if (e.target.matches("#boton-prev") && paginaActual > 1) {
    paginaActual--;
    renderizarTabla(contenedor);
    return;
  }

  if (e.target.matches("#boton-next")) {
    paginaActual++;
    renderizarTabla(contenedor);
  }
};

const renderizarTabla = (contenedor) => {
  if (!contenedor?.isConnected) return;
  const cuerpo = contenedor.querySelector("#cuerpo-tabla");
  const buscador = contenedor.querySelector("#buscador");
  const termino = (buscador?.value || "").toLowerCase();

  const filtradas = listaClases.filter((clase) => {
    const actividad = clase.actividad?.nombre?.toLowerCase() || "";
    const entrenador = clase.entrenador?.nombre?.toLowerCase() || "";
    return actividad.includes(termino) || entrenador.includes(termino);
  });

  const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML =
    pagina.length === 0
      ? `<tr><td colspan="${COLUMNAS_TABLA}">No se encontraron clases.</td></tr>`
      : pagina
          .map(
            (clase) => `
        <tr>
          <td>${clase.id ?? clase.claseId}</td>
          <td>${clase.actividad?.nombre || "-"}</td>
          <td>${clase.actividad?.descripcion || "-"}</td>
          <td>${clase.entrenador?.nombre || "Por asignar"}</td>
          <td>${new Date(clase.fecha).toLocaleDateString()}</td>
          <td>${clase.horaInicio} - ${clase.horaFin}</td>
          <td>${clase.cupo}</td>
        </tr>`
          )
          .join("");

  const indicador = contenedor.querySelector("#indicador-pagina");
  const botonPrev = contenedor.querySelector("#boton-prev");
  const botonNext = contenedor.querySelector("#boton-next");

  if (indicador) {
    indicador.textContent = `Pagina ${paginaActual} de ${totalPaginas}`;
  }
  if (botonPrev) botonPrev.disabled = paginaActual <= 1;
  if (botonNext) botonNext.disabled = paginaActual >= totalPaginas;
};

export const renderizarVistaClasesCRUD = async (contenedor) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());

  contenedor.innerHTML = `
    <div data-clases-consulta="true">
      <div class="${estilos.cabecera}">
        <h3>Listado de clases disponibles</h3>
        <input id="buscador" class="${estilos.buscador}" placeholder="Buscar por actividad o entrenador...">
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>ID</th>
              <th>Actividad</th>
              <th>Descripcion</th>
              <th>Entrenador</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Cupo</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Pagina 1 de 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>

      <p style="margin-top:16px;color:#94a3b8;font-size:0.9rem;">La recepcion solo puede consultar cupos y horarios. Para cambios administrativos contacte al area de coordinacion.</p>
    </div>
  `;

  contenedor.dataset.vistaActiva = "consulta";

  if (marcarListenersRegistrados(contenedor)) {
    contenedor.addEventListener("input", manejarInput);
    contenedor.addEventListener("click", manejarClick);
  }

  listaClases = await apiObtenerClases();
  renderizarTabla(contenedor);
};
