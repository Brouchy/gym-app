import estilos from "./ClasesView.module.css";
import { apiObtenerMiembros } from "../../../api/membersApi.js";
import { apiObtenerClases } from "../../../api/apiClases.js";
import {
  apiObtenerMiembrosXClase,
  apiCrearMiembroXClase
} from "../../../api/apiMiembroxClase.js";

let listaClases = [];
let listaMiembrosXClase = [];
let claseSeleccionada = null;

const normalizarId = (valor) => String(valor ?? "");

const renderTabla = (contenedor, registros) => {
  const cuerpo = contenedor.querySelector("#cuerpo-tabla-miembrosxclase");
  if (!cuerpo) return;

  if (!registros.length) {
    cuerpo.innerHTML = `<tr><td colspan="4">No hay inscripciones para esta clase.</td></tr>`;
    return;
  }

  cuerpo.innerHTML = registros
    .map(
      (registro) => `
      <tr>
        <td>${registro.id}</td>
        <td>${registro.miembro?.nombre || "-"}</td>
        <td>${registro.clase?.entrenador?.nombre || "Por asignar"}</td>
        <td>${new Date(registro.fechaInscripcion).toLocaleDateString()}</td>
      </tr>`
    )
    .join("");
};

const actualizarTablaParaClase = async (contenedor) => {
  const cuerpo = contenedor.querySelector("#cuerpo-tabla-miembrosxclase");
  if (!claseSeleccionada || !cuerpo) {
    cuerpo.innerHTML = `<tr><td colspan="4">Selecciona una clase para ver sus inscripciones.</td></tr>`;
    return;
  }

  const inscripciones = await apiObtenerMiembrosXClase();
  listaMiembrosXClase = Array.isArray(inscripciones) ? inscripciones : [];
  const filtrados = (listaMiembrosXClase || []).filter(
    (mx) =>
      normalizarId(mx.clase?.claseId ?? mx.clase?.id) ===
      normalizarId(claseSeleccionada.claseId ?? claseSeleccionada.id)
  );
  renderTabla(contenedor, filtrados);
};

const abrirModalAsignar = async (contenedor) => {
  if (!claseSeleccionada) {
    alert("Selecciona una clase antes de inscribir miembros.");
    return;
  }

  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const miembros = (await apiObtenerMiembros()) || [];
  const asignados = (listaMiembrosXClase || []).filter(
    (mx) =>
      normalizarId(mx.clase?.claseId ?? mx.clase?.id) ===
      normalizarId(claseSeleccionada.claseId ?? claseSeleccionada.id)
  );
  const cupoActual = asignados.length;
  const cupoMaximo = Number(claseSeleccionada.cupo ?? 0);
  const cupoLleno = cupoMaximo > 0 && cupoActual >= cupoMaximo;

  const miembrosDisponibles = miembros.filter(
    (m) => !asignados.some((mx) => Number(mx.miembroId) === Number(m.id))
  );

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>Inscribir miembro</h3>
      <p><strong>Clase:</strong> ${claseSeleccionada.actividad?.nombre || "-"} (${new Date(claseSeleccionada.fecha).toLocaleDateString()})</p>
      <p><strong>Cupo:</strong> ${cupoActual}/${cupoMaximo || "Sin limite"}</p>

      <form id="form-asignacion">
        <label>Seleccionar miembro</label>
        <select id="miembroId" required ${cupoLleno ? "disabled" : ""}>
          <option value="">-- Elegi un miembro --</option>
          ${miembrosDisponibles
            .map((miembro) => `<option value="${miembro.id}">${miembro.nombre} (${miembro.email || "sin email"})</option>`)
            .join("")}
        </select>

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit" ${cupoLleno || !miembrosDisponibles.length ? "disabled" : ""}>Inscribir</button>
        </div>
      </form>

      ${cupoLleno ? `<p style="margin-top:12px;color:#f87171;">La clase esta llena. No se pueden generar mas inscripciones.</p>` : ""}
    </div>
  `;

  document.body.appendChild(modal);

  const cerrarModal = () => modal.remove();
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
  });
  modal.querySelector("#cancelar").addEventListener("click", cerrarModal);

  const form = modal.querySelector("#form-asignacion");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const miembroId = Number(form.miembroId.value);
    if (!miembroId) return;

    await apiCrearMiembroXClase({
      miembroId,
      claseId: claseSeleccionada.claseId ?? claseSeleccionada.id,
      fechaInscripcion: new Date().toISOString()
    });

    cerrarModal();
    await actualizarTablaParaClase(contenedor);
    alert("Miembro inscrito correctamente.");
  });
};

export const renderizarVistaMiembroXClase = async (contenedor) => {
  contenedor.dataset.vistaActiva = "miembroXClase";
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.cabecera}">
        <h2>Inscripcion de miembros en clases</h2>
        <div class="${estilos.filaSelect}">
          <label>Seleccionar clase:</label>
          <select id="selectClase" class="${estilos.selectInput}">
            <option value="">-- Selecciona una clase --</option>
          </select>
          <button id="boton-agregar" class="${estilos.botonAgregar}">+ Inscribir</button>
        </div>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>ID</th>
              <th>Miembro</th>
              <th>Entrenador</th>
              <th>Fecha inscripcion</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla-miembrosxclase">
            <tr><td colspan="4">Selecciona una clase para ver sus miembros.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  listaClases = await apiObtenerClases();
  const select = contenedor.querySelector("#selectClase");

  listaClases.forEach((clase) => {
    const option = document.createElement("option");
    option.value = normalizarId(clase.id ?? clase.claseId);
    option.textContent = `${clase.actividad?.nombre || "Sin actividad"} - ${clase.entrenador?.nombre || "Entrenador por definir"} (${new Date(clase.fecha).toLocaleDateString()})`;
    select.appendChild(option);
  });

  select.addEventListener("change", async () => {
    const idSeleccionado = select.value;
    claseSeleccionada = listaClases.find(
      (clase) => normalizarId(clase.id ?? clase.claseId) === idSeleccionado
    );
    await actualizarTablaParaClase(contenedor);
  });

  contenedor.querySelector("#boton-agregar").addEventListener("click", () => {
    abrirModalAsignar(contenedor);
  });
};
