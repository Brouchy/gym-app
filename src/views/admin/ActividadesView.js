import estilos from './ActividadesView.module.css';
import {
  apiObtenerActividades,
  apiCrearActividad,
  apiActualizarActividad,
  apiEliminarActividad
} from '../../api/apiActividades.js';

let listaActividades = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;

export const renderizarVistaActividades = async (contenedor) => {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
        <h2>🏋️ Módulo de Gestión de Actividades</h2>
      <div class="${estilos.cabecera}">
        <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar actividad...">
        <button id="boton-agregar" class="${estilos.botonAgregar}">+ Nueva Actividad</button>
      </div>
      <table class="${estilos.tabla}">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="actividades-cuerpo"></tbody>
      </table>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Página 1 de 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>
    </div>
  `;

  listaActividades = await apiObtenerActividades();
  const cuerpo = contenedor.querySelector('#actividades-cuerpo');
  const buscador = contenedor.querySelector('#buscador');
  const indicador = contenedor.querySelector('#indicador-pagina');
  const btnPrev = contenedor.querySelector('#boton-prev');
  const btnNext = contenedor.querySelector('#boton-next');

  const renderizarTabla = () => {
    const termino = buscador.value.toLowerCase();
    const filtradas = listaActividades.filter(a =>
      a.nombre.toLowerCase().includes(termino)
    );

    const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
    paginaActual = Math.min(paginaActual, totalPaginas);
    const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
    const pagina = filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);

    cuerpo.innerHTML = '';

    if (pagina.length === 0) {
      cuerpo.innerHTML = `<tr><td colspan="4">No se encontraron actividades.</td></tr>`;
    } else {
      pagina.forEach(a => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${a.id}</td>
          <td>${a.nombre}</td>
          <td>${a.descripcion}</td>
          <td>
            <button class="${estilos.botonEditar}" data-id="${a.id}">Editar</button>
            <button class="${estilos.botonEliminar}" data-id="${a.id}">Eliminar</button>
          </td>
        `;
        cuerpo.appendChild(fila);
      });
    }

    indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    btnPrev.disabled = paginaActual === 1;
    btnNext.disabled = paginaActual === totalPaginas;
  };

  renderizarTabla();

  buscador.addEventListener('input', () => {
    paginaActual = 1;
    renderizarTabla();
  });

  btnPrev.addEventListener('click', () => {
    paginaActual--;
    renderizarTabla();
  });

  btnNext.addEventListener('click', () => {
    paginaActual++;
    renderizarTabla();
  });

  contenedor.querySelector('#boton-agregar').addEventListener('click', () => abrirModal(null, contenedor));

  contenedor.addEventListener('click', async e => {
    if (e.target.classList.contains(estilos.botonEditar)) {
      const id = parseInt(e.target.dataset.id);
      const actividad = listaActividades.find(a => a.id === id);
      abrirModal(actividad, contenedor);
    }
    if (e.target.classList.contains(estilos.botonEliminar)) {
      const id = parseInt(e.target.dataset.id);
      if (confirm('¿Eliminar esta actividad?')) {
        await apiEliminarActividad(id);
        listaActividades = await apiObtenerActividades();
        renderizarTabla();
      }
    }
  });
};
const abrirModal = (registro = null, zona) => {
  const modal = document.createElement('div');
  modal.className = estilos.modalFondo;
  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${registro ? 'Editar Actividad' : 'Agregar Nueva Actividad'}</h3>
      <form id="form-actividad">
        <label>Nombre</label>
        <input type="text" id="nombre" value="${registro?.nombre || ''}" required>

        <label>Descripción</label>
        <textarea id="descripcion" required>${registro?.descripcion || ''}</textarea>

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit" id="guardar">Guardar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#cancelar').addEventListener('click', () => modal.remove());

  modal.querySelector('#form-actividad').addEventListener('submit', async e => {
    e.preventDefault();

    const nueva = {
      nombre: e.target.nombre.value.trim(),
      descripcion: e.target.descripcion.value.trim()
    };

    if (registro) {
      await apiActualizarActividad(registro.id, nueva);
    } else {
      await apiCrearActividad(nueva);
    }

    modal.remove();
    listaActividades = await apiObtenerActividades();
    paginaActual = 1;
    zona.innerHTML = '<p>Actualizando...</p>';
    await renderizarVistaActividades(zona);
  });
};