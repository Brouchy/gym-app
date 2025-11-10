import estilos from './MembresiasView.module.css';
import { 
  apiObtenerTiposDeMiembro,
  apiCrearTipoDeMiembro,
  apiActualizarTipoDeMiembro,
  apiEliminarTipoDeMiembro
} from '../../api/membersApi.js';
import {
  apiObtenerTiposDeMembresia,
  apiCrearTipoDeMembresia,
  apiActualizarTipoDeMembresia,
  apiEliminarTipoDeMembresia
} from '../../api/membershipApi.js';

export const renderizarVistaConfiguraciones = async (contenedor) => {
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.tituloModulo}">
        <h2>Configuraciones</h2>
      </div>
      <div class="${estilos.tituloModulo}">
        <div class="${estilos.cabecera}" style="gap:8px; flex-wrap: wrap;">
          <button id="agregar-tipo-miembro" class="${estilos.botonAgregar}">+ Nuevo Tipo de Miembro</button>
          <button id="agregar-tipo-membresia" class="${estilos.botonAgregar}">+ Nuevo Tipo de Membresía</button>
        </div>
        <div class="${estilos.tablaWrapper}" style="margin-top:12px">
          <h3 style="margin:8px 0;">Tipos de Miembro (Descuentos)</h3>
          <table class="${estilos.tabla}">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Descuento (%)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tabla-tipo-miembro"></tbody>
          </table>
        </div>
        <div class="${estilos.tablaWrapper}" style="margin-top:18px">
          <h3 style="margin:8px 0;">Tipos de Membresía</h3>
          <table class="${estilos.tabla}">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tabla-tipo-membresia"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const cuerpoTM = contenedor.querySelector('#tabla-tipo-miembro');
  const cuerpoTMem = contenedor.querySelector('#tabla-tipo-membresia');

  const cargarListas = async () => {
    cuerpoTM.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
    cuerpoTMem.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';
    const [tiposMiembro, tiposMemb] = await Promise.all([
      apiObtenerTiposDeMiembro(),
      apiObtenerTiposDeMembresia()
    ]);

    // Tipos de Miembro
    if (Array.isArray(tiposMiembro) && tiposMiembro.length) {
      cuerpoTM.innerHTML = tiposMiembro.map(tm => `
        <tr>
          <td>${tm.id}</td>
          <td>${tm.descripcion}</td>
          <td>${Number(tm.porcentajeDescuento || 0)}</td>
          <td class="${estilos.acciones}">
            <button class="${estilos.botonPagina}" data-accion="editar-tm" data-id="${tm.id}">Editar</button>
            <button class="${estilos.botonEliminar}" data-accion="eliminar-tm" data-id="${tm.id}">Eliminar</button>
          </td>
        </tr>
      `).join('');
    } else {
      cuerpoTM.innerHTML = '<tr><td colspan="4">Sin datos</td></tr>';
    }

    // Tipos de Membresía
    if (Array.isArray(tiposMemb) && tiposMemb.length) {
      cuerpoTMem.innerHTML = tiposMemb.map(t => `
        <tr>
          <td>${t.id}</td>
          <td>${t.descripcion}</td>
          <td class="${estilos.acciones}">
            <button class="${estilos.botonPagina}" data-accion="editar-tmem" data-id="${t.id}">Editar</button>
            <button class="${estilos.botonEliminar}" data-accion="eliminar-tmem" data-id="${t.id}">Eliminar</button>
          </td>
        </tr>
      `).join('');
    } else {
      cuerpoTMem.innerHTML = '<tr><td colspan="3">Sin datos</td></tr>';
    }
  };

  await cargarListas();

  // Handlers crear
  contenedor.querySelector('#agregar-tipo-miembro')?.addEventListener('click', async () => {
    const descripcion = prompt('Descripción del tipo de miembro:');
    if (!descripcion) return;
    const porc = prompt('Porcentaje de descuento (0-100):', '0');
    const porcentajeDescuento = Math.max(0, Math.min(100, Number(porc)));
    const creado = await apiCrearTipoDeMiembro({ descripcion, porcentajeDescuento });
    if (!creado) return alert('No se pudo crear.');
    await cargarListas();
  });

  contenedor.querySelector('#agregar-tipo-membresia')?.addEventListener('click', async () => {
    const descripcion = prompt('Descripción del tipo de membresía:');
    if (!descripcion) return;
    const creado = await apiCrearTipoDeMembresia({ descripcion });
    if (!creado) return alert('No se pudo crear.');
    await cargarListas();
  });

  // Delegación de eventos para editar/eliminar
  contenedor.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-accion]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const accion = btn.dataset.accion;

    if (accion === 'editar-tm') {
      const fila = btn.closest('tr');
      const actualDesc = fila?.children?.[1]?.textContent || '';
      const actualPorc = fila?.children?.[2]?.textContent || '0';
      const descripcion = prompt('Descripción:', actualDesc);
      if (!descripcion) return;
      const porc = prompt('Descuento (%):', actualPorc);
      const porcentajeDescuento = Math.max(0, Math.min(100, Number(porc)));
      const ok = await apiActualizarTipoDeMiembro(id, { descripcion, porcentajeDescuento });
      if (!ok) return alert('No se pudo actualizar.');
      await cargarListas();
    }

    if (accion === 'eliminar-tm') {
      if (!confirm('¿Eliminar este tipo de miembro?')) return;
      const r = await apiEliminarTipoDeMiembro(id);
      if (!r?.exito) return alert('No se pudo eliminar.');
      await cargarListas();
    }

    if (accion === 'editar-tmem') {
      const fila = btn.closest('tr');
      const actualDesc = fila?.children?.[1]?.textContent || '';
      const descripcion = prompt('Descripción:', actualDesc);
      if (!descripcion) return;
      const ok = await apiActualizarTipoDeMembresia(id, { descripcion });
      if (!ok) return alert('No se pudo actualizar.');
      await cargarListas();
    }

    if (accion === 'eliminar-tmem') {
      if (!confirm('¿Eliminar este tipo de membresía?')) return;
      const r = await apiEliminarTipoDeMembresia(id);
      if (!r?.exito) return alert('No se pudo eliminar.');
      await cargarListas();
    }
  });
};
