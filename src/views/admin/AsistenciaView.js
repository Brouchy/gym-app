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
import { apiObtenerMiembros } from "../../api/membersApi.js";
import { apiObtenerEntrenadores} from "../../api/trainersApi.js";

import {
  apiObtenerAsistenciasEntrenadores,
  apiCrearAsistenciaEntrenador,
  apiEliminarAsistenciaEntrenador
} from "../../api/apiAsistenciaTrainer.js";



let listaAsistencias = [];
let listaClases = [];
let listaTiposAsistencia = [];
let claseSeleccionada = null;
let paginaActual = 1;
const FILAS_POR_PAGINA = 6;
let bloqueActual = "clases"; // "clases" | "gym" | "entrenadores"


// ========================================================
// 🔹 Bloque de asistencia a clases
// ========================================================
async function renderBloqueClases(divClases) {
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
            <th>Hora</th>
            <th>Miembro</th>
            <th>Actividad</th>
            <th>Entrenador</th>
            <th>Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="cuerpo-asistencias">
          <tr><td colspan="7">Seleccioná una clase para ver asistencias</td></tr>
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
    abrirModalAsistenciaMiembros(divClases);
  });
}

// ========================================================
// 🔹 Render Tabla Miembros
// ========================================================
function renderTablaMiembros(lista, contenedor) {
  const cuerpo = contenedor.querySelector("#cuerpo-asistencias");
  const indicador = contenedor.querySelector("#indicador-pagina");
  const btnPrev = contenedor.querySelector("#boton-prev");
  const btnNext = contenedor.querySelector("#boton-next");

  if (!lista || lista.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="7">No hay asistencias registradas.</td></tr>`;
    btnPrev.disabled = btnNext.disabled = true;
    indicador.textContent = "Página 1 de 1";
    return;
  }

  const listaOrdenada = [...lista].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  const totalPaginas = Math.ceil(listaOrdenada.length / FILAS_POR_PAGINA);
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = listaOrdenada.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML = pagina.map(a => {
    const miembro = a.miembroXClase?.miembro || {};
    const clase = a.miembroXClase?.clase || {};
    const actividadNombre = clase.actividad?.nombre || "Sin actividad";

    return `
      <tr>
        <td>${new Date(a.fecha).toLocaleDateString()}</td>
        <td>${new Date(a.fecha).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</td>
        <td>${miembro.nombre || "-"} ${miembro.apellido || ""}</td>
        <td>${actividadNombre}</td>
        <td>${clase.entrenador?.nombre || "-"}</td>
        <td>${a.tipoDeAsistencia?.descripcion || "-"}</td>
        <td class="${estilos.acciones}">
          <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-id="${a.asistenciaId}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
          </svg>
          <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-id="${a.asistenciaId}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M9 3h6v1h5v2H4V4h5V3zm1 4h1v10h-1V7zm4 0h1v10h-1V7zm-7 0h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
          </svg>
        </td>
      </tr>
    `;
  }).join("");

  indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas;

  btnPrev.onclick = () => { paginaActual--; renderTablaMiembros(lista, contenedor); };
  btnNext.onclick = () => { paginaActual++; renderTablaMiembros(lista, contenedor); };

  // Eventos
  cuerpo.querySelectorAll(`.${estilos.botonEliminar}`).forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("¿Eliminar asistencia?")) {
        await apiEliminarAsistencia(id);
        listaAsistencias = listaAsistencias.filter(a => a.asistenciaId != id);
        renderTablaMiembros(listaAsistencias, contenedor);
      }
    })
  );

  cuerpo.querySelectorAll(`.${estilos.botonEditar}`).forEach(btn =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const asistencia = listaAsistencias.find(a => a.asistenciaId == id);
      abrirModalAsistenciaMiembros(contenedor, asistencia);
    })
  );
}


// ========================================================
// 🔹 Modal de asistencia para miembros
// ========================================================
async function abrirModalAsistenciaMiembros(divClases, asistencia = null) {
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const miembrosDeClase = await apiObtenerMiembrosXClase();

  // Filtrado de miembros según la clase seleccionada (IDs seguros)
  let miembrosFiltrados = miembrosDeClase.filter(m => {
    const claseIdMiembro = m.claseId ?? m.clase?.id;
    const claseIdSeleccionada = claseSeleccionada.id ?? claseSeleccionada.claseId;
    return claseIdMiembro == claseIdSeleccionada; // == para manejar string/number
  });

  // Excluir miembros que ya tengan asistencia hoy si es nueva
  if (!asistencia) {
    const hoy = new Date().toISOString().slice(0, 10);
    miembrosFiltrados = miembrosFiltrados.filter(m =>
      !listaAsistencias.some(a =>
        a.miembroXClase?.id == m.id && a.fecha.slice(0, 10) === hoy
      )
    );
  }

  // Ordenar alfabéticamente
  miembrosFiltrados.sort((a, b) =>
    (a.miembro?.apellido || "").localeCompare(b.miembro?.apellido || "", "es", { sensitivity: "base" })
  );

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${asistencia ? "Editar Asistencia" : "Registrar Asistencia"}</h3>
      <form id="form-asistencia">
        <label>Miembro:</label>
        <select id="miembroXClaseId" required ${asistencia ? "disabled" : ""}>
          <option value="">-- Seleccioná un miembro --</option>
          ${miembrosFiltrados.map(m => {
            const nombre = m.miembro?.nombre || "Sin nombre";
            const apellido = m.miembro?.apellido || "";
            return `<option value="${m.id}" ${asistencia?.miembroXClase?.id == m.id ? "selected" : ""}>${apellido} ${nombre}</option>`;
          }).join("")}
        </select>

        <label>Tipo de Asistencia:</label>
        <select id="tipoDeAsistenciaId" required>
          <option value="">-- Seleccioná un tipo --</option>
          ${listaTiposAsistencia.map(t => `<option value="${t.id}" ${asistencia?.tipoDeAsistencia?.id == t.id ? "selected" : ""}>${t.descripcion}</option>`).join("")}
        </select>

        <label>Fecha y Hora:</label>
        <input type="datetime-local" id="fechaAsistencia" value="${new Date().toISOString().slice(0,16)}" required/>

        <div style="margin-top:15px; text-align:right;">
          <button type="submit" class="${estilos.botonAgregar}">${asistencia ? "Actualizar" : "Registrar"}</button>
          <button type="button" class="${estilos.botonEliminar}" id="cerrarModal">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector("#cerrarModal").addEventListener("click", () => modal.remove());

  modal.querySelector("#form-asistencia").addEventListener("submit", async (e) => {
    e.preventDefault();
    const miembroXClaseId = modal.querySelector("#miembroXClaseId").value;
    const tipoDeAsistenciaId = modal.querySelector("#tipoDeAsistenciaId").value;
    const fecha = modal.querySelector("#fechaAsistencia").value;

    if (!miembroXClaseId || !tipoDeAsistenciaId || !fecha) return alert("Todos los campos son obligatorios.");

    const data = { miembroXClaseId, tipoDeAsistenciaId, fecha };

    let nuevaAsistencia;
    if (asistencia) {
      nuevaAsistencia = await apiActualizarAsistencia(asistencia.asistenciaId, data);
    } else {
      nuevaAsistencia = await apiCrearAsistencia(data);
    }

    if (nuevaAsistencia) {
      if (asistencia) {
        const idx = listaAsistencias.findIndex(a => a.asistenciaId == asistencia.asistenciaId);
        listaAsistencias[idx] = {
          ...nuevaAsistencia,
          miembroXClase: miembrosDeClase.find(m => m.id == miembroXClaseId),
          tipoDeAsistencia: listaTiposAsistencia.find(t => t.id == tipoDeAsistenciaId)
        };
      } else {
        listaAsistencias.push({
          ...nuevaAsistencia,
          miembroXClase: miembrosDeClase.find(m => m.id == miembroXClaseId),
          tipoDeAsistencia: listaTiposAsistencia.find(t => t.id == tipoDeAsistenciaId)
        });
      }
      renderTablaMiembros(listaAsistencias, divClases);
      modal.remove();
    }
  });
}

// ========================================================
// 🔹 Bloque de asistencia al gimnasio
// ========================================================
async function renderBloqueGym(divGym) {
  const miembros = await apiObtenerMiembros();
  const tiposAsistencia = await apiObtenerTiposDeAsistencia(); // Para mostrar el tipo de asistencia

  divGym.innerHTML = `
    <div class="${estilos.cabecera}" style="flex-wrap:wrap; gap:20px; align-items:flex-start;">
      <div style="flex:1; position:relative; display:flex; flex-direction:column; gap:10px;">
        <label>Buscar miembro por nombre o DNI:</label>
        <input type="text" id="inputBuscarMiembro" class="${estilos.inputBuscar}" placeholder="Escribí nombre o DNI..." autocomplete="off"/>
        <div id="sugerenciasMiembro" class="${estilos.sugerencias}"></div>
        <button id="boton-registrar-gym" class="${estilos.botonAgregar}" style="width:fit-content; align-self:flex-start;" disabled>Registrar Asistencia</button>
      </div>
      <div id="cardMiembroSeleccionado" class="${estilos.cardMiembro}" style="flex:1; display:none; color:#000;"></div>
    </div>

    <div class="${estilos.tablaWrapper}">
      <table class="${estilos.tabla}">
        <thead>
          <tr>
            <th>Miembro</th>
            <th>DNI</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="cuerpo-asistencias-gym">
          <tr><td colspan="6">No hay asistencias registradas.</td></tr>
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

  // Obtener asistencias y mapear los miembros y tipos completos
  let listaAsistenciasGym = (await apiObtenerAsistenciasCompletas())
    .filter(a => !a.miembroXClase)
    .map(a => {
      const miembro = miembros.find(m => m.id === a.miembroId) || {};
      const tipo = tiposAsistencia.find(t => t.id === a.tipoDeAsistenciaId) || {};
      return {
        ...a,
        miembro,
        tipoDeAsistencia: tipo
      };
    });

  const mostrarTabla = () => {
    if (listaAsistenciasGym.length === 0) {
      cuerpoTabla.innerHTML = `<tr><td colspan="6">No hay asistencias registradas.</td></tr>`;
      return;
    }

    cuerpoTabla.innerHTML = listaAsistenciasGym
      .map((a) => {
        const fechaObj = new Date(a.fecha);
        const fecha = fechaObj.toLocaleDateString();
        const hora = fechaObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `
          <tr>
            <td>${a.miembro?.nombre ? `${a.miembro.nombre} ${a.miembro.apellidos || ""}`.trim() : "-"}</td>
            <td>${a.miembro?.dni || "-"}</td>
            <td>${fecha}</td>
            <td>${hora}</td>
            <td>${a.tipoDeAsistencia?.descripcion || "-"}</td>
            <td>
              <button class="${estilos.botonEliminar}" data-id="${a.asistenciaId}">Eliminar</button>
            </td>
          </tr>
        `;
      })
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

  // Buscador predictivo
  inputBuscar.addEventListener("input", () => {
    const texto = inputBuscar.value.trim().toLowerCase();
    divSugerencias.innerHTML = "";
    miembroSeleccionado = null;
    btnRegistrar.disabled = true;
    cardMiembro.style.display = "none";

    if (!texto) return;

    const esNumero = /^[0-9]+$/.test(texto);

    let coincidencias;
    if (esNumero) {
      coincidencias = miembros.filter((m) => String(m.dni).startsWith(texto));
      coincidencias.sort((a, b) => a.dni - b.dni);
    } else {
      coincidencias = miembros.filter((m) => {
        const nombreCompleto = `${m.nombre} ${m.apellidos || ""}`.toLowerCase().trim();
        return nombreCompleto.startsWith(texto);
      });
      coincidencias.sort((a, b) => {
        const nA = `${a.nombre} ${a.apellidos || ""}`.trim();
        const nB = `${b.nombre} ${b.apellidos || ""}`.trim();
        return nA.localeCompare(nB, "es", { sensitivity: "base" });
      });
    }

    coincidencias.forEach((m) => {
      const nombreCompleto = `${m.nombre} ${m.apellidos || ""}`.trim();
      const div = document.createElement("div");
      div.classList.add(estilos.sugerenciaItem);
      div.innerHTML = `<b>${nombreCompleto}</b> (${m.dni})`;

      div.addEventListener("click", () => {
        miembroSeleccionado = m;
        inputBuscar.value = `${nombreCompleto} (${m.dni})`;
        divSugerencias.innerHTML = "";
        btnRegistrar.disabled = false;

        cardMiembro.innerHTML = `
          <div><strong>Nombre:</strong> ${nombreCompleto}</div>
          <div><strong>DNI:</strong> ${m.dni}</div>
          <div><strong>Email:</strong> ${m.email || "-"}</div>
          <div><strong>Teléfono:</strong> ${m.telefono || "-"}</div>
        `;
        cardMiembro.style.display = "block";
      });

      divSugerencias.appendChild(div);
    });
  });

  // Registrar asistencia
  btnRegistrar.addEventListener("click", async () => {
    if (!miembroSeleccionado) return;

    const nuevaAsistencia = {
      miembroId: miembroSeleccionado.id,
      tipoDeAsistenciaId: tiposAsistencia[0]?.id || null, // Podés cambiar si querés elegir tipo
      fecha: new Date().toISOString(),
    };

    const asistenciaCreada = await apiCrearAsistencia(nuevaAsistencia);

    if (asistenciaCreada) {
      const tipo = tiposAsistencia.find(t => t.id === nuevaAsistencia.tipoDeAsistenciaId) || {};
      listaAsistenciasGym.push({
        ...asistenciaCreada,
        miembro: miembroSeleccionado,
        tipoDeAsistencia: tipo,
      });
      mostrarTabla();
      inputBuscar.value = "";
      cardMiembro.style.display = "none";
      btnRegistrar.disabled = true;
    } else {
      alert("❌ No se pudo registrar la asistencia.");
    }
  });
}


// ========================================================
// 🔹 Bloque de asistencia a entrenadores
// ========================================================
async function renderBloqueEntrenadores(divEntrenadores) {
  const entrenadores = await apiObtenerEntrenadores();
  const asistencias = await apiObtenerAsistenciasEntrenadores();
  const clases = await apiObtenerClases();
  const tipos = await apiObtenerTiposDeAsistencia();

  // 🔸 Ordenar alfabéticamente por nombre y luego apellido
  entrenadores.sort((a, b) => {
    const nombreA = (a.nombre || "").toLowerCase();
    const nombreB = (b.nombre || "").toLowerCase();
    if (nombreA < nombreB) return -1;
    if (nombreA > nombreB) return 1;

    const apellidoA = (a.apellido || "").toLowerCase();
    const apellidoB = (b.apellido || "").toLowerCase();
    if (apellidoA < apellidoB) return -1;
    if (apellidoA > apellidoB) return 1;

    return 0;
  });

  divEntrenadores.innerHTML = `
    <div class="${estilos.cabecera}">
      <label>Seleccionar Entrenador:</label>
      <select id="selectEntrenador">
        <option value="">-- Seleccioná un entrenador --</option>
        ${entrenadores
          .map(
            (e) =>
              `<option value="${e.id}">${e.nombre} ${e.apellido || ""}</option>`
          )
          .join("")}
      </select>
      <button id="boton-agregar-entrenador" class="${estilos.botonAgregar}">
        + Registrar Asistencia
      </button>
    </div>

    <div class="${estilos.tablaWrapper}">
      <table class="${estilos.tabla}">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Entrenador</th>
            <th>DNI</th>
            <th>Clase</th>
            <th>Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="cuerpo-asistencias-entrenador">
          <tr><td colspan="7">Seleccioná un entrenador para ver asistencias</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const selectEntrenador = divEntrenadores.querySelector("#selectEntrenador");
  const cuerpo = divEntrenadores.querySelector("#cuerpo-asistencias-entrenador");
  const btnAgregar = divEntrenadores.querySelector("#boton-agregar-entrenador");

  // ========================
  // Función para mostrar asistencias
  // ========================
  const mostrarAsistenciasEntrenador = () => {
    const id = selectEntrenador.value;
    if (!id) {
      cuerpo.innerHTML = `<tr><td colspan="7">Seleccioná un entrenador para ver asistencias</td></tr>`;
      return;
    }

    const filtradas = asistencias.filter((a) => a.entrenadorId == id);

    if (filtradas.length === 0) {
      cuerpo.innerHTML = `<tr><td colspan="7">No hay asistencias registradas para este entrenador.</td></tr>`;
      return;
    }

    cuerpo.innerHTML = filtradas
      .map((a) => {
        const entrenador = entrenadores.find((e) => e.id == a.entrenadorId);
        const clase = clases.find((c) => c.id == a.claseId);
        const tipo = tipos.find((t) => t.id == a.tipoDeAsistenciaId);

        return `
          <tr>
            <td>${new Date(a.fecha).toLocaleDateString()}</td>
            <td>${new Date(a.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
            <td>${entrenador?.nombre || "-"} ${entrenador?.apellido || ""}</td>
            <td>${entrenador?.dni || "-"}</td>
            <td>${clase?.actividad?.nombre || "Sin clase"}</td>
            <td>${tipo?.descripcion || "Sin tipo"}</td>
            <td>
              <button class="${estilos.botonEliminar}" data-id="${a.id}">Eliminar</button>
            </td>
          </tr>`;
      })
      .join("");

    // ========================
    // Evento eliminar asistencia
    // ========================
    cuerpo.querySelectorAll(`.${estilos.botonEliminar}`).forEach((btn) =>
      btn.addEventListener("click", async () => {
        const idAsistencia = parseInt(btn.dataset.id);
        if (confirm("¿Eliminar asistencia?")) {
          const ok = await apiEliminarAsistenciaEntrenador(idAsistencia);
          if (ok) {
            btn.closest("tr").remove();
          } else {
            alert("❌ No se pudo eliminar la asistencia.");
          }
        }
      })
    );
  };

  selectEntrenador.addEventListener("change", mostrarAsistenciasEntrenador);

  // ========================
  // Abrir modal para registrar
  // ========================
  btnAgregar.addEventListener("click", () => {
    const id = selectEntrenador.value;
    if (!id) return alert("⚠️ Primero seleccioná un entrenador.");
    abrirModalAsistenciaEntrenador(divEntrenadores, id);
  });
}

// ========================================================
// 🔹 Modal para registrar asistencia de entrenador (sin cambios mayores)
// ========================================================
async function abrirModalAsistenciaEntrenador(div, entrenadorId) {
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const entrenadores = await apiObtenerEntrenadores();
  const clases = await apiObtenerClases();
  const tipos = await apiObtenerTiposDeAsistencia();

  const entrenador = entrenadores.find((e) => e.id == entrenadorId);
  const clasesDelEntrenador = clases.filter(
    (c) => c.entrenadorId == entrenadorId || c.entrenador?.id == entrenadorId
  );

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>Registrar Asistencia del Entrenador</h3>
      <form id="form-asistencia-entrenador">
        <label>Entrenador:</label>
        <input type="text" value="${entrenador.nombre} ${entrenador.apellido || ""}" disabled/>

        <label>DNI:</label>
        <input type="text" value="${entrenador.dni || '-'}" disabled/>

        <label>Clase:</label>
        <select id="claseId" required>
          <option value="">-- Seleccioná una clase --</option>
          ${clasesDelEntrenador
            .map(
              (c) =>
                `<option value="${c.id}">${c.actividad?.nombre || "Sin actividad"}</option>`
            )
            .join("")}
        </select>

        <label>Tipo de Asistencia:</label>
        <select id="tipoId" required>
          <option value="">-- Seleccioná un tipo --</option>
          ${tipos
            .map((t) => `<option value="${t.id}">${t.descripcion}</option>`)
            .join("")}
        </select>

        <label>Fecha y Hora:</label>
        <input type="datetime-local" id="fechaHora" value="${new Date()
          .toISOString()
          .slice(0, 16)}" required/>

        <div style="margin-top:15px; text-align:right;">
          <button type="submit" class="${estilos.botonAgregar}">Registrar</button>
          <button type="button" class="${estilos.botonEliminar}" id="cerrarModal">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#cerrarModal").addEventListener("click", () => modal.remove());

  modal
    .querySelector("#form-asistencia-entrenador")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const claseId = modal.querySelector("#claseId").value;
      const tipoId = modal.querySelector("#tipoId").value;
      const fecha = modal.querySelector("#fechaHora").value;

      if (!claseId || !tipoId || !fecha) {
        alert("⚠️ Todos los campos son obligatorios.");
        return;
      }

      const data = {
        entrenadorId,
        claseId,
        tipoDeAsistenciaId: tipoId,
        fecha,
      };

      try {
        const creada = await apiCrearAsistenciaEntrenador(data);
        if (creada) {
          alert("✅ Asistencia registrada correctamente.");
          modal.remove();

          // Re-renderizamos el bloque
          await renderBloqueEntrenadores(div);

          // Restauramos la selección del entrenador
          const select = div.querySelector("#selectEntrenador");
          select.value = entrenadorId;
          select.dispatchEvent(new Event("change"));
        }
      } catch (error) {
        console.error("Error al registrar asistencia:", error);
        alert("❌ Ocurrió un error al registrar la asistencia.");
      }
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
    cuerpo.innerHTML = `<tr><td colspan="7">No hay asistencias registradas.</td></tr>`;
    btnPrev.disabled = btnNext.disabled = true;
    indicador.textContent = "Página 1 de 1";
    return;
  }

  const totalPaginas = Math.ceil(lista.length / FILAS_POR_PAGINA);
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + FILAS_POR_PAGINA);

  cuerpo.innerHTML = pagina.map(
    (a) => `
      <tr>
        <td>${new Date(a.fecha).toLocaleDateString()}</td>
        <td>${new Date(a.fecha).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</td>
        <td>${a.miembroXClase?.miembro?.nombre || "-"}</td>
        <td>${a.miembroXClase?.clase?.actividad?.nombre || "-"}</td>
        <td>${a.miembroXClase?.clase?.entrenador?.nombre || "-"}</td>
        <td>${a.tipoDeAsistencia?.descripcion || "-"}</td>
        <td class="${estilos.acciones}">
          <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-id="${a.asistenciaId}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
          </svg>
          <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-id="${a.asistenciaId}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
            <path d="M9 3h6v1h5v2H4V4h5V3zm1 4h1v10h-1V7zm4 0h1v10h-1V7zm-7 0h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
          </svg>
        </td>
      </tr>
    `
  ).join("");

  indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas;

  btnPrev.onclick = () => { paginaActual--; renderTabla(lista, contenedor); };
  btnNext.onclick = () => { paginaActual++; renderTabla(lista, contenedor); };

  // Eventos
  cuerpo.querySelectorAll(`.${estilos.botonEliminar}`).forEach((btn) =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("¿Eliminar asistencia?")) {
        await apiEliminarAsistencia(id);
        listaAsistencias = listaAsistencias.filter(a => a.asistenciaId != id);
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
// 🔹 Modal de asistencia
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
          ${miembrosFiltrados.map((m) => {
            const nombre = m.miembro?.nombre || "Sin nombre";
            const apellido = m.miembro?.apellido ? ` ${m.miembro.apellido}` : "";
            const dni = m.miembro?.dni ? ` (${m.miembro.dni})` : "";
            return `<option value="${m.id}" ${asistencia?.miembroXClase?.miembroXClaseId == m.id ? "selected" : ""}>${nombre}${apellido}${dni}</option>`;
          }).join("")}
        </select>

        <label>Tipo de Asistencia:</label>
        <select id="tipoDeAsistenciaId" required>
          <option value="">-- Seleccioná un tipo --</option>
          ${listaTiposAsistencia.map((t) => `<option value="${t.id}" ${asistencia?.tipoDeAsistencia?.id == t.id ? "selected" : ""}>${t.descripcion}</option>`).join("")}
        </select>

        <label>Fecha y Hora:</label>
        <input type="datetime-local" id="fechaAsistencia" value="${asistencia ? new Date(asistencia.fecha).toISOString().slice(0,16) : new Date().toISOString().slice(0,16)}" required/>

        <div style="margin-top:15px; text-align:right;">
          <button type="submit" class="${estilos.botonAgregar}">${asistencia ? "Actualizar" : "Registrar"}</button>
          <button type="button" class="${estilos.botonEliminar}" id="cerrarModal">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#cerrarModal").addEventListener("click", () => modal.remove());

  modal.querySelector("#form-asistencia").addEventListener("submit", async (e) => {
    e.preventDefault();
    const miembroXClaseId = modal.querySelector("#miembroXClaseId").value;
    const tipoDeAsistenciaId = modal.querySelector("#tipoDeAsistenciaId").value;
    const fecha = modal.querySelector("#fechaAsistencia").value;

    if (!miembroXClaseId || !tipoDeAsistenciaId || !fecha) return alert("Todos los campos son obligatorios.");

    const data = { miembroXClaseId, tipoDeAsistenciaId, fecha };

    if (asistencia) {
      await apiActualizarAsistencia(asistencia.asistenciaId, data);
    } else {
      await apiCrearAsistencia(data);
    }

    modal.remove();
    cargarYMostrarAsistencias(divClases);
  });
}

// ========================================================
// 🔹 Función principal
// ========================================================
export const renderizarVistaAsistencia = async (contenedor) => {
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.tituloModulo}">
        <h2>Módulo de Asistencias</h2>
      </div>

      <div class="${estilos.filaTabs}">
        <button id="btn-clases" class="${estilos.tabActivo}">Asistencia a Clases</button>
        <button id="btn-gym" class="">Asistencia al Gimnasio</button>
        <button id="btn-entrenadores" class="">Asistencia a Entrenadores</button>
      </div>

      <div id="bloque-clases" class="${estilos.bloque}"></div>
      <div id="bloque-gym" class="${estilos.bloque}" style="display:none;"></div>
      <div id="bloque-entrenadores" class="${estilos.bloque}" style="display:none;"></div>
    </div>
  `;

  const btnClases = contenedor.querySelector("#btn-clases");
  const btnGym = contenedor.querySelector("#btn-gym");
  const btnEntrenadores = contenedor.querySelector("#btn-entrenadores");

  const bloqueClases = contenedor.querySelector("#bloque-clases");
  const bloqueGym = contenedor.querySelector("#bloque-gym");
  const bloqueEntrenadores = contenedor.querySelector("#bloque-entrenadores");

  const mostrarBloque = (activo) => {
    bloqueClases.style.display = activo === "clases" ? "block" : "none";
    bloqueGym.style.display = activo === "gym" ? "block" : "none";
    bloqueEntrenadores.style.display = activo === "entrenadores" ? "block" : "none";

    btnClases.classList.toggle(estilos.tabActivo, activo === "clases");
    btnGym.classList.toggle(estilos.tabActivo, activo === "gym");
    btnEntrenadores.classList.toggle(estilos.tabActivo, activo === "entrenadores");
  };

  btnClases.addEventListener("click", () => mostrarBloque("clases"));
  btnGym.addEventListener("click", () => mostrarBloque("gym"));
  btnEntrenadores.addEventListener("click", () => mostrarBloque("entrenadores"));

  await renderBloqueClases(bloqueClases);
  await renderBloqueGym(bloqueGym);
  await renderBloqueEntrenadores(bloqueEntrenadores);

  mostrarBloque("clases");
};
