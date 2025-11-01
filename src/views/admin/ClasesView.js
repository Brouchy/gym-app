import estilos from './ClasesView.module.css';
import { apiObtenerEntrenadores } from "../../api/trainersApi";
import { apiObtenerActividades } from '../../api/apiActividades';
import {
  apiCrearClase,apiActualizarClase,apiObtenerClases,apiEliminarClase
} from '../../api/apiClases.js';


let listaClases = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;

export const renderizarVistaClases = async (contenedor) => {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.cabecera}">
        <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar por actividad o entrenador...">
        <button id="boton-agregar" class="${estilos.botonAgregar}">+ Nueva Clase</button>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>ID</th>
              <th>Actividad</th>
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

  listaClases = await apiObtenerClases();
  renderizarTabla(contenedor);

  // eventos globales
  contenedor.addEventListener('input', e => {
    if (e.target.matches('#buscador')) {
      paginaActual = 1;
      renderizarTabla(contenedor);
    }
  });

  contenedor.addEventListener('click', async e => {
    if (e.target.matches('#boton-prev')) {
      paginaActual--;
      renderizarTabla(contenedor);
    }
    if (e.target.matches('#boton-next')) {
      paginaActual++;
      renderizarTabla(contenedor);
    }
    if (e.target.matches('#boton-agregar')) {
      abrirModal();
    }
    if (e.target.matches(`.${estilos.botonEditar}`)) {
      const id = e.target.dataset.id;
      const clase = listaClases.find(c => c.claseId == id);
      abrirModal(clase);
    }
    if (e.target.matches(`.${estilos.botonEliminar}`)) {
      const id = e.target.dataset.id;
      if (confirm('¿Eliminar esta clase?')) {
        await apiEliminarClase(id);
        listaClases = await apiObtenerClases();
        renderizarTabla(contenedor);
      }
    }
  });
};

const renderizarTabla = (contenedor) => {
  const cuerpo = contenedor.querySelector('#cuerpo-tabla');
  const buscador = contenedor.querySelector('#buscador');
  const indicador = contenedor.querySelector('#indicador-pagina');
  const btnPrev = contenedor.querySelector('#boton-prev');
  const btnNext = contenedor.querySelector('#boton-next');

  const termino = buscador.value.toLowerCase();
  const filtradas = listaClases.filter(c =>
    c.actividad?.nombre.toLowerCase().includes(termino) ||
    c.entrenador?.nombre.toLowerCase().includes(termino)
  );

  const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML = '';

  if (pagina.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="7">No se encontraron clases.</td></tr>`;
  } else {
    pagina.forEach(c => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${c.claseId}</td>
        <td>${c.actividad?.nombre || '-'}</td>
        <td>${c.entrenador?.nombre || '-'}</td>
        <td>${new Date(c.fecha).toLocaleDateString()}</td>
        <td>${c.horaInicio} - ${c.horaFin}</td>
        <td>${c.cupo}</td>
        <td class="${estilos.acciones}">
          <button class="${estilos.botonEditar}" data-id="${c.claseId}">Editar</button>
          <button class="${estilos.botonEliminar}" data-id="${c.claseId}">Eliminar</button>
        </td>`;
      cuerpo.appendChild(fila);
    });
  }

  indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas;
};

// ======================
// MODAL DE NUEVA / EDITAR CLASE
// ======================
const abrirModal = async (clase = null) => {
  const modal = document.createElement('div');
  modal.className = estilos.modalFondo;

  const actividades = await apiObtenerActividades();
  console.log("actividades",actividades);
  const entrenadores = await apiObtenerEntrenadores();

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${clase ? 'Editar Clase' : 'Nueva Clase'}</h3>
      <form id="form-clase">
        <label>Actividad</label>
        <select id="actividadId" required>
          <option value="">-- Seleccioná una actividad --</option>
          ${actividades.map(a => `
            <option value="${a.id}" ${clase?.actividadId === a.id ? 'selected' : ''}>${a.nombre}</option>
          `).join('')}
        </select>

        <label>Entrenador</label>
        <select id="entrenadorId" required>
          <option value="">-- Seleccioná un entrenador --</option>
          ${entrenadores.map(e => `
            <option value="${e.id}" ${clase?.entrenadorId === e.id ? 'selected' : ''}>${e.nombre}</option>
          `).join('')}
        </select>

        <label>Fecha</label>
        <input type="date" id="fecha" value="${clase ? new Date(clase.fecha).toISOString().split('T')[0] : ''}" required>

        <label>Hora inicio</label>
        <input type="time" id="horaInicio" value="${clase?.horaInicio || ''}" required>

        <label>Hora fin</label>
        <input type="time" id="horaFin" value="${clase?.horaFin || ''}" required>

        <label>Cupo</label>
        <input type="number" id="cupo" value="${clase?.cupo || ''}" required min="1">

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit">${clase ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#cancelar').addEventListener('click', () => modal.remove());

  const form = modal.querySelector('#form-clase');
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const nuevaClase = {
      actividadId: parseInt(e.target.actividadId.value),
      entrenadorId: parseInt(e.target.entrenadorId.value),
      fecha: new Date(e.target.fecha.value).toISOString(),
      horaInicio: e.target.horaInicio.value,
      horaFin: e.target.horaFin.value,
      cupo: parseInt(e.target.cupo.value)
    };

    if (clase) await apiActualizarClase(clase.claseId, nuevaClase);
    else await apiCrearClase(nuevaClase);

    modal.remove();
    listaClases = await apiObtenerClases();
    const contenedor = document.querySelector(`.${estilos.contenedor}`);
    renderizarTabla(contenedor);
  });
};
