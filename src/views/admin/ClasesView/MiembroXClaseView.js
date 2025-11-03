import estilos from "./ClasesView.module.css";
import { apiObtenerMiembros } from "../../../api/membersApi.js";
import { apiObtenerClases } from "../../../api/apiClases.js";
import {
  apiObtenerMiembrosXClase,
  apiCrearMiembroXClase,
  apiEliminarMiembroXClase
} from "../../../api/apiMiembroxClase.js";

let listaMiembrosXClase = [];
let listaClases = [];
let claseSeleccionada = null;

/**
 * Vista principal para asignar miembros a las clases
 */
export const renderizarVistaMiembroXClase = async (contenedor) => {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.cabecera}">
        <h2>🧍‍♂️ Asignación de Miembros a Clases</h2>
        <div class="${estilos.filaSelect}">
          <label>Seleccionar Clase:</label>
          <select id="selectClase" class="${estilos.selectInput}">
            <option value="">-- Seleccioná una clase --</option>
          </select>
          <button id="boton-agregar" class="${estilos.botonAgregar}">+ Asignar Miembro</button>
        </div>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>ID</th>
              <th>Miembro</th>
              <th>Entrenador</th>
              <th>Fecha Inscripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla-miembrosxclase">
            <tr><td colspan="5">Seleccioná una clase para ver sus miembros</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  listaClases = await apiObtenerClases();
  const select = contenedor.querySelector("#selectClase");
  listaClases.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id ?? c.claseId;
    opt.textContent = `${c.actividad?.nombre} - ${c.entrenador?.nombre || "Sin entrenador"} (${new Date(c.fecha).toLocaleDateString()})`;
    select.appendChild(opt);
  });

  // Eventos
  select.addEventListener("change", async () => {
    const id = select.value;
    claseSeleccionada = listaClases.find(c => c.id == id || c.claseId == id);
    if (!id) {
      renderTabla([], contenedor);
      return;
    }

    listaMiembrosXClase = await apiObtenerMiembrosXClase();
    const filtrados = listaMiembrosXClase.filter(mx => mx.clase?.id == id || mx.clase?.claseId == id);
    renderTabla(filtrados, contenedor);
  });

  contenedor.querySelector("#boton-agregar").addEventListener("click", () => {
    if (!claseSeleccionada) {
      alert("⚠️ Primero seleccioná una clase.");
      return;
    }
    abrirModalAsignar(claseSeleccionada, contenedor);
  });
};

/**
 * Renderiza tabla con los miembros asignados a la clase
 */
function renderTabla(lista, contenedor) {
  const cuerpo = contenedor.querySelector("#cuerpo-tabla-miembrosxclase");
  cuerpo.innerHTML = "";

  if (lista.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="5">No hay miembros asignados.</td></tr>`;
    return;
  }

  lista.forEach(m => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${m.miembroXClaseId}</td>
      <td>${m.miembro?.nombre || "-"}</td>
      <td>${m.miembro?.entrenador?.nombre || "-"}</td>
      <td>${new Date(m.fechaInscripcion).toLocaleDateString()}</td>
      <td class="${estilos.acciones}">
        <button class="${estilos.botonEliminar}" data-id="${m.miembroXClaseId}">Eliminar</button>
      </td>
    `;
    cuerpo.appendChild(fila);
  });

  // Listener eliminar
  cuerpo.querySelectorAll(`.${estilos.botonEliminar}`).forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("¿Eliminar asignación?")) {
        await apiEliminarMiembroXClase(id);
        const nuevaLista = lista.filter(m => m.miembroXClaseId != id);
        renderTabla(nuevaLista, contenedor);
      }
    });
  });
}

/**
 * Modal para asignar un nuevo miembro a la clase
 */
async function abrirModalAsignar(clase, contenedor) {
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const miembros = await apiObtenerMiembros();
  const asignados = listaMiembrosXClase.filter(mx => mx.clase?.id == clase.id || mx.clase?.claseId == clase.claseId);
  const cupoActual = asignados.length;
  const cupoMaximo = clase.cupo || 0;

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>Asignar Miembro a "${clase.actividad?.nombre}"</h3>
      <p><strong>Cupo:</strong> ${cupoActual}/${cupoMaximo}</p>

      <form id="form-asignacion">
        <label>Seleccionar Miembro</label>
        <select id="miembroId" required>
          <option value="">-- Seleccioná un miembro --</option>
          ${miembros.map(m => `<option value="${m.id}">${m.nombre} (${m.email})</option>`).join("")}
        </select>

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit" ${cupoActual >= cupoMaximo ? "disabled" : ""}>Asignar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#form-asignacion");
  const btnCancelar = modal.querySelector("#cancelar");

  btnCancelar.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const miembroId = parseInt(e.target.miembroId.value, 10);

    if (cupoActual >= cupoMaximo) {
      alert("⚠️ No se pueden asignar más miembros, la clase está llena.");
      modal.remove();
      return;
    }

    await apiCrearMiembroXClase({
      miembroId,
      claseId: clase.id ?? clase.claseId,
      fechaInscripcion: new Date().toISOString()
    });

    alert("✅ Miembro asignado correctamente");
    modal.remove();

    listaMiembrosXClase = await apiObtenerMiembrosXClase();
    const filtrados = listaMiembrosXClase.filter(mx => mx.clase?.id == clase.id || mx.clase?.claseId == clase.claseId);
    renderTabla(filtrados, contenedor);
  });
}
