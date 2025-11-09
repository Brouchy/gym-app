import estilos from './MembresiasView.module.css';
import QRCode from 'qrcode';
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
import { imprimirTicket } from '../../utils/imprimirTicket.js';

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

// Modal QR (idéntico al de Miembros)
const mostrarModalQR = (textoQR) => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '3000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.6)';

    const caja = document.createElement('div');
    caja.style.background = '#1f1f1f';
    caja.style.padding = '18px';
    caja.style.borderRadius = '10px';
    caja.style.maxWidth = '420px';
    caja.style.width = '90%';
    caja.style.color = 'white';
    caja.style.textAlign = 'center';

    caja.innerHTML = `<h3 style="margin-top:0;margin-bottom:8px;">Escanear QR para pagar</h3><p style="color:#ccc;margin-bottom:12px;">Escaneá este QR con la app de pago y luego confirma</p>`;

    const canvas = document.createElement('canvas');
    canvas.id = 'qr-canvas-inline';
    canvas.style.background = 'white';
    canvas.style.padding = '8px';
    canvas.style.borderRadius = '8px';
    caja.appendChild(canvas);

    const botones = document.createElement('div');
    botones.style.display = 'flex';
    botones.style.justifyContent = 'center';
    botones.style.gap = '8px';
    botones.style.marginTop = '12px';

    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.padding = '8px 12px';
    btnCancelar.style.borderRadius = '6px';
    btnCancelar.style.border = 'none';
    btnCancelar.style.background = '#555';
    btnCancelar.style.color = 'white';

    const btnConfirmar = document.createElement('button');
    btnConfirmar.textContent = 'Confirmar pago';
    btnConfirmar.style.padding = '8px 12px';
    btnConfirmar.style.borderRadius = '6px';
    btnConfirmar.style.border = 'none';
    btnConfirmar.style.background = '#FF6B35';
    btnConfirmar.style.color = 'white';

    botones.appendChild(btnCancelar);
    botones.appendChild(btnConfirmar);
    caja.appendChild(botones);

    modal.appendChild(caja);
    document.body.appendChild(modal);

    try {
      if (QRCode && typeof QRCode.toCanvas === 'function') {
        QRCode.toCanvas(canvas, textoQR, { width: 220, margin: 2 }).catch(() => {
          const pre = document.createElement('pre');
          pre.style.color = '#fff';
          pre.style.whiteSpace = 'pre-wrap';
          pre.style.textAlign = 'left';
          pre.textContent = textoQR;
          canvas.replaceWith(pre);
        });
      } else {
        throw new Error('QRCode.toCanvas no disponible');
      }
    } catch (_) {
      const pre = document.createElement('pre');
      pre.style.color = '#fff';
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.textAlign = 'left';
      pre.textContent = textoQR;
      canvas.replaceWith(pre);
    }

    btnCancelar.addEventListener('click', () => { modal.remove(); resolve(false); });
    btnConfirmar.addEventListener('click', () => { modal.remove(); resolve(true); });
  });
};

// Modal Comprobante (idéntico al de Miembros)
const mostrarModalComprobante = (datosPago, miembro, membresia) => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '4000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.6)';

    const caja = document.createElement('div');
    caja.style.background = '#1f1f1f';
    caja.style.padding = '18px';
    caja.style.borderRadius = '10px';
    caja.style.maxWidth = '520px';
    caja.style.width = '92%';
    caja.style.color = 'white';
    caja.style.textAlign = 'left';

    const fechaPago = new Date(datosPago.fechaPago).toLocaleString();
    caja.innerHTML = `
      <h3 style="margin-top:0;margin-bottom:8px;">Comprobante de Pago</h3>
      <p style=\"color:#ccc;margin-bottom:12px;\">Revise los datos del pago. Puede imprimir el comprobante o terminar.</p>
      <div style=\"background:#111;margin-bottom:12px;padding:12px;border-radius:8px;\">
        <div style=\"display:flex;justify-content:space-between;margin-bottom:6px;\"><strong>Miembro:</strong><span>${miembro.nombre} ${miembro.apellidos || ''}</span></div>
        <div style=\"display:flex;justify-content:space-between;margin-bottom:6px;\"><strong>Membresía:</strong><span>${membresia.nombrePlan || 'N/A'}</span></div>
        <div style=\"display:flex;justify-content:space-between;margin-bottom:6px;\"><strong>Monto:</strong><span>$${Number(datosPago.monto).toFixed(2)}</span></div>
        <div style=\"display:flex;justify-content:space-between;margin-bottom:6px;\"><strong>Método:</strong><span>${datosPago.metodoPago || 'N/A'}</span></div>
        <div style=\"display:flex;justify-content:space-between;\"><strong>Fecha:</strong><span>${fechaPago}</span></div>
      </div>
    `;

    const botones = document.createElement('div');
    botones.style.display = 'flex';
    botones.style.justifyContent = 'flex-end';
    botones.style.gap = '10px';

    const btnTerminar = document.createElement('button');
    btnTerminar.textContent = 'Terminar';
    btnTerminar.style.padding = '8px 12px';
    btnTerminar.style.borderRadius = '6px';
    btnTerminar.style.border = 'none';
    btnTerminar.style.background = '#555';
    btnTerminar.style.color = 'white';

    const btnImprimir = document.createElement('button');
    btnImprimir.textContent = 'Imprimir comprobante';
    btnImprimir.style.padding = '8px 12px';
    btnImprimir.style.borderRadius = '6px';
    btnImprimir.style.border = 'none';
    btnImprimir.style.background = '#FF6B35';
    btnImprimir.style.color = 'white';

    botones.appendChild(btnTerminar);
    botones.appendChild(btnImprimir);
    caja.appendChild(botones);
    modal.appendChild(caja);
    document.body.appendChild(modal);

    btnTerminar.addEventListener('click', () => { modal.remove(); resolve('terminar'); });
    btnImprimir.addEventListener('click', () => {
      try { imprimirTicket(datosPago, miembro, membresia, null); } catch (_) {}
      modal.remove();
      resolve('imprimir');
    });
  });
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
      <div id="zona-dinamica"></div>
    </div>
  `;

  const zonaDinamica = contenedor.querySelector('#zona-dinamica');
  let modoActual = 'planes';

  // Función que cambia entre pestañas
  const mostrarModo = async () => {
    zonaDinamica.innerHTML = '<p>Cargando...</p>';
    await renderizarTablaPlanes(zonaDinamica);
  };

  await mostrarModo();
};

// ==============================
//  TAB ÚNICA - LISTADO DE MEMBRESÍAS (PLANES)
// ==============================
const renderizarTablaPlanes = async (zona) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());

  zona.innerHTML = `
    <div data-zona-planes="true">
      <div class="${estilos.cabecera}">
        <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar membresía...">
        <div class="${estilos.grupoBotones}">
          <button id="boton-agregar" class="${estilos.botonAgregar}">+ Nueva Membresía</button>
          <button id="boton-renovar" class="${estilos.botonAgregar}" style="margin-left:8px;">↻ Renovar vencidas</button>
        </div>
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
            <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-id="${m.id}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
            </svg>
            <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-id="${m.id}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
              <path d="M9 3h6v1h5v2H4V4h5V3zm1 4h1v10h-1V7zm4 0h1v10h-1V7zm-7 0h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
            </svg>
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
  // Listener de renovar en modo planes
  const btnRenovar = zona.querySelector('#boton-renovar');
  if (btnRenovar) btnRenovar.addEventListener('click', () => abrirModalRenovar(zona));
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
//  MODAL RENOVAR VENCIDAS (desde planes)
// ==============================
const abrirModalRenovar = async (zona) => {
  const lista = await apiObtenerMembresiasXMiembros();
  const miembros = await apiObtenerMiembros();
  const membresias = await apiObtenerMembresias();
  const ahora = Date.now();
  const vencidos = (lista || []).filter(r => {
    const fin = r?.fechaFin ? new Date(r.fechaFin).getTime() : 0;
    return fin && fin < ahora;
  });
  if (!vencidos.length) {
    alert('No hay membresías vencidas para renovar.');
    return;
  }

  const ultimoPorMiembro = new Map();
  vencidos.forEach(v => {
    const key = Number(v.miembroId);
    const actual = ultimoPorMiembro.get(key);
    const fV = v.fechaFin ? new Date(v.fechaFin).getTime() : 0;
    const fA = actual?.fechaFin ? new Date(actual.fechaFin).getTime() : 0;
    if (!actual || fV >= fA) ultimoPorMiembro.set(key, v);
  });
  const candidatos = Array.from(ultimoPorMiembro.values());

  const modal = document.createElement('div');
  modal.className = estilos.modalFondo;
  modal.innerHTML = `
    <div class="${estilos.modalContenido}">
      <h3>Renovar Membresías Vencidas</h3>
      <form id="form-renovar">
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
            <option value="QR">QR</option>
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

  const inputBuscador = modal.querySelector('#buscadorMiembro');
  const listaResultados = modal.querySelector('#resultadosMiembro');
  const planSelect = modal.querySelector('#membresiaId');
  let miembroSeleccionado = null;

  const buscarCandidatos = (termino) => {
    const t = termino.toLowerCase();
    return candidatos
      .map(v => {
        const m = miembros.find(x => x.id === v.miembroId) || {};
        return { v, m };
      })
      .filter(({ m }) =>
        (m.nombre || '').toLowerCase().includes(t) ||
        (m.email || '').toLowerCase().includes(t) ||
        String(m.dni || '').includes(t)
      );
  };

  const preseleccionarPlan = () => {
    if (!miembroSeleccionado) return;
    const reg = ultimoPorMiembro.get(Number(miembroSeleccionado.id));
    const planId = Number(reg?.membresiaId || reg?.membresia?.id);
    if (planId && planSelect.querySelector(`option[value="${planId}"]`)) {
      planSelect.value = String(planId);
    }
  };

  inputBuscador.addEventListener('input', () => {
    const termino = inputBuscador.value;
    listaResultados.innerHTML = '';
    if (termino.length < 2) return;
    const results = buscarCandidatos(termino);
    if (results.length === 0) {
      listaResultados.innerHTML = '<li class="sin-resultados">Sin resultados</li>';
      return;
    }
    results.forEach(({ m }) => {
      const li = document.createElement('li');
      li.textContent = `${m.nombre} — ${m.email || ''} — DNI: ${m.dni || ''}`;
      li.addEventListener('click', () => {
        miembroSeleccionado = m;
        inputBuscador.value = `${m.nombre} (${m.email || 'sin email'})`;
        listaResultados.innerHTML = '';
        preseleccionarPlan();
      });
      listaResultados.appendChild(li);
    });
  });

  modal.querySelector('#cancelar').addEventListener('click', () => modal.remove());

  modal.querySelector('#form-renovar').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!miembroSeleccionado) {
      alert('Por favor seleccioná un miembro.');
      return;
    }
    const membresiaId = parseInt(e.target.membresiaId.value, 10);
    const metodoPago = e.target.metodoPago.value;
    const membresia = membresias.find(m => m.id === membresiaId);
    if (!membresia) {
      alert('Seleccioná una membresía válida.');
      return;
    }
    // Flujo QR idéntico al registro de miembros
    if (metodoPago === 'QR') {
      const payload = {
        miembro: `${miembroSeleccionado.nombre} ${miembroSeleccionado.apellidos || ''}`.trim(),
        monto: membresia.costoBase,
        concepto: `Renovación ${membresia.nombrePlan}`,
        fecha: new Date().toISOString(),
      };
      const ok = await mostrarModalQR(JSON.stringify(payload, null, 2));
      if (!ok) return;
    }
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
      estadoMembresiaId: 1,
      pagoId: pago.id,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString()
    });
    // Notificar a otras vistas que cambió membresiaXMiembros
    try { window.dispatchEvent(new CustomEvent('mxm:changed')); } catch (_) {}
    // Comprobante
    try {
      await mostrarModalComprobante({
        monto: pago.monto,
        fechaPago: pago.fechaPago,
        metodoPago: pago.metodoPago
      }, miembroSeleccionado, membresia);
    } catch (_) {}
    modal.remove();
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
