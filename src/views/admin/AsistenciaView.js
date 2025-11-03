import estilos from "./AsistenciasView.module.css";
import { apiObtenerClases } from "../../api/apiClases.js";
import { apiObtenerMiembrosXClase } from "../../api/apiMiembroxClase.js";
import {
  apiObtenerAsistenciasCompletas,
  apiCrearAsistencia,
  apiEliminarAsistencia,
  apiActualizarAsistencia,
  apiObtenerTiposDeAsistencia,
} from "../../api/apiAsistencias.js";

let listaAsistencias = [];
let listaClases = [];
let listaTiposAsistencia = [];
let claseSeleccionada = null;
let paginaActual = 1;
const FILAS_POR_PAGINA = 6;

export const renderizarVistaAsistencia = async (contenedor) => {
  // Limpia contenedor
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.cabecera}">
        <h2>📅 Registro de Asistencias</h2>
        <div class="${estilos.filtros}">
          <label>Seleccionar Clase:</label>
          <select id="selectClase" class="${estilos.selectInput}">
            <option value="">-- Seleccioná una clase --</option>
          </select>
          <button id="boton-agregar" class="${estilos.botonAgregar}">+ Registrar Asistencia</button>
        </div>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Miembro</th>
              <th>Actividad</th>
              <th>Entrenador</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cuerpo-asistencias">
            <tr><td colspan="6">Seleccioná una clase para ver asistencias</td></tr>
          </tbody>
        </table>
      </div>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Página 1 de 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>
    </div>
  `;

  // Cargar datos base
  listaClases = await apiObtenerClases();
  listaTiposAsistencia = await apiObtenerTiposDeAsistencia();
  const selectClase = contenedor.querySelector("#selectClase");

  listaClases.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id ?? c.claseId;
    opt.textContent = `${c.actividad?.nombre || "Sin actividad"} - ${c.entrenador?.nombre || "Sin entrenador"} (${new Date(c.fecha).toLocaleDateString()})`;
    selectClase.appendChild(opt);
  });

  // Eventos
  selectClase.addEventListener("change", async () => {
    const id = selectClase.value;
    if (!id) {
      renderTabla([], contenedor);
      return;
    }

    claseSeleccionada = listaClases.find(
      (c) => c.id == id || c.claseId == id
    );
    await cargarYMostrarAsistencias(contenedor);
  });

  contenedor.querySelector("#boton-agregar").addEventListener("click", () => {
    if (!claseSeleccionada) {
      alert("⚠️ Primero seleccioná una clase.");
      return;
    }
    abrirModalAsistencia(contenedor);
  });
};

// ========================================================
// 🔹 Cargar asistencias filtradas por clase seleccionada
// ========================================================
const cargarYMostrarAsistencias = async (contenedor) => {
  const todas = await apiObtenerAsistenciasCompletas();
  listaAsistencias = todas.filter(
    (a) =>
      a.miembroXClase?.clase?.claseId == claseSeleccionada.id ||
      a.miembroXClase?.clase?.id == claseSeleccionada.id
  );
  paginaActual = 1;
  renderTabla(listaAsistencias, contenedor);
};

// ========================================================
// 🔹 Render tabla
// ========================================================
function renderTabla(lista, contenedor) {
  const cuerpo = contenedor.querySelector("#cuerpo-asistencias");
  const indicador = contenedor.querySelector("#indicador-pagina");
  const btnPrev = contenedor.querySelector("#boton-prev");
  const btnNext = contenedor.querySelector("#boton-next");

  if (lista.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="6">No hay asistencias registradas.</td></tr>`;
    btnPrev.disabled = btnNext.disabled = true;
    indicador.textContent = "Página 1 de 1";
    return;
  }

  const totalPaginas = Math.ceil(lista.length / FILAS_POR_PAGINA);
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML = pagina
    .map(
      (a) => `
      <tr>
        <td>${new Date(a.fecha).toLocaleDateString()}</td>
        <td>${a.miembroXClase?.miembro?.nombre || "-"}</td>
        <td>${a.miembroXClase?.clase?.actividad?.nombre || "-"}</td>
        <td>${a.miembroXClase?.clase?.entrenador?.nombre || "-"}</td>
        <td>${a.tipoDeAsistencia?.descripcion || "-"}</td>
        <td class="${estilos.acciones}">
          <button class="${estilos.botonEditar}" data-id="${a.asistenciaId}">Editar</button>
          <button class="${estilos.botonEliminar}" data-id="${a.asistenciaId}">Eliminar</button>
        </td>
      </tr>
    `
    )
    .join("");

  indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas;

  btnPrev.onclick = () => {
    paginaActual--;
    renderTabla(lista, contenedor);
  };
  btnNext.onclick = () => {
    paginaActual++;
    renderTabla(lista, contenedor);
  };

  cuerpo.querySelectorAll(`.${estilos.botonEliminar}`).forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("¿Eliminar asistencia?")) {
        await apiEliminarAsistencia(id);
        listaAsistencias = listaAsistencias.filter(
          (a) => a.asistenciaId != id
        );
        renderTabla(listaAsistencias, contenedor);
      }
    })
  );

  cuerpo.querySelectorAll(`.${estilos.botonEditar}`).forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const asistencia = listaAsistencias.find((a) => a.asistenciaId == id);
      abrirModalAsistencia(contenedor, asistencia);
    })
  );
}

// ========================================================
// 🔹 Modal para agregar o editar asistencia
// ========================================================
async function abrirModalAsistencia(contenedor, asistencia = null) {
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const miembrosDeClase = await apiObtenerMiembrosXClase();
  const miembrosFiltrados = miembrosDeClase.filter(
    (m) =>
      m.claseId == claseSeleccionada.id ||
      m.clase?.id == claseSeleccionada.id
  );

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${asistencia ? "Editar Asistencia" : "Registrar Asistencia"}</h3>
      <form id="form-asistencia">
        <label>Miembro:</label>
        <select id="miembroXClaseId" required>
          <option value="">-- Seleccioná un miembro --</option>
          ${miembrosFiltrados
            .map(
              (m) =>
                `<option value="${m.id}" ${
                  asistencia?.miembroXClase?.miembroXClaseId == m.id
                    ? "selected"
                    : ""
                }>${m.miembro?.nombre || "Miembro sin nombre"}</option>`
            )
            .join("")}
        </select>

        <label>Tipo de Asistencia:</label>
        <select id="tipoDeAsistenciaId" required>
          <option value="">-- Seleccioná un tipo --</option>
          ${listaTiposAsistencia
            .map(
              (t) =>
                `<option value="${t.id}" ${
                  asistencia?.tipoDeAsistencia?.id == t.id ? "selected" : ""
                }>${t.descripcion}</option>`
            )
            .join("")}
        </select>

        <label>Fecha:</label>
        <input type="date" id="fecha" value="${
          asistencia
            ? new Date(asistencia.fecha).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
        }" required>

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#form-asistencia");
  const btnCancelar = modal.querySelector("#cancelar");

  btnCancelar.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const miembroXClaseId = parseInt(e.target.miembroXClaseId.value);
    const tipoDeAsistenciaId = parseInt(e.target.tipoDeAsistenciaId.value);
    const fecha = new Date(e.target.fecha.value).toISOString();

    const datos = {
      miembroXClaseId,
      tipoDeAsistenciaId,
      fecha,
      membresiaXMiembroId: 1001 // 🔧 Valor temporal para test (se puede ajustar luego)
    };

    if (asistencia) {
      await apiActualizarAsistencia(asistencia.asistenciaId, datos);
    } else {
      await apiCrearAsistencia(datos);
    }

    alert("✅ Asistencia guardada correctamente");
    modal.remove();
    await cargarYMostrarAsistencias(contenedor);
  });
}
