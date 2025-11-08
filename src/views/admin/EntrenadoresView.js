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
  // Limpia cualquier modal previo
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
            <button data-accion="editar" data-id="${e.id}" class="${estilos.botonEditar}">Editar</button>
            <button data-accion="eliminar" data-id="${e.id}" class="${estilos.botonEliminar}">Eliminar</button>
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

    // Cierre de modales
    if (e.target.classList.contains(estilos.modalCerrar) || e.target.classList.contains("modal-cerrar")) {
      document.querySelectorAll(`.${estilos.modal}`).forEach(m => m.classList.remove(estilos.activo));
    }
  });
};

/* ==========================================
   🧩 Funciones de modales
========================================== */

const abrirModal = (entrenador = null) => {
  const modal = document.querySelector("#modal-entrenador");
  const titulo = document.querySelector("#modal-titulo");
  const form = document.querySelector("#form-entrenador");

  form.reset();
  titulo.textContent = entrenador ? "Editar Entrenador" : "Agregar Entrenador";
  modoFormulario = entrenador ? "editar" : "crear";

  if (entrenador) {
    form.querySelector("#entrenador-id").value = entrenador.id;
    form.querySelector("#nombre").value = entrenador.nombre || "";
    form.querySelector("#dni").value = entrenador.dni || "";
    form.querySelector("#fechaNacimiento").value = entrenador.fechaNacimiento ? entrenador.fechaNacimiento.split("T")[0] : "";
    form.querySelector("#telefono").value = entrenador.telefono || "";
    form.querySelector("#direccion").value = entrenador.direccion || "";
    form.querySelector("#email").value = entrenador.email || "";
    form.querySelector("#activo").value = entrenador.activo ? "true" : "false";
  }

  modal.classList.add(estilos.activo);

  modal.querySelector("#cancelar").onclick = (ev) => {
    ev.stopPropagation();
    modal.classList.remove(estilos.activo);
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const certificadoInput = form.querySelector("#certificado");
    let certificadoValor = entrenador ? entrenador.certificacion : "";

    if (certificadoInput.files.length > 0) {
      const archivo = certificadoInput.files[0];
      const lector = new FileReader();
      lector.onload = async (event) => {
        certificadoValor = event.target.result;
        await guardarEntrenador(form, certificadoValor);
      };
      lector.readAsDataURL(archivo);
    } else {
      await guardarEntrenador(form, certificadoValor);
    }
  };
};

const guardarEntrenador = async (form, certificadoValor) => {
  const datos = {
    nombre: form.querySelector("#nombre").value.trim(),
    dni: parseInt(form.querySelector("#dni").value, 10),
    fechaNacimiento: new Date(form.querySelector("#fechaNacimiento").value).toISOString(),
    telefono: form.querySelector("#telefono").value,
    direccion: form.querySelector("#direccion").value,
    email: form.querySelector("#email").value,
    certificacion: certificadoValor,
    activo: form.querySelector("#activo").value === "true",
  };

  if (modoFormulario === "editar") {
    const id = form.querySelector("#entrenador-id").value;
    await apiActualizarEntrenador(id, datos);
    const index = listaEntrenadores.findIndex(ent => ent.id == id);
    if (index >= 0) listaEntrenadores[index] = { ...listaEntrenadores[index], ...datos };
  } else {
    const nuevo = await apiCrearEntrenador(datos);
    listaEntrenadores.push(nuevo);
  }

  document.querySelector("#modal-entrenador").classList.remove(estilos.activo);
  renderizarTabla(document.querySelector(`.${estilos.contenedor}`));
};

const abrirModalCargos = async (entrenador) => {
  const modal = document.querySelector("#modal-cargos");
  const contenido = document.querySelector("#contenido-cargos");
  contenido.innerHTML = "<p>Cargando...</p>";
  modal.classList.add(estilos.activo);

  try {
    const clases = await apiObtenerClasesConNombre(entrenador.id);
    const miembros = await apiObtenerMiembrosPorEntrenador(entrenador.id);

    let html = "<h4>Clases a cargo:</h4>";
    html += clases.length
      ? `<ul>${clases.map(c => `<li>${c.nombre} - ${c.horaInicio} a ${c.horaFin}</li>`).join("")}</ul>`
      : "<p>No tiene clases a cargo.</p>";

    html += "<h4>Miembros a cargo (premium):</h4>";
    html += miembros.length
      ? `<ul>${miembros.map(m => `<li>${m.nombre}</li>`).join("")}</ul>`
      : "<p>No tiene miembros premium a cargo.</p>";

    contenido.innerHTML = html;
  } catch {
    contenido.innerHTML = "<p>Error al cargar cargos.</p>";
  }
};

const abrirModalCertificado = (entrenador) => {
  const modal = document.querySelector("#modal-certificado");
  const contenido = document.querySelector("#contenido-certificado");

  modal.classList.add(estilos.activo);

  if (!entrenador.certificacion) {
    contenido.innerHTML = `<p>No se ha cargado certificado.</p>`;
    return;
  }

  const esImagen = entrenador.certificacion.startsWith("data:image");
  const esPDF = entrenador.certificacion.startsWith("data:application/pdf");

  const botonesHTML = `
    <div class="${estilos.botonesCertificado}">
      <button id="imprimir-certificado" class="${estilos.botonSecundario}">🖨 Imprimir</button>
      <button id="descargar-certificado" class="${estilos.botonAgregar}">⬇ Descargar</button>
    </div>
  `;

  if (esImagen) {
    contenido.innerHTML = `
      <img src="${entrenador.certificacion}" alt="Certificado" class="${estilos.imagenCertificado}"/>
      ${botonesHTML}
    `;
  } else if (esPDF) {
    contenido.innerHTML = `
      <iframe src="${entrenador.certificacion}" class="${estilos.iframeCertificado}"></iframe>
      ${botonesHTML}
    `;
  } else {
    contenido.innerHTML = `
      <p>Certificado cargado, pero el formato no es compatible para vista previa.</p>
      ${botonesHTML}
    `;
  }

  contenido.querySelector("#imprimir-certificado")?.addEventListener("click", () => {
    const nuevaVentana = window.open("", "_blank");
    if (esImagen) {
      nuevaVentana.document.write(`<html><body><img src="${entrenador.certificacion}" style="width:100%;"/></body></html>`);
    } else if (esPDF) {
      nuevaVentana.document.write(`<html><body><embed src="${entrenador.certificacion}" type="application/pdf" width="100%" height="100%"/></body></html>`);
    }
    nuevaVentana.document.close();
    nuevaVentana.print();
  });

  contenido.querySelector("#descargar-certificado")?.addEventListener("click", () => {
    const enlace = document.createElement("a");
    enlace.href = entrenador.certificacion;
    enlace.download = `Certificado-${entrenador.nombre || "entrenador"}.${esPDF ? "pdf" : "png"}`;
    enlace.click();
  });
};
