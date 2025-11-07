import estilos from "./ClasesView.module.css";
import { apiObtenerClases, apiCrearClase, apiActualizarClase, apiEliminarClase } from "../../../api/apiClases.js";
import { apiObtenerActividades } from "../../../api/apiActividades.js";
import { apiObtenerEntrenadores } from "../../../api/trainersApi.js";

let listaClases = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;

const marcarListenersRegistrados = (contenedor) => {
  if (contenedor.dataset.clasesCrudListeners === "true") return false;
  contenedor.dataset.clasesCrudListeners = "true";
  return true;
};

const handleCrudInput = (e) => {
  const contenedor = e.currentTarget;
  if (!contenedor?.isConnected || contenedor.dataset.vistaActiva !== "crud") return;
  if (!e.target.closest('[data-clases-crud="true"]')) return;
  if (e.target.matches("#buscador")) {
    paginaActual = 1;
    renderizarTabla(contenedor);
  }
};

const handleCrudClick = async (e) => {
  const contenedor = e.currentTarget;
  if (!contenedor?.isConnected || contenedor.dataset.vistaActiva !== "crud") return;
  if (!e.target.closest('[data-clases-crud="true"]')) return;

  if (e.target.matches("#boton-prev")) {
    paginaActual--;
    renderizarTabla(contenedor);
    return;
  }

  if (e.target.matches("#boton-next")) {
    paginaActual++;
    renderizarTabla(contenedor);
    return;
  }

  if (e.target.matches("#boton-agregar")) {
    abrirModal(contenedor);
    return;
  }

  const botonEditar = e.target.closest(`.${estilos.botonEditar}`);
  if (botonEditar) {
    const id = botonEditar.dataset.id;
    const clase = listaClases.find((c) => c.id == id || c.claseId == id);
    abrirModal(contenedor, clase);
    return;
  }

  const botonEliminar = e.target.closest(`.${estilos.botonEliminar}`);
  if (botonEliminar) {
    if (confirm("¿Eliminar clase?")) {
      await apiEliminarClase(botonEliminar.dataset.id);
      listaClases = await apiObtenerClases();
      renderizarTabla(contenedor);
    }
    return;
  }
};

/**
 * CRUD de Clases (Actividad + Entrenador)
 */
export const renderizarVistaClasesCRUD = async (contenedor) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());

  contenedor.innerHTML = `
    <div data-clases-crud="true">
      <div class="${estilos.cabecera}">
        <input id="buscador" class="${estilos.buscador}" placeholder="Buscar por actividad o entrenador...">
        <button id="boton-agregar" class="${estilos.botonAgregar}">+ Nueva Clase</button>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>ID</th>
              <th>Actividad</th>
              <th>Descripción</th>
              <th>Entrenador</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Cupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Página 1 de 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>
    </div>
  `;

  contenedor.dataset.vistaActiva = "crud";

  if (marcarListenersRegistrados(contenedor)) {
    contenedor.addEventListener("input", handleCrudInput);
    contenedor.addEventListener("click", handleCrudClick);
  }

  listaClases = await apiObtenerClases();
  renderizarTabla(contenedor);
};

const renderizarTabla = (contenedor) => {
  if (!contenedor?.isConnected) return;
  const cuerpo = contenedor.querySelector("#cuerpo-tabla");
  const buscador = contenedor.querySelector("#buscador");
  const termino = (buscador.value || "").toLowerCase();

  const filtradas = listaClases.filter(
    (c) =>
      c.actividad?.nombre.toLowerCase().includes(termino) ||
      c.entrenador?.nombre.toLowerCase().includes(termino)
  );

  const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML =
    pagina.length === 0
      ? `<tr><td colspan="8">No se encontraron clases.</td></tr>`
      : pagina
          .map(
            (c) => `
        <tr>
          <td>${c.id ?? c.claseId}</td>
          <td>${c.actividad?.nombre || "-"}</td>
          <td>${c.actividad?.descripcion || "-"}</td>
          <td>${c.entrenador?.nombre || "-"}</td>
          <td>${new Date(c.fecha).toLocaleDateString()}</td>
          <td>${c.horaInicio} - ${c.horaFin}</td>
          <td>${c.cupo}</td>
          <td class="${estilos.acciones}">
            <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-id="${c.id ?? c.claseId}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
            </svg>
            <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-id="${c.id ?? c.claseId}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M9 3h6v1h5v2H4V4h5V3zm1 4h1v10h-1V7zm4 0h1v10h-1V7zm-7 0h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
            </svg>
          </td>
        </tr>`
          )
          .join("");
};

const abrirModal = async (contenedor, clase = null) => {
  if (!contenedor?.isConnected) return;
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const actividades = await apiObtenerActividades();
  const entrenadores = await apiObtenerEntrenadores();
  if (!contenedor?.isConnected) return;

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${clase ? "Editar Clase" : "Nueva Clase"}</h3>
      <form id="form-clase">
        <label>Actividad</label>
        <select id="actividadId" required>
          <option value="">-- Seleccioná una actividad --</option>
          ${actividades.map(a => `<option value="${a.id}" ${clase?.actividad?.nombre === a.nombre ? 'selected' : ''}>${a.nombre}</option>`).join('')}
        </select>

        <label>Entrenador</label>
        <select id="entrenadorId" required>
          <option value="">-- Seleccioná un entrenador --</option>
          ${entrenadores.map(e => `<option value="${e.id}" ${clase?.entrenador?.nombre === e.nombre ? 'selected' : ''}>${e.nombre}</option>`).join('')}
        </select>

        <label>Fecha</label>
        <input type="date" id="fecha" value="${clase ? new Date(clase.fecha).toISOString().split("T")[0] : ""}" required>

        <label>Hora inicio</label>
        <input type="time" id="horaInicio" value="${clase?.horaInicio || ""}" required>

        <label>Hora fin</label>
        <input type="time" id="horaFin" value="${clase?.horaFin || ""}" required>

        <label>Cupo</label>
        <input type="number" id="cupo" value="${clase?.cupo || ""}" min="1" required>

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit">${clase ? "Actualizar" : "Guardar"}</button>
        </div>
      </form>
    </div>
  `;

  if (!document.body.contains(contenedor)) return;
  document.body.appendChild(modal);

  modal.querySelector("#cancelar").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector("#form-clase").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevaClase = {
      actividadId: parseInt(e.target.actividadId.value),
      entrenadorId: parseInt(e.target.entrenadorId.value),
      fecha: new Date(e.target.fecha.value).toISOString(),
      horaInicio: e.target.horaInicio.value,
      horaFin: e.target.horaFin.value,
      cupo: parseInt(e.target.cupo.value),
    };
    if (clase) await apiActualizarClase(clase.id ?? clase.claseId, nuevaClase);
    else await apiCrearClase(nuevaClase);
    modal.remove();
    listaClases = await apiObtenerClases();
    renderizarTabla(contenedor);
  });
};
