/* ===============================
   👥 MÓDULO DE GESTIÓN DE ENTRENADORES
================================= */

import estilos from "./EntrenadoresView.module.css";
import {
  apiObtenerEntrenadores,
  apiCrearEntrenador,
  apiActualizarEntrenador,
  apiEliminarEntrenador,
  apiObtenerClasesConNombre,
  apiObtenerMiembrosPorEntrenador
} from "../../api/trainersApi.js";

let listaEntrenadores = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;
let modoFormulario = "crear";

export const renderizarVistaEntrenadores = async (contenedor) => {
  document.querySelectorAll('[class*="modal"]').forEach((el) => el.remove());

  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.tituloModulo}">
        <h2>Módulo de Gestión de Entrenadores</h2>
      </div>

      <div class="${estilos.cabecera}">
        <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar por nombre, DNI o email...">
        <button id="boton-agregar" class="${estilos.botonAgregar}">+ Nuevo Entrenador</button>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Certificación</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="entrenadores-cuerpo"></tbody>
        </table>
      </div>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Página 1 de 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>
    </div>

    <!-- Modal Entrenador -->
    <div id="modal-entrenador" class="${estilos.modal}">
      <div class="${estilos.modalFondo} modal-cerrar"></div>
      <div class="${estilos.modalContenido}">
        <div class="${estilos.modalCabecera}">
          <h3 id="modal-titulo">Agregar Entrenador</h3>
          <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
        </div>

        <form id="form-entrenador" class="${estilos.formularioModal}">
          <input type="hidden" id="entrenador-id">

          <div class="${estilos.grupoDosColumnas}">
            <div>
              <label>Nombre</label>
              <input type="text" id="nombre" required>
              <label>DNI</label>
              <input type="number" id="dni" required>
              <label>Teléfono</label>
              <input type="text" id="telefono" required>
              <label>Activo</label>
              <select id="activo">
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label>Fecha Nacimiento</label>
              <input type="date" id="fechaNacimiento" required>
              <label>Dirección</label>
              <input type="text" id="direccion" required>
              <label>Email</label>
              <input type="email" id="email" required>
              <label>Certificación</label>
              <input type="file" id="certificado" accept=".pdf,.jpg,.jpeg,.png">
            </div>
          </div>

          <div class="${estilos.modalAcciones}">
            <button type="button" id="cancelar" class="${estilos.botonSecundario}">Cancelar</button>
            <button type="submit" class="${estilos.botonAgregar}">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Cargos -->
    <div id="modal-cargos" class="${estilos.modal}">
      <div class="${estilos.modalFondo} modal-cerrar"></div>
      <div class="${estilos.modalContenido}">
        <div class="${estilos.modalCabecera}">
          <h3 id="modal-cargos-titulo">Cargos del Entrenador</h3>
          <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
        </div>
        <div id="contenido-cargos"></div>
      </div>
    </div>

    <!-- Modal Certificado -->
    <div id="modal-certificado" class="${estilos.modal}">
      <div class="${estilos.modalFondo} modal-cerrar"></div>
      <div class="${estilos.modalContenido}">
        <div class="${estilos.modalCabecera}">
          <h3>Certificado</h3>
          <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
        </div>
        <div id="contenido-certificado"></div>
      </div>
    </div>
  `;

  await cargarYMostrarEntrenadores(contenedor);
  adjuntarEventos(contenedor);
};

/* ==========================================
   📄 Renderizado y filtrado de tabla
========================================== */

const cargarYMostrarEntrenadores = async (contenedor) => {
  listaEntrenadores = await apiObtenerEntrenadores();
  renderizarTabla(contenedor);
};

const renderizarTabla = (contenedor) => {
  const cuerpo = contenedor.querySelector("#entrenadores-cuerpo");
  const buscador = contenedor.querySelector("#buscador");
  const indicador = contenedor.querySelector("#indicador-pagina");

  const termino = (buscador.value || "").toLowerCase();
  const filtrados = listaEntrenadores.filter(
    (e) =>
      (e.nombre || "").toLowerCase().includes(termino) ||
      String(e.dni || "").includes(termino) ||
      (e.email || "").toLowerCase().includes(termino)
  );

  const totalPaginas = Math.ceil(filtrados.length / FILAS_POR_PAGINA) || 1;
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = filtrados.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML =
    pagina.length === 0
      ? `<tr><td colspan="9">No se encontraron entrenadores.</td></tr>`
      : pagina
          .map(
            (e) => `
        <tr>
          <td>${e.id}</td>
          <td>${e.nombre}</td>
          <td>${e.dni}</td>
          <td>${e.telefono}</td>
          <td>${e.direccion}</td>
          <td>${e.email}</td>
          <td>${e.certificacion ? "✅ " + e.certificacion.split("/").pop() : "-"}</td>
          <td>${e.activo ? "✅" : "❌"}</td>
          <td class="${estilos.acciones}">
            <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-accion="editar" data-id="${e.id}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
            </svg>
            <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-accion="eliminar" data-id="${e.id}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M9 3h6v1h5v2H4V4h5V3zm1 4h1v10h-1V7zm4 0h1v10h-1V7zm-7 0h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
            </svg>
            <button data-accion="cargos" data-id="${e.id}" class="${estilos.botonAgregar}">⚡ Cargos</button>
            <button data-accion="certificado" data-id="${e.id}" class="${estilos.botonSecundario}">📄 Certificado</button>
          </td>
        </tr>`
          )
          .join("");

  indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  contenedor.querySelector("#boton-prev").disabled = paginaActual === 1;
  contenedor.querySelector("#boton-next").disabled = paginaActual === totalPaginas;
};

/* ==========================================
   ⚙️ Eventos y acciones principales
========================================== */

const adjuntarEventos = (contenedor) => {
  const buscador = contenedor.querySelector("#buscador");
  buscador.addEventListener("input", () => {
    paginaActual = 1;
    renderizarTabla(contenedor);
  });

  contenedor.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    const accion = e.target.dataset.accion;

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
      abrirModal();
      return;
    }

    if (accion === "editar") {
      const entrenador = listaEntrenadores.find(ent => ent.id == id);
      abrirModal(entrenador);
      return;
    }

    if (accion === "eliminar") {
      if (confirm("¿Eliminar entrenador?")) {
        await apiEliminarEntrenador(id);
        await cargarYMostrarEntrenadores(contenedor);
      }
      return;
    }

    if (accion === "cargos") {
      const entrenador = listaEntrenadores.find(ent => ent.id == id);
      abrirModalCargos(entrenador);
      return;
    }

    if (accion === "certificado") {
      const entrenador = listaEntrenadores.find(ent => ent.id == id);
      abrirModalCertificado(entrenador);
      return;
    }

    if (e.target.classList.contains(estilos.modalCerrar) || e.target.classList.contains("modal-cerrar")) {
      document.querySelectorAll(`.${estilos.modal}`).forEach(m => m.classList.remove(estilos.activo));
    }
  });
};

/* ==========================================
   🧩 Funciones de modales
========================================== */
// (La sección de modales la dejamos igual que la tuya)
