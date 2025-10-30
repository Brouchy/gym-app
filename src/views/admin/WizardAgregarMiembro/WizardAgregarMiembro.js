import estilos from './WizardAgregarMiembro.module.css';
import {apiObtenerMembresias,apiCrearMembresiaXMiembro} from '../../../api/membershipApi.js';
import { apiCrearPago } from '../../../api/apiPago.js';


/**
 * Muestra un wizard modal para asignar membresía y pago a un miembro nuevo
 * @param {HTMLElement} contenedorPadre - El div principal de la vista (contenedorVista)
 * @param {Object} miembroCreado - El objeto miembro recién creado
 * @param {Function} onFinalizar - Callback cuando termina todo
 */
export const renderizarWizardAgregarMiembro = (contenedorPadre, miembroCreado, onFinalizar) => {
  // Crear el modal y su contenido
  const modal = document.createElement('div');
  modal.className = estilos.modalFondo;

  const contenido = document.createElement('div');
  contenido.className = estilos.modalContenido;
  modal.appendChild(contenido);
  contenedorPadre.appendChild(modal);

  // Estado interno
  let membresiaSeleccionada = null;

  // ========== PASO 1: Seleccionar Membresía ==========
  const mostrarPasoSeleccionMembresia = async () => {
    contenido.innerHTML = `
      <h3>Asignar membresía a <span class="${estilos.nombre}">${miembroCreado.nombre}</span></h3>
      <p id="estado-carga">Cargando membresías...</p>
      <select id="select-membresia" style="display:none;"></select>
      <div class="${estilos.botones}">
        <button id="cancelar" class="${estilos.btnCancelar}">Cancelar</button>
        <button id="continuar" class="${estilos.btnContinuar}" disabled>Continuar</button>
      </div>
    `;

    const estado = contenido.querySelector('#estado-carga');
    const select = contenido.querySelector('#select-membresia');
    const botonContinuar = contenido.querySelector('#continuar');

    try {
      const lista = await apiObtenerMembresias();

      if (!lista || lista.length === 0) {
        estado.textContent = '⚠️ No hay membresías disponibles.';
        botonContinuar.disabled = true;
        return;
      }

      estado.style.display = 'none';
      select.style.display = 'block';

      lista.forEach((m) => {
        const opcion = document.createElement('option');
        opcion.value = m.id;
        opcion.textContent = `${m.nombrePlan} - ${m.duracionEnDias} días ($${m.costoBase})`;
        select.appendChild(opcion);
      });

      botonContinuar.disabled = false;

     contenido.querySelector('#cancelar').addEventListener('click', () => {
        modal.remove();
        onFinalizar?.(); 
      });
      botonContinuar.addEventListener('click', () => {
        const idSeleccionado = parseInt(select.value);
        membresiaSeleccionada = lista.find((m) => m.id === idSeleccionado);
        mostrarPasoPago();
      });
    } catch (error) {
      estado.textContent = '❌ Error al cargar membresías.';
      botonContinuar.disabled = true;
    }
  };

  // ========== PASO 2: Confirmar Pago ==========
  const mostrarPasoPago = () => {
    contenido.innerHTML = `
      <h3>Registrar pago</h3>
      <p>Plan: <strong>${membresiaSeleccionada.nombrePlan}</strong></p>
      <p>Monto: $${membresiaSeleccionada.costoBase}</p>
      <label>Método de pago:</label>
      <select id="metodoPago">
        <option value="">-- Seleccioná --</option>
        <option value="Tarjeta">Tarjeta</option>
        <option value="Transferencia">Transferencia</option>
        <option value="Efectivo">Efectivo</option>
      </select>
      <div class="${estilos.botones}">
        <button id="atras" class="${estilos.btnAtras}">Atrás</button>
        <button id="confirmar" class="${estilos.btnConfirmar}">Confirmar</button>
      </div>
    `;

    contenido.querySelector('#atras').addEventListener('click', mostrarPasoSeleccionMembresia);
    contenido.querySelector('#confirmar').addEventListener('click', async () => {
      const metodo = contenido.querySelector('#metodoPago').value;

      if (!metodo) {
        alert('Por favor seleccioná un método de pago.');
        return;
      }

      // Mostramos mensaje de procesamiento
      contenido.innerHTML = `
        <h3>Procesando...</h3>
        <p>Registrando pago y asignando membresía...</p>
      `;

      try {
        // 1️⃣ Crear pago
        const nuevoPago = await apiCrearPago({
          monto: membresiaSeleccionada.costoBase,
          fechaPago: new Date().toISOString(),
          metodoPago: metodo,
          descuentoAplicado: 0
        });

        if (!nuevoPago) throw new Error('Error al crear el pago');

        // 2️⃣ Calcular fechas
        const fechaInicio = new Date();
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + membresiaSeleccionada.duracionEnDias);

        // 3️⃣ Crear vínculo miembro ↔ membresía
        const nuevaRelacion = {
          miembroId: miembroCreado.id,
          membresiaId: membresiaSeleccionada.id,
          estadoMembresiaId: 1, // Activa
          pagoId: nuevoPago.id,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString()
        };

        const resultado = await apiCrearMembresiaXMiembro(nuevaRelacion);

        if (!resultado) throw new Error('Error al crear la relación');

        mostrarPasoExito();
      } catch (err) {
        contenido.innerHTML = `
          <h3>❌ Error</h3>
          <p>Ocurrió un error: ${err.message}</p>
          <div class="${estilos.botones}">
            <button id="reintentar" class="${estilos.btnContinuar}">Reintentar</button>
            <button id="cerrar" class="${estilos.btnCancelar}">Cerrar</button>
          </div>
        `;
        contenido.querySelector('#reintentar').addEventListener('click', mostrarPasoPago);
        contenido.querySelector('#cerrar').addEventListener('click', () => modal.remove());
      }
    });
  };

  // ========== PASO 3: Éxito ==========
  const mostrarPasoExito = () => {
    contenido.innerHTML = `
      <h3>✅ Registro exitoso</h3>
      <p>El miembro <strong>${miembroCreado.nombre}</strong> fue asociado al plan <strong>${membresiaSeleccionada.nombrePlan}</strong>.</p>
      <button id="cerrar" class="${estilos.btnCerrar}">Cerrar</button>
    `;
    contenido.querySelector('#cerrar').addEventListener('click', () => {
      modal.remove();
      onFinalizar?.();
    });
  };

  // Iniciar wizard
  mostrarPasoSeleccionMembresia();
};
