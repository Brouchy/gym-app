import estilos from "./EntrenadoresView.module.css";
import { subirImagenAImgbb } from "../../utils/subirImagen.js";
import {
  apiObtenerEntrenadores,
  apiCrearEntrenador,
  apiActualizarEntrenador,
  apiEliminarEntrenador
} from "../../api/trainersApi.js";

let listaEntrenadores = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;

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
              <th>Certificado</th>
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
            </div>
          </div>

          <div>
            <label>Certificado (imagen)</label>
            <div class="${estilos.fileInput}">
              <input type="file" id="certificado" accept="image/*">
              <button type="button" id="btn-cert-select" class="${estilos.fileButton}">Seleccionar archivo</button>
              <span id="certificado-nombre" class="${estilos.fileName}">Ningún archivo seleccionado</span>
            </div>
            <input type="hidden" id="certificado-actual" value="">
          </div>

          <div class="${estilos.modalAcciones}">
            <button type="button" id="cancelar" class="${estilos.botonSecundario}">Cancelar</button>
            <button type="submit" class="${estilos.botonAgregar}">Guardar</button>
          </div>
        </form>
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
          <td>
            ${e.certificado
              ? `<a href="${e.certificado}" target="_blank" rel="noopener" class="${estilos.certLink}">Ver</a>`
              : `<span class="${estilos.certBadge}">No cargado</span>`}
          </td>
          <td>
            <span class="${estilos.toggleActivo}" data-accion="toggle-activo" data-id="${e.id}" data-valor="${e.activo ? "true" : "false"}" style="cursor:pointer;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${e.activo ? '#16a34a' : '#dc2626'};margin-right:6px;vertical-align:middle"></span>
              ${e.activo ? "Activo" : "Inactivo"}
            </span>
          </td>
          <td class="${estilos.acciones}">
            <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-accion="editar" data-id="${e.id}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
            </svg>
            <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-accion="eliminar" data-id="${e.id}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M9 3h6v1h5v2H4V4h5V3zm1 4h1v10h-1V7zm4 0h1v10h-1V7zm-7 0h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
            </svg>
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
    const accionEl = e.target.closest('[data-accion]');
    const accion = accionEl?.dataset.accion;
    const id = accionEl?.dataset.id;

    if (e.target.closest("#boton-prev")) {
      paginaActual--;
      renderizarTabla(contenedor);
      return;
    }

    if (e.target.closest("#boton-next")) {
      paginaActual++;
      renderizarTabla(contenedor);
      return;
    }

    if (e.target.closest("#boton-agregar")) {
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

    if (accion === "toggle-activo") {
      const entrenador = listaEntrenadores.find(ent => ent.id == id);
      if (!entrenador) return;
      const nuevoActivo = !Boolean(entrenador.activo);
      try {
        await apiActualizarEntrenador(id, {
          nombre: entrenador.nombre || "",
          dni: entrenador.dni || "",
          telefono: entrenador.telefono || "",
          fechaNacimiento: entrenador.fechaNacimiento || "",
          direccion: entrenador.direccion || "",
          email: entrenador.email || "",
          activo: nuevoActivo
        });
        await cargarYMostrarEntrenadores(contenedor);
      } catch (err) {
        console.error("Error actualizando estado activo del entrenador", err);
        alert("No se pudo actualizar el estado activo.");
      }
      return;
    }

    if (e.target.classList.contains(estilos.modalCerrar) || e.target.classList.contains("modal-cerrar")) {
      document.querySelectorAll(`.${estilos.modal}`).forEach(m => m.classList.remove(estilos.activo));
    }
  });
};


const abrirModal = (entrenador = null) => {
  const modal = document.getElementById("modal-entrenador");
  const form = modal.querySelector("#form-entrenador");
  modal.classList.add(estilos.activo);

  if (entrenador) {
    modal.querySelector("#modal-titulo").textContent = "Editar Entrenador";
    form.nombre.value = entrenador.nombre || "";
    form.dni.value = entrenador.dni || "";
    form.telefono.value = entrenador.telefono || "";
    form.fechaNacimiento.value = entrenador.fechaNacimiento || "";
    form.direccion.value = entrenador.direccion || "";
    form.email.value = entrenador.email || "";
    form.activo.value = entrenador.activo ? "true" : "false";
    form["certificado-actual"].value = entrenador.certificado || "";
    form["entrenador-id"].value = entrenador.id;
    // certificado no obligatorio si ya existe
    const certInput = form.querySelector('#certificado');
    if (certInput) certInput.required = !Boolean(entrenador.certificado);
    // actualizar label con nombre actual
    const certNombre = modal.querySelector('#certificado-nombre');
    if (certNombre) certNombre.textContent = entrenador.certificado ? (new URL(entrenador.certificado)).pathname.split('/').pop() : 'Ningún archivo seleccionado';
  } else {
    modal.querySelector("#modal-titulo").textContent = "Agregar Entrenador";
    form.reset();
    form["entrenador-id"].value = "";
    form["certificado-actual"].value = "";
    // certificado obligatorio al crear
    const certInput = form.querySelector('#certificado');
    if (certInput) certInput.required = true;
    const certNombre = modal.querySelector('#certificado-nombre');
    if (certNombre) certNombre.textContent = 'Ningún archivo seleccionado';
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    // Manejo de certificado como en miembros (ImgBB)
    const fileCert = form.querySelector('#certificado')?.files?.[0] || null;
    const certificadoActual = form.querySelector('#certificado-actual')?.value || "";
    let urlCertificado = certificadoActual;
    if (fileCert) {
      const subida = await subirImagenAImgbb(fileCert);
      if (subida) {
        urlCertificado = subida;
      } else if (!certificadoActual) {
        alert("No se pudo subir el certificado. Se guardará sin certificado.");
      } else {
        alert("No se pudo subir el nuevo certificado. Se conservará el anterior.");
      }
    }

    // Validación: en alta, exigir certificado
    const id = form["entrenador-id"].value;
    if (!id && !urlCertificado) {
      alert("Debes subir un certificado para dar de alta al entrenador.");
      return;
    }

    const data = {
      nombre: form.nombre.value,
      dni: form.dni.value,
      telefono: form.telefono.value,
      fechaNacimiento: form.fechaNacimiento.value,
      direccion: form.direccion.value,
      email: form.email.value,
      activo: form.activo.value === "true",
      certificado: urlCertificado || ""
    };

  // wiring del botón personalizado y nombre
  const btnSeleccionar = modal.querySelector('#btn-cert-select');
  const inputFile = modal.querySelector('#certificado');
  const labelNombre = modal.querySelector('#certificado-nombre');
  if (btnSeleccionar && inputFile) {
    btnSeleccionar.onclick = () => inputFile.click();
    inputFile.onchange = () => {
      const file = inputFile.files?.[0];
      if (file && labelNombre) labelNombre.textContent = file.name;
    };
  }
    if (id) {
      await apiActualizarEntrenador(id, data);
    } else {
      await apiCrearEntrenador(data);
    }
    modal.classList.remove(estilos.activo);
    await cargarYMostrarEntrenadores(document.querySelector(`.${estilos.contenedor}`));
  };

  modal.querySelectorAll(".modal-cerrar").forEach(el => el.addEventListener("click", () => modal.classList.remove(estilos.activo)));
  const btnCancelar = modal.querySelector("#cancelar");
  if (btnCancelar) btnCancelar.addEventListener("click", () => modal.classList.remove(estilos.activo));
};
