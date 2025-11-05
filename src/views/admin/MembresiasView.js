import estilos from './MembresiasView.module.css';
import {
  apiObtenerMembresias,
  apiCrearMembresia,
  apiActualizarMembresia,
  apiEliminarMembresia,
  apiObtenerMembresiasXMiembros,
  apiCrearMembresiaXMiembro,
  apiObtenerTiposDeMembresia
} from '../../api/membershipApi.js';
import { apiObtenerMiembros } from '../../api/membersApi.js';
import { apiCrearPago } from '../../api/apiPago.js';

// --- Variables globales ---
let listaMembresias = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;

const asegurarListenersPlanes = (zona) => {
  if (zona.__planesListenersRegistrados) return;
  zona.addEventListener('click', manejarClickPlanes);
  zona.addEventListener('input', manejarInputPlanes);
  zona.__planesListenersRegistrados = true;
};

const manejarClickPlanes = async (e) => {
  const zona = e.currentTarget;
  if (!zona?.isConnected || zona.dataset.vistaActiva !== 'planes') return;
  if (!e.target.closest('[data-zona-planes="true"]')) return;

  const mostrarContenido = zona.__mostrarPlanes;
  if (typeof mostrarContenido !== 'function') return;

  if (e.target.closest('#boton-prev')) {
    paginaActual = Math.max(1, paginaActual - 1);
    mostrarContenido();
    return;
  }

  if (e.target.closest('#boton-next')) {
    paginaActual += 1;
    mostrarContenido();
    return;
  }

  if (e.target.closest('#boton-agregar')) {
    abrirModal(null, zona);
    return;
  }

  const botonEditar = e.target.closest(`.${estilos.botonEditar}`);
  if (botonEditar) {
    const registro = listaMembresias.find((m) => m.id == botonEditar.dataset.id);
    abrirModal(registro, zona);
    return;
  }

  const botonEliminar = e.target.closest(`.${estilos.botonEliminar}`);
  if (botonEliminar) {
    if (confirm('¿Eliminar esta membresía?')) {
      await apiEliminarMembresia(botonEliminar.dataset.id);
      listaMembresias = await apiObtenerMembresias();
      mostrarContenido();
    }
  }
};

const manejarInputPlanes = (e) => {
  const zona = e.currentTarget;
  if (!zona?.isConnected || zona.dataset.vistaActiva !== 'planes') return;
  if (!e.target.closest('[data-zona-planes="true"]')) return;

  const mostrarContenido = zona.__mostrarPlanes;
  if (typeof mostrarContenido !== 'function') return;

  if (e.target.matches('#buscador')) {
    paginaActual = 1;
    mostrarContenido();
  }
};

// ==============================
//  VISTA PRINCIPAL CON TABS
// ==============================
export const renderizarVistaMembresias = async (contenedor) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
    <div class="${estilos.tituloModulo}">
    <h2>Módulo de Gestión de Membresías</h2>
  </div>
    <div class="${estilos.tituloModulo}">
    
      <div class="${estilos.tabs}">
        <button id="tab-planes" class="${estilos.tab} ${estilos.activa}">Planes de Membresía</button>
        <button id="tab-asignaciones" class="${estilos.tab}">Asignaciones a Miembros</button>
      </div>
      <div id="zona-dinamica"></div>
    </div>
  `;

  const zonaDinamica = contenedor.querySelector('#zona-dinamica');
  let modoActual = 'planes';

  // Función que cambia entre pestañas
  const mostrarModo = async () => {
    zonaDinamica.innerHTML = '<p>Cargando...</p>';
    if (modoActual === 'planes') {
      await renderizarTablaPlanes(zonaDinamica);
    } else {
      await renderizarAsignaciones(zonaDinamica);
    }
  };

  // Listeners de pestañas
  contenedor.querySelector('#tab-planes').addEventListener('click', () => {
    modoActual = 'planes';
    contenedor.querySelector('#tab-planes').classList.add(estilos.activa);
    contenedor.querySelector('#tab-asignaciones').classList.remove(estilos.activa);
    mostrarModo();
  });

  contenedor.querySelector('#tab-asignaciones').addEventListener('click', () => {
    modoActual = 'asignaciones';
    contenedor.querySelector('#tab-asignaciones').classList.add(estilos.activa);
    contenedor.querySelector('#tab-planes').classList.remove(estilos.activa);
    mostrarModo();
  });

  await mostrarModo();
};

// ==============================
//  TAB 1 - CRUD DE PLANES
// ==============================
const renderizarTablaPlanes = async (zona) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());

  zona.innerHTML = `
    <div data-zona-planes="true">
      <div class="${estilos.cabecera}">
        <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar membresía...">
        <button id="boton-agregar" class="${estilos.botonAgregar}">+ Nueva Membresía</button>
      </div>

      <div class="${estilos.tablaWrapper}">
        <table class="${estilos.tabla}">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Duración</th>
              <th>Costo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="membresias-cuerpo-tabla"></tbody>
        </table>
      </div>

      <div class="${estilos.paginacion}">
        <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
        <span id="indicador-pagina">Página 1 de 1</span>
        <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
      </div>
    </div>
  `;

  zona.dataset.vistaActiva = 'planes';
  asegurarListenersPlanes(zona);

  // Estado local del modo "planes"
  listaMembresias = await apiObtenerMembresias();
  paginaActual = 1;

  const mostrarContenido = () => {
    if (!zona?.isConnected || zona.dataset.vistaActiva !== 'planes') return;

    const cuerpo = zona.querySelector('#membresias-cuerpo-tabla');
    const buscador = zona.querySelector('#buscador');
    const indicador = zona.querySelector('#indicador-pagina');
    const btnPrev = zona.querySelector('#boton-prev');
    const btnNext = zona.querySelector('#boton-next');

    if (!cuerpo || !buscador || !indicador || !btnPrev || !btnNext) return;

    const termino = buscador.value.toLowerCase();
    const filtradas = listaMembresias.filter(m =>
      m.nombrePlan.toLowerCase().includes(termino)
    );

    const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
    paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas));
    const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
    const pagina = filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);

    cuerpo.innerHTML = '';

    if (pagina.length === 0) {
      cuerpo.innerHTML = `<tr><td colspan="6">No se encontraron membresías.</td></tr>`;
    } else {
      pagina.forEach(m => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${m.id}</td>
          <td>${m.nombrePlan}</td>
          <td>${m.tipoDeMembresia?.descripcion || 'N/A'}</td>
          <td>${m.duracionEnDias} días</td>
          <td>$${m.costoBase}</td>
          <td class="${estilos.acciones}">
            <button class="${estilos.botonEditar}" data-id="${m.id}">Editar</button>
            <button class="${estilos.botonEliminar}" data-id="${m.id}">Eliminar</button>
          </td>`;
        cuerpo.appendChild(fila);
      });
    }

    indicador.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    btnPrev.disabled = paginaActual === 1;
    btnNext.disabled = paginaActual === totalPaginas;
  };

  zona.__mostrarPlanes = mostrarContenido;
  mostrarContenido();
};

// ==============================
//  MODAL NUEVA / EDITAR
// ==============================
const abrirModal = (registro = null, zona) => {
  if (!zona?.isConnected) return;
  const modal = document.createElement('div');
  modal.className = estilos.modalFondo;
  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>${registro ? 'Editar' : 'Nueva'} Membresía</h3>
      <form id="form-membresia">
        <label>Nombre del plan</label>
        <input type="text" id="nombrePlan" value="${registro?.nombrePlan || ''}" required>
         <label>Tipo de membresía</label>
        <select id="tipoDeMembresiaId" required>
          <option value="">-- Seleccioná un tipo --</option>
        </select>   
        <label>Duración (días)</label>
        <input type="number" id="duracion" value="${registro?.duracionEnDias || ''}" required>
        <label>Costo base</label>
        <input type="number" id="costo" value="${registro?.costoBase || ''}" required>
        <div class="${estilos.modalAcciones}">
          <button type="button" id="cancelar">Cancelar</button>
          <button type="submit" id="guardar">Guardar</button>
        </div>
      </form>
    </div>
  `;
  if (!document.body.contains(zona)) return;
  document.body.appendChild(modal);

  (async () => {
    const selectTipo = modal.querySelector('#tipoDeMembresiaId');
    const tipos = await apiObtenerTiposDeMembresia();

    tipos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.descripcion;
      if (registro?.tipoDeMembresiaId === t.id) opt.selected = true;
      selectTipo.appendChild(opt);
    });
  })();

  modal.querySelector('#cancelar').addEventListener('click', () => modal.remove());
  modal.querySelector('#form-membresia').addEventListener('submit', async e => {
    e.preventDefault();

    const tipoDeMembresiaId = parseInt(e.target.tipoDeMembresiaId.value, 10);
    if (!Number.isFinite(tipoDeMembresiaId)) {
      alert('Seleccioná un tipo de membresía válido.');
      return;
    }

    const duracionEnDias = parseInt(e.target.duracion.value, 10);
    const costoBase = parseFloat(e.target.costo.value);

    if (!Number.isFinite(duracionEnDias) || duracionEnDias <= 0) {
      alert('Ingresá una duración válida (en días).');
      return;
    }

    if (!Number.isFinite(costoBase) || costoBase <= 0) {
      alert('Ingresá un costo válido.');
      return;
    }

    const nueva = {
      nombrePlan: e.target.nombrePlan.value.trim(),
      duracionEnDias,
      costoBase,
      tipoDeMembresiaId
    };

    if (registro) await apiActualizarMembresia(registro.id, nueva);
    else await apiCrearMembresia(nueva);

    modal.remove();
    await renderizarTablaPlanes(zona); // recargar tabla
  });
};

// ==============================
//  TAB 2 - ASIGNACIONES (RF08)
// ==============================
const renderizarAsignaciones = async (zona) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());
  zona.dataset.vistaActiva = 'asignaciones';
  zona.__mostrarPlanes = undefined;

  zona.innerHTML = `
    <div class="${estilos.bloqueAsignaciones}">
      <div class="${estilos.asigHeader}">
        <button id="boton-asignar" class="${estilos.botonAgregar}">+ Nueva Asignación</button>
      </div>
      <table class="${estilos.tabla}">
        <thead>
          <tr>
            <th>ID</th>
            <th>Miembro</th>
            <th>Membresía</th>
            <th>Estado</th>
            <th>Pago</th>
            <th>Inicio</th>
            <th>Fin</th>
          </tr>
        </thead>
        <tbody id="asignaciones-cuerpo"></tbody>
      </table>
    </div>
  `;

  await cargarAsignaciones(zona);

  zona.querySelector('#boton-asignar').addEventListener('click', async () => {
    const miembros = await apiObtenerMiembros();
    const membresias = await apiObtenerMembresias();

    const modal = document.createElement('div');
    modal.className = estilos.modalFondo;
modal.innerHTML = `
  <div class="${estilos.modalContenido}">
    <h3>Asignar Membresía</h3>
    <form id="form-asignar">
      <div class="${estilos.grupoInput}">
        <label>Buscar miembro:</label>
        <input type="text" id="buscadorMiembro" placeholder="Ingresá nombre, DNI o email...">
        <ul id="resultadosMiembro" class="${estilos.listaResultados}"></ul>
      </div>

      <div class="${estilos.grupoInput}">
        <label>Membresía:</label>
        <select id="membresiaId" required>
          <option value="">-- Seleccioná un plan --</option>
          ${membresias.map(m => `<option value="${m.id}">${m.nombrePlan}</option>`).join('')}
        </select>
      </div>

      <div class="${estilos.grupoInput}">
        <label>Método de pago:</label>
        <select id="metodoPago" required>
          <option value="">-- Seleccioná método --</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
        </select>
      </div>

      <div class="${estilos.modalAcciones}">
        <button type="button" id="cancelar">Cancelar</button>
        <button type="submit">Confirmar</button>
      </div>
    </form>
  </div>
`;

    document.body.appendChild(modal);

    modal.querySelector('#cancelar').addEventListener('click', () => modal.remove());
const inputBuscador = modal.querySelector('#buscadorMiembro');
const listaResultados = modal.querySelector('#resultadosMiembro');
let miembroSeleccionado = null;

// 1️⃣ Mostrar resultados dinámicos mientras escribe
inputBuscador.addEventListener('input', () => {
  const termino = inputBuscador.value.toLowerCase();
  listaResultados.innerHTML = '';

  if (termino.length < 2) return; // espera 2 letras para buscar

  const coincidencias = miembros.filter(m =>
    m.nombre.toLowerCase().includes(termino) ||
    m.email.toLowerCase().includes(termino) ||
    m.dni.toString().includes(termino)
  );

  if (coincidencias.length === 0) {
    listaResultados.innerHTML = '<li class="sin-resultados">Sin resultados</li>';
    return;
  }

  coincidencias.forEach(m => {
    const li = document.createElement('li');
    li.textContent = `${m.nombre} — ${m.email} — DNI: ${m.dni}`;
    li.dataset.id = m.id;
    li.addEventListener('click', () => {
      miembroSeleccionado = m;
      inputBuscador.value = `${m.nombre} (${m.email})`;
      listaResultados.innerHTML = '';
    });
    listaResultados.appendChild(li);
  });
});

// 2️⃣ Cancelar
modal.querySelector('#cancelar').addEventListener('click', () => modal.remove());

// 3️⃣ Confirmar
modal.querySelector('#form-asignar').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!miembroSeleccionado) {
    alert('Por favor seleccioná un miembro.');
    return;
  }

  const membresiaId = parseInt(e.target.membresiaId.value);
  const metodoPago = e.target.metodoPago.value;

  const membresia = membresias.find(m => m.id === membresiaId);
  const pago = await apiCrearPago({
    monto: membresia.costoBase,
    fechaPago: new Date().toISOString(),
    metodoPago,
    descuentoAplicado: 0
  });

  const fechaInicio = new Date();
  const fechaFin = new Date(fechaInicio);
  fechaFin.setDate(fechaInicio.getDate() + membresia.duracionEnDias);

await apiCrearMembresiaXMiembro({
  miembroId: miembroSeleccionado.id,
  membresiaId,
  pagoId: pago.id,
  fechaInicio: fechaInicio.toISOString(),
  fechaFin: fechaFin.toISOString()
});

  modal.remove();
  await cargarAsignaciones(zona);
  alert('✅ Membresía asignada correctamente');
});
  });
};

const cargarAsignaciones = async (zona) => {
  const cuerpo = zona.querySelector('#asignaciones-cuerpo');
  cuerpo.innerHTML = `<tr><td colspan="7">Cargando...</td></tr>`;
  const lista = await apiObtenerMembresiasXMiembros();
  if (!lista || lista.length === 0) {
    cuerpo.innerHTML = `<tr><td colspan="7">No hay asignaciones registradas.</td></tr>`;
    return;
  }

  cuerpo.innerHTML = '';
  lista.forEach(a => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${a.id}</td>
      <td>${a.miembro?.nombre || 'N/A'}</td>
      <td>${a.membresia?.nombrePlan || 'N/A'}</td>
      <td class="${
          a.estadoMembresia?.descripcion === 'Activa'
            ? estilos.estadoActiva
            : estilos.estadoVencida
        }">
          ${a.estadoMembresia?.descripcion || 'Sin estado'}
      </td>
      <td>$${a.pago?.monto || '-'}</td>
      <td>${new Date(a.fechaInicio).toLocaleDateString()}</td>
      <td>${new Date(a.fechaFin).toLocaleDateString()}</td>
    `;
    cuerpo.appendChild(fila);
  });
};
