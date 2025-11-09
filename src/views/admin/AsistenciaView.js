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
import { apiObtenerMiembros } from "../../api/membersApi.js"; // Para asistencia al gym

let listaAsistencias = [];
let listaClases = [];
let listaTiposAsistencia = [];
let claseSeleccionada = null;
let paginaActual = 1;
const FILAS_POR_PAGINA = 6;

let bloqueActual = "clases"; // "clases" | "gym"

// ========================================================
// 🔹 Render principal
// ========================================================
export const renderizarVistaAsistencia = async (contenedor) => {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.tituloModulo}">
        <h2>Registro de Asistencias</h2>
      </div>

      <div class="${estilos.bloquesSelector}">
        <button id="btn-clases" class="${estilos.botonBloque}">Asistencia a Clases</button>
        <button id="btn-gym" class="${estilos.botonBloque}">Asistencia al Gimnasio</button>
      </div>

      <div id="bloque-clases"></div>
      <div id="bloque-gym" style="display:none;"></div>
    </div>
  `;

  const btnClases = contenedor.querySelector("#btn-clases");
  const btnGym = contenedor.querySelector("#btn-gym");
  const divClases = contenedor.querySelector("#bloque-clases");
  const divGym = contenedor.querySelector("#bloque-gym");

  // Bloque clases
  btnClases.addEventListener("click", async () => {
    bloqueActual = "clases";
    divClases.style.display = "block";
    divGym.style.display = "none";
  });
  await renderBloqueClases(divClases, contenedor);

  // Bloque gym
  btnGym.addEventListener("click", async () => {
    bloqueActual = "gym";
    divClases.style.display = "none";
    divGym.style.display = "block";
    await renderBloqueGym(divGym);
  });
};

// ========================================================
// 🔹 Bloque de asistencia a clases
// ========================================================
async function renderBloqueClases(divClases, contenedorPadre) {
  divClases.innerHTML = `
    <div class="${estilos.cabecera}">
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
  `;

  listaClases = await apiObtenerClases();
  listaTiposAsistencia = await apiObtenerTiposDeAsistencia();
  const selectClase = divClases.querySelector("#selectClase");

  listaClases.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id ?? c.claseId;
    opt.textContent = `${c.actividad?.nombre || "Sin actividad"} - ${c.entrenador?.nombre || "Sin entrenador"} (${new Date(c.fecha).toLocaleDateString()})`;
    selectClase.appendChild(opt);
  });

  selectClase.addEventListener("change", async () => {
    const id = selectClase.value;
    if (!id) {
      renderTabla([], divClases);
      return;
    }
    claseSeleccionada = listaClases.find((c) => c.id == id || c.claseId == id);
    await cargarYMostrarAsistencias(divClases);
  });

  divClases.querySelector("#boton-agregar").addEventListener("click", () => {
    if (!claseSeleccionada) return alert("⚠️ Primero seleccioná una clase.");
    abrirModalAsistencia(divClases);
  });
}

// ========================================================
// 🔹 Cargar y mostrar asistencias
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
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("¿Eliminar asistencia?")) {
        await apiEliminarAsistencia(id);
        listaAsistencias = listaAsistencias.filter((a) => a.asistenciaId != id);
        renderTabla(listaAsistencias, contenedor);
      }
    })
  );

  cuerpo.querySelectorAll(`.${estilos.botonEditar}`).forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const asistencia = listaAsistencias.find((a) => a.asistenciaId == id);
      abrirModalAsistencia(contenedor, asistencia);
    })
  );
}

// ========================================================
// 🔹 Modal de asistencia (orden alfabético + DNI)
// ========================================================
async function abrirModalAsistencia(divClases, asistencia = null) {
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const miembrosDeClase = await apiObtenerMiembrosXClase();
  const miembrosFiltrados = miembrosDeClase.filter(
    (m) => m.claseId == claseSeleccionada.id || m.clase?.id == claseSeleccionada.id
  );

  miembrosFiltrados.sort((a, b) =>
    (a.miembro?.nombre || "").localeCompare(b.miembro?.nombre || "", "es", { sensitivity: "base" })
  );

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${asistencia ? "Editar Asistencia" : "Registrar Asistencia"}</h3>
      <form id="form-asistencia">
        <label>Miembro:</label>
        <select id="miembroXClaseId" required>
          <option value="">-- Seleccioná un miembro --</option>
          ${miembrosFiltrados
            .map((m) => {
              const nombre = m.miembro?.nombre || "Sin nombre";
              const apellido = m.miembro?.apellido ? ` ${m.miembro.apellido}` : "";
              const dni = m.miembro?.dni ? ` (${m.miembro.dni})` : "";
              return `<option value="${m.id}" ${
                asistencia?.miembroXClase?.miembroXClaseId == m.id ? "selected" : ""
              }>${nombre}${apellido}${dni}</option>`;
            })
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
        <input
          type="date"
          id="fecha"
          value="${
            asistencia
              ? new Date(asistencia.fecha).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]
          }"
          required
        >

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#cancelar").addEventListener("click", () => modal.remove());

  modal.querySelector("#form-asistencia").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nueva = {
      miembroXClaseId: parseInt(modal.querySelector("#miembroXClaseId").value),
      tipoDeAsistenciaId: parseInt(modal.querySelector("#tipoDeAsistenciaId").value),
      fecha: modal.querySelector("#fecha").value,
    };
    if (asistencia) await apiActualizarAsistencia(asistencia.asistenciaId, nueva);
    else await apiCrearAsistencia(nueva);
    modal.remove();
    await cargarYMostrarAsistencias(divClases);
  });
}

// ========================================================
// 🔹 Bloque de asistencia al gimnasio
// ========================================================
async function renderBloqueGym(divGym) {
  const miembros = await apiObtenerMiembros();

  divGym.innerHTML = `
    <div class="${estilos.cabecera}" style="flex-wrap:wrap; gap:20px; align-items:flex-start;">
      <div style="flex:1; position:relative;">
        <label>Buscar miembro por nombre o DNI:</label>
        <input type="text" id="inputBuscarMiembro" class="${estilos.inputBuscar}" placeholder="Escribí nombre o DNI..." autocomplete="off"/>
        <div id="sugerenciasMiembro" class="${estilos.sugerencias}"></div>
        <button id="boton-registrar-gym" class="${estilos.botonAgregar}" disabled>Registrar Asistencia</button>
      </div>
      <div id="cardMiembroSeleccionado" class="${estilos.cardMiembro}" style="flex:1; display:none; color:#000;"></div>
    </div>

    <div class="${estilos.tablaWrapper}">
      <table class="${estilos.tabla}">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Miembro</th>
            <th>Membresía</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="cuerpo-asistencias-gym">
          <tr><td colspan="4">No hay asistencias registradas.</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const inputBuscar = divGym.querySelector("#inputBuscarMiembro");
  const divSugerencias = divGym.querySelector("#sugerenciasMiembro");
  const btnRegistrar = divGym.querySelector("#boton-registrar-gym");
  const cardMiembro = divGym.querySelector("#cardMiembroSeleccionado");
  const cuerpoTabla = divGym.querySelector("#cuerpo-asistencias-gym");

  let miembroSeleccionado = null;
  let listaAsistenciasGym = await apiObtenerAsistenciasCompletas();
  listaAsistenciasGym = listaAsistenciasGym.filter((a) => !a.miembroXClase);

  const mostrarTabla = () => {
    if (listaAsistenciasGym.length === 0) {
      cuerpoTabla.innerHTML = `<tr><td colspan="4">No hay asistencias registradas.</td></tr>`;
      return;
    }
    cuerpoTabla.innerHTML = listaAsistenciasGym
      .map(
        (a) => `
      <tr>
        <td>${new Date(a.fecha).toLocaleString()}</td>
        <td>${a.miembro?.nombre || "-"}</td>
        <td>${a.membresiaXMiembro?.membresia?.nombrePlan || "-"}</td>
        <td>
          <button class="${estilos.botonEliminar}" data-id="${a.asistenciaId}">Eliminar</button>
        </td>
      </tr>
    `
      )
      .join("");

    cuerpoTabla.querySelectorAll(`.${estilos.botonEliminar}`).forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        const ok = await apiEliminarAsistencia(id);
        if (ok) {
          listaAsistenciasGym = listaAsistenciasGym.filter((a) => a.asistenciaId !== id);
          mostrarTabla();
        }
      })
    );
  };
  mostrarTabla();

  inputBuscar.addEventListener("input", () => {
    const texto = inputBuscar.value.toLowerCase().trim();
    divSugerencias.innerHTML = "";
    miembroSeleccionado = null;
    btnRegistrar.disabled = true;
    cardMiembro.style.display = "none";

    if (!texto) return;

    const coincidencias = miembros.filter(
      (m) => m.nombre.toLowerCase().includes(texto) || String(m.dni).includes(texto)
    );

    coincidencias.forEach((m) => {
      const div = document.createElement("div");
      div.classList.add(estilos.sugerenciaItem);
      div.innerHTML = `<b>${m.nombre}</b> (${m.dni})`;

      div.addEventListener("click", () => {
        miembroSeleccionado = m;
        inputBuscar.value = `${m.nombre} (${m.dni})`;
        divSugerencias.innerHTML = "";
        btnRegistrar.disabled = false;

        cardMiembro.innerHTML = `
          <div><strong>Nombre:</strong> ${m.nombre}</div>
          <div><strong>DNI:</strong> ${m.dni}</div>
          <div><strong>Email:</strong> ${m.email || "-"}</div>
          <div><strong>Teléfono:</strong> ${m.telefono || "-"}</div>
        `;
        cardMiembro.style.display = "block";
      });

      divSugerencias.appendChild(div);
    });
  });

  document.addEventListener("click", (e) => {
    if (!divGym.contains(e.target)) divSugerencias.innerHTML = "";
  });

  btnRegistrar.addEventListener("click", async () => {
    if (!miembroSeleccionado) return alert("⚠️ Seleccioná un miembro de la lista.");
    const asistencia = {
      miembroId: miembroSeleccionado.id,
      fecha: new Date().toISOString(),
    };
    const nueva = await apiCrearAsistencia(asistencia);
    listaAsistenciasGym.push(nueva);
    mostrarTabla();
    inputBuscar.value = "";
    cardMiembro.style.display = "none";
    btnRegistrar.disabled = true;
  });
}
