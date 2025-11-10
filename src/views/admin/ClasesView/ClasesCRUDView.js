import estilos from "./ClasesView.module.css";
import { apiObtenerClases, apiCrearClase, apiActualizarClase, apiEliminarClase } from "../../../api/apiClases.js";
import { apiObtenerActividades } from "../../../api/apiActividades.js";
import { apiObtenerEntrenadores } from "../../../api/trainersApi.js";
import { apiObtenerMiembros } from "../../../api/membersApi.js";
import { apiObtenerMembresiasXMiembros } from "../../../api/membershipApi.js";
import { apiCrearMiembroXClase, apiObtenerMiembrosXClase, apiEliminarMiembroXClase } from "../../../api/apiMiembroxClase.js";

let listaClases = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;

const marcarListenersRegistrados = (contenedor) => {
  if (contenedor.dataset.clasesCrudListeners === "true") return false;
  contenedor.dataset.clasesCrudListeners = "true";
  return true;
};

// ==== Modal de Inscritos (activos) con cancelar inscripción ====
const abrirModalInscritos = async (contenedor, clase) => {
  if (!contenedor?.isConnected) return;
  const modal = document.createElement('div');
  modal.className = estilos.modalFondo;

  const claseId = (clase.id ?? clase.claseId);
  const [relaciones, miembros, registros] = await Promise.all([
    apiObtenerMiembrosXClase(),
    apiObtenerMiembros(),
    apiObtenerMembresiasXMiembros()
  ]);

  const estaActiva = (registro) => {
    if (!registro) return false;
    const inicio = registro.fechaInicio ? new Date(registro.fechaInicio).getTime() : null;
    const finDate = registro.fechaFin ? new Date(registro.fechaFin) : null;
    if (inicio == null || finDate == null) return false;
    const ahora = Date.now();
    const finInclusivo = new Date(
      finDate.getFullYear(), finDate.getMonth(), finDate.getDate(), 23,59,59,999
    ).getTime();
    return ahora >= inicio && ahora <= finInclusivo;
  };

  // Último registro de membresía por miembro
  const ultimoRegPorMiembro = new Map();
  for (const r of (registros || [])) {
    const mid = r.miembroId || r.miembro?.id;
    if (!mid) continue;
    const prev = ultimoRegPorMiembro.get(mid);
    const fCur = r.fechaFin ? new Date(r.fechaFin).getTime() : 0;
    const fPrev = prev?.fechaFin ? new Date(prev.fechaFin).getTime() : 0;
    if (!prev || fCur >= fPrev) ultimoRegPorMiembro.set(mid, r);
  }

  const inscritos = (relaciones || []).filter(r => r.claseId == claseId);
  const inscritosActivos = inscritos
    .map(r => {
      const m = (miembros || []).find(x => x.id == r.miembroId);
      const reg = ultimoRegPorMiembro.get(r.miembroId);
      return { rel: r, miembro: m, activo: estaActiva(reg) };
    })
    .filter(x => x.miembro && x.activo);

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>Miembros inscritos (activos)</h3>
      <div id="lista-inscritos" style="max-height:50vh;overflow:auto;display:flex;flex-direction:column;gap:8px;">
        ${inscritosActivos.length === 0 ? '<div class="'+estilos.vacio+'">No hay inscritos activos.</div>' : inscritosActivos.map(x => `
          <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #2a2a2a;border-radius:8px;padding:8px 10px;">
            <div>
              <div><strong>${x.miembro.nombre} ${x.miembro.apellidos || ''}</strong></div>
              <div style="font-size:0.9rem;color:#9ca3af;">ID ${x.miembro.id} · DNI ${x.miembro.dni || '-'}</div>
            </div>
            <button class="${estilos.botonEliminar}" data-rel-id="${x.rel.id}">Cancelar</button>
          </div>
        `).join('')}
      </div>
      <div class="${estilos.modalAcciones}"><button type="button" id="cerrar">Cerrar</button></div>
    </div>
  `;

  if (!document.body.contains(contenedor)) return;
  document.body.appendChild(modal);

  modal.querySelector('#cerrar').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  // Delegación para cancelar inscripción
  modal.addEventListener('click', async (e) => {
    const btn = e.target.closest(`[data-rel-id]`);
    if (!btn) return;
    const relId = parseInt(btn.dataset.relId);
    const rel = inscritos.find(r => r.id == relId);
    if (!rel) return;
    if (!confirm('¿Cancelar inscripción de este miembro?')) return;
    await apiEliminarMiembroXClase(relId);
    const claseCupo = Number(clase.cupo ?? 0);
    await apiActualizarClase(claseId, { ...clase, cupo: claseCupo + 1 });
    // Refrescar lista local/UI y el modal
    listaClases = await apiObtenerClases();
    renderizarTabla(contenedor);
    modal.remove();
    abrirModalInscritos(contenedor, listaClases.find(c => (c.id ?? c.claseId) == claseId));
  });
};

const handleCrudInput = (e) => {
  const contenedor = e.currentTarget;
  if (!contenedor?.isConnected || contenedor.dataset.vistaActiva !== "crud") return;
  if (!e.target.closest('[data-clases-crud="true"]')) return;
  if (e.target.matches("#buscador")) {
    paginaActual = 1;
    renderizarTabla(contenedor);
  }
};

const handleCrudClick = async (e) => {
  const contenedor = e.currentTarget;
  if (!contenedor?.isConnected || contenedor.dataset.vistaActiva !== "crud") return;
  if (!e.target.closest('[data-clases-crud="true"]')) return;

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
    abrirModal(contenedor);
    return;
  }

  const botonInscribir = e.target.closest(`.${estilos.botonInscribir}`);
  if (botonInscribir) {
    const id = botonInscribir.dataset.id;
    const clase = listaClases.find((c) => (c.id ?? c.claseId) == id);
    abrirModalInscripcion(contenedor, clase);
    return;
  }

  const botonVerInscritos = e.target.closest(`.${estilos.botonVerInscritos}`);
  if (botonVerInscritos) {
    const id = botonVerInscritos.dataset.id;
    const clase = listaClases.find((c) => (c.id ?? c.claseId) == id);
    abrirModalInscritos(contenedor, clase);
    return;
  }

  const botonEditar = e.target.closest(`.${estilos.botonEditar}`);
  if (botonEditar) {
    const id = botonEditar.dataset.id;
    const clase = listaClases.find((c) => c.id == id || c.claseId == id);
    abrirModal(contenedor, clase);
    return;
  }

  const botonEliminar = e.target.closest(`.${estilos.botonEliminar}`);
  if (botonEliminar) {
    if (confirm("¿Eliminar clase?")) {
      await apiEliminarClase(botonEliminar.dataset.id);
      listaClases = await apiObtenerClases();
      renderizarTabla(contenedor);
    }
    return;
  }

  const botonImprimir = e.target.closest(`.${estilos.botonImprimir}`);
  if (botonImprimir) {
    const id = botonImprimir.dataset.id;
    const clase = listaClases.find((c) => (c.id ?? c.claseId) == id);
    imprimirClase(clase);
    return;
  }
};

/**
 * CRUD de Clases (Actividad + Entrenador)
 */
export const renderizarVistaClasesCRUD = async (contenedor) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());

  contenedor.innerHTML = `
    <div data-clases-crud="true">
      <div class="${estilos.cabecera}">
        <input id="buscador" class="${estilos.buscador}" placeholder="Buscar por actividad o entrenador...">
        <button id="boton-agregar" class="${estilos.botonAgregar}">+ Nueva Clase</button>
      </div>

      <div id="grid-clases" class="${estilos.gridClases}"></div>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Página 1 de 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>
    </div>
  `;

  contenedor.dataset.vistaActiva = "crud";

  if (marcarListenersRegistrados(contenedor)) {
    contenedor.addEventListener("input", handleCrudInput);
    contenedor.addEventListener("click", handleCrudClick);
  }

  listaClases = await apiObtenerClases();
  renderizarTabla(contenedor);
};

const renderizarTabla = (contenedor) => {
  if (!contenedor?.isConnected) return;
  const grid = contenedor.querySelector("#grid-clases");
  const buscador = contenedor.querySelector("#buscador");
  const termino = (buscador.value || "").toLowerCase();

  const filtradas = listaClases.filter(
    (c) =>
      c.actividad?.nombre.toLowerCase().includes(termino) ||
      c.entrenador?.nombre.toLowerCase().includes(termino)
  );

  const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
  paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);

  grid.innerHTML =
    pagina.length === 0
      ? `<div class="${estilos.vacio}">No se encontraron clases.</div>`
      : pagina
          .map((c) => `
        <div class="${estilos.cardClase}">
          <div class="${estilos.cardHeader}">
            <div class="${estilos.badge}">${c.actividad?.nombre || "-"}</div>
            <div class="${estilos.accionesCard}">
              <!-- Lápiz (editar) minimal -->
              <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-id="${c.id ?? c.claseId}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83l-.75-.75 9.9-9.9.75.75-9.9 9.9zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
              </svg>
              <!-- Impresora minimal -->
              <svg class="${estilos.botonImprimir} ${estilos.accionIcon}" data-id="${c.id ?? c.claseId}" title="Imprimir" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9V3h12v6h2a3 3 0 0 1 3 3v5h-4v4H5v-4H1v-5a3 3 0 0 1 3-3h2zm2-4v4h8V5H8zm8 10H8v4h8v-4z"/>
              </svg>
              <!-- Tacho (eliminar) minimal -->
              <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-id="${c.id ?? c.claseId}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 21a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2H7zm10-16h-3.5l-1-1h-3L8.5 5H5v2h14V5zM9 9h1v9H9V9zm5 0h1v9h-1V9z"/>
              </svg>
            </div>
          </div>
          <div class="${estilos.cardBody}">
            <div class="${estilos.item}"><strong>Entrenador:</strong> ${c.entrenador?.nombre || '-'}</div>
            <div class="${estilos.item}"><strong>Fecha:</strong> ${new Date(c.fecha).toLocaleDateString()}</div>
            <div class="${estilos.item}"><strong>Horario:</strong> ${c.horaInicio} - ${c.horaFin}</div>
            <div class="${estilos.item}"><strong>Cupo:</strong> ${c.cupo}</div>
            <div class="${estilos.item}"><strong>Días:</strong> ${Array.isArray(c.dias) && c.dias.length ? c.dias.join(', ') : '-'}</div>
          </div>
          <div class="${estilos.cardFooter}">
            <div class="${estilos.footerLeft}">
              <button class="${estilos.botonVerInscritos}" data-id="${c.id ?? c.claseId}">Inscriptos</button>
            </div>
            <div class="${estilos.footerRight}">
              <button class="${estilos.botonInscribir}" data-id="${c.id ?? c.claseId}">Inscribir</button>
            </div>
          </div>
        </div>
      `).join("");
};

const abrirModal = async (contenedor, clase = null) => {
  if (!contenedor?.isConnected) return;
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  const actividades = await apiObtenerActividades();
  const entrenadores = await apiObtenerEntrenadores();
  if (!contenedor?.isConnected) return;

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${clase ? "Editar Clase" : "Nueva Clase"}</h3>
      <form id="form-clase">
        <label>Actividad</label>
        <select id="actividadId" required>
          <option value="">-- Seleccioná una actividad --</option>
          ${actividades.map(a => `<option value="${a.id}" ${clase?.actividad?.nombre === a.nombre ? 'selected' : ''}>${a.nombre}</option>`).join('')}
        </select>

        <label>Entrenador</label>
        <select id="entrenadorId" required>
          <option value="">-- Seleccioná un entrenador --</option>
          ${entrenadores.map(e => `<option value="${e.id}" ${clase?.entrenador?.nombre === e.nombre ? 'selected' : ''}>${e.nombre}</option>`).join('')}
        </select>

        <label>Fecha</label>
        <input type="date" id="fecha" value="${clase ? new Date(clase.fecha).toISOString().split("T")[0] : ""}" required>

        <label>Hora inicio</label>
        <input type="time" id="horaInicio" value="${clase?.horaInicio || ""}" required>

        <label>Hora fin</label>
        <input type="time" id="horaFin" value="${clase?.horaFin || ""}" required>

        <label>Cupo</label>
        <input type="number" id="cupo" value="${clase?.cupo || ""}" min="1" required>

        <label>Días específicos</label>
        <div id="diasEspecificos" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
          ${["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d => {
            const marcado = Array.isArray(clase?.dias) && clase.dias.includes(d) ? 'checked' : '';
            const id = `dia_${d}`;
            return `<label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" name="dias" value="${d}" ${marcado}> ${d}</label>`;
          }).join('')}
        </div>

        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit">${clase ? "Actualizar" : "Guardar"}</button>
        </div>
      </form>
    </div>
  `;

  if (!document.body.contains(contenedor)) return;
  document.body.appendChild(modal);

  modal.querySelector("#cancelar").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector("#form-clase").addEventListener("submit", async (e) => {
    e.preventDefault();
    const checks = Array.from(e.target.querySelectorAll('input[name="dias"]:checked'));
    const diasSeleccionados = checks.map(ch => ch.value);
    const nuevaClase = {
      actividadId: parseInt(e.target.actividadId.value),
      entrenadorId: parseInt(e.target.entrenadorId.value),
      fecha: new Date(e.target.fecha.value).toISOString(),
      horaInicio: e.target.horaInicio.value,
      horaFin: e.target.horaFin.value,
      cupo: parseInt(e.target.cupo.value),
      dias: diasSeleccionados,
    };
    if (clase) await apiActualizarClase(clase.id ?? clase.claseId, nuevaClase);
    else await apiCrearClase(nuevaClase);
    modal.remove();
    listaClases = await apiObtenerClases();
    renderizarTabla(contenedor);
  });
};

// ==== Modal de Inscripción (solo miembros activos) ====
const abrirModalInscripcion = async (contenedor, clase) => {
  if (!contenedor?.isConnected) return;
  const modal = document.createElement("div");
  modal.className = estilos.modalFondo;

  // Obtener miembros y registros de membresías
  const [miembros, registros] = await Promise.all([
    apiObtenerMiembros(),
    apiObtenerMembresiasXMiembros()
  ]);

  // Helper: estado activo por fecha/estado
  const estaActiva = (registro) => {
    if (!registro) return false;
    const inicio = registro.fechaInicio ? new Date(registro.fechaInicio).getTime() : null;
    const finDate = registro.fechaFin ? new Date(registro.fechaFin) : null;
    if (inicio == null || finDate == null) return false;
    const ahora = Date.now();
    const finInclusivo = new Date(
      finDate.getFullYear(), finDate.getMonth(), finDate.getDate(), 23,59,59,999
    ).getTime();
    return ahora >= inicio && ahora <= finInclusivo;
  };

  // Mapear último registro por miembro y filtrar activos
  const porMiembro = new Map();
  for (const r of (registros || [])) {
    const mid = r.miembroId || r.miembro?.id;
    if (!mid) continue;
    const actual = porMiembro.get(mid);
    const fCur = r.fechaFin ? new Date(r.fechaFin).getTime() : 0;
    const fAct = actual?.fechaFin ? new Date(actual.fechaFin).getTime() : 0;
    if (!actual || fCur >= fAct) porMiembro.set(mid, r);
  }
  const miembrosActivos = (miembros || []).filter(m => {
    const reg = porMiembro.get(m.id);
    return !!reg && estaActiva(reg) && !m.eliminado;
  });

  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>Inscribir a clase</h3>
      <form id="form-inscripcion">
        <label>Miembro activo</label>
        <select id="miembroId" required>
          <option value="">-- Seleccioná un miembro --</option>
          ${miembrosActivos.map(m => `<option value="${m.id}">${m.nombre} ${m.apellidos ?? ''} (ID ${m.id})</option>`).join('')}
        </select>
        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit">Inscribir</button>
        </div>
      </form>
    </div>
  `;

  if (!document.body.contains(contenedor)) return;
  document.body.appendChild(modal);

  modal.querySelector('#cancelar').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#form-inscripcion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const miembroId = parseInt(e.target.miembroId.value);
    if (!miembroId) return;
    const claseId = (clase.id ?? clase.claseId);

    // Validar cupo disponible
    const cupoActual = Number(clase.cupo ?? 0);
    if (cupoActual <= 0) {
      alert('No hay cupos disponibles para esta clase.');
      return;
    }

    // Evitar doble inscripción del mismo miembro
    const existentes = await apiObtenerMiembrosXClase();
    const yaInscripto = (existentes || []).some(r => (r.claseId == claseId) && (r.miembroId == miembroId));
    if (yaInscripto) {
      alert('Este miembro ya está inscripto en la clase.');
      return;
    }

    // Crear relación e impactar cupo (-1)
    await apiCrearMiembroXClase({ miembroId, claseId });
    await apiActualizarClase(claseId, { ...clase, cupo: cupoActual - 1 });

    // Refrescar dataset local y UI
    listaClases = await apiObtenerClases();
    renderizarTabla(contenedor);
    modal.remove();
  });
};

// ==== Imprimir datos de clase ====
const imprimirClase = (clase) => {
  if (!clase) return;
  const w = window.open('', '_blank', 'width=980,height=900');
  const fecha = new Date(clase.fecha).toLocaleDateString();
  const html = `
  <html>
    <head>
      <title>Clase ${clase.actividad?.nombre || ''}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; padding: 0; font-size: 18px; line-height: 1.5; color: #111; }
        h2 { margin-top: 0; font-size: 28px; }
        .item { margin: 10px 0; }
        .muted { color: #555; }
      </style>
    </head>
    <body>
      <h2>Datos de Clase</h2>
      <div class="item"><strong>Actividad:</strong> ${clase.actividad?.nombre || '-'}</div>
      <div class="item"><strong>Entrenador:</strong> ${clase.entrenador?.nombre || '-'}</div>
      <div class="item"><strong>Fecha:</strong> ${fecha}</div>
      <div class="item"><strong>Horario:</strong> ${clase.horaInicio} - ${clase.horaFin}</div>
      <div class="item"><strong>Cupo:</strong> ${clase.cupo}</div>
      <div class="item"><strong>Días:</strong> ${Array.isArray(clase.dias) && clase.dias.length ? clase.dias.join(', ') : '-'}</div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 400); };<\/script>
    </body>
  </html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
};
