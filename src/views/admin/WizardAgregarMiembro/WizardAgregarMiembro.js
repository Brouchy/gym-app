import estilos from './WizardAgregarMiembro.module.css';
import {apiObtenerMembresias,apiCrearMembresiaXMiembro} from '../../../api/membershipApi.js';
import { apiCrearPago } from '../../../api/apiPago.js';
import { imprimirTicket } from '../../../utils/imprimirTicket.js';


/**
 * Muestra un wizard modal para asignar membresía y pago a un miembro nuevo
 * @param {HTMLElement} contenedorPadre - El div principal de la vista (contenedorVista)
 * @param {Object} miembroCreado - El objeto miembro recién creado
 * @param {Number} membresiaId - ID de la membresía seleccionada en el formulario (opcional)
 * @param {String} fechaInicioMembresia - Fecha de inicio seleccionada en el formulario (opcional)
 * @param {Object} tipoDeMiembroSeleccionado - Tipo de miembro seleccionado con descuento (opcional)
 * @param {Function} onFinalizar - Callback cuando termina todo
 */
export const renderizarWizardAgregarMiembro = (
  contenedorPadre, 
  miembroCreado, 
  membresiaId = null,
  fechaInicioMembresia = null,
  tipoDeMiembroSeleccionado = null,
  onFinalizar = null
) => {
  // Crear el modal y su contenido
  const modal = document.createElement('div');
  modal.className = estilos.modalFondo;

  const contenido = document.createElement('div');
  contenido.className = estilos.modalContenido;
  modal.appendChild(contenido);
  contenedorPadre.appendChild(modal);

  // Estado interno
  let membresiaSeleccionada = null;
  let fechaInicio = fechaInicioMembresia ? new Date(fechaInicioMembresia) : new Date();

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
        if (membresiaId && m.id === membresiaId) {
          opcion.selected = true;
          membresiaSeleccionada = m;
        }
        select.appendChild(opcion);
      });

      // Si ya hay una membresía preseleccionada, habilitar el botón
      if (membresiaSeleccionada) {
        botonContinuar.disabled = false;
      }

     contenido.querySelector('#cancelar').addEventListener('click', () => {
        modal.remove();
        onFinalizar?.(); 
      });
      botonContinuar.addEventListener('click', () => {
        const idSeleccionado = parseInt(select.value);
        if (!membresiaSeleccionada || membresiaSeleccionada.id !== idSeleccionado) {
          membresiaSeleccionada = lista.find((m) => m.id === idSeleccionado);
        }
        mostrarPasoPago();
      });
    } catch (error) {
      estado.textContent = '❌ Error al cargar membresías.';
      botonContinuar.disabled = true;
    }
  };

  // ========== PASO 2: Sección de Pago ==========
  const mostrarPasoPago = () => {
    // Calcular costo con descuento
    const descuento = tipoDeMiembroSeleccionado?.porcentajeDescuento || 0;
    const costoBase = membresiaSeleccionada.costoBase || 0;
    const costoFinal = costoBase * (1 - descuento / 100);
    const descuentoAplicado = costoBase - costoFinal;

    // Formatear fecha de inicio
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calcular fecha de fin
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaInicio.getDate() + membresiaSeleccionada.duracionEnDias);
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    contenido.innerHTML = `
      <h3>💳 Sección 3: Pago</h3>
      <div style="margin-bottom: 15px; padding: 15px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #3a3a3a;">
        <h4 style="color: #FF6B35; margin-bottom: 10px; border-bottom: 2px solid #FF6B35; padding-bottom: 5px;">Resumen de Membresía</h4>
        <p style="margin: 5px 0; color: #cccccc;"><strong>Plan:</strong> ${membresiaSeleccionada.nombrePlan}</p>
        <p style="margin: 5px 0; color: #cccccc;"><strong>Duración:</strong> ${membresiaSeleccionada.duracionEnDias} días</p>
        <p style="margin: 5px 0; color: #cccccc;"><strong>Fecha de inicio:</strong> ${fechaInicioFormateada}</p>
        <p style="margin: 5px 0; color: #cccccc;"><strong>Fecha de fin:</strong> ${fechaFinFormateada}</p>
        ${tipoDeMiembroSeleccionado ? `<p style="margin: 5px 0; color: #cccccc;"><strong>Tipo de miembro:</strong> ${tipoDeMiembroSeleccionado.descripcion}</p>` : ''}
      </div>
      <div style="margin-bottom: 15px; padding: 15px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #3a3a3a;">
        <h4 style="color: #FF6B35; margin-bottom: 10px; border-bottom: 2px solid #FF6B35; padding-bottom: 5px;">Resumen de Costos</h4>
        <p style="margin: 5px 0; color: #cccccc;"><strong>Costo base:</strong> $${costoBase.toFixed(2)}</p>
        ${descuento > 0 ? `<p style="margin: 5px 0; color: #10b981;"><strong>Descuento (${descuento}%):</strong> -$${descuentoAplicado.toFixed(2)}</p>` : ''}
        <p style="font-size: 1.3em; font-weight: bold; color: #FF6B35; margin-top: 10px; padding-top: 10px; border-top: 1px solid #3a3a3a;"><strong>Total a pagar:</strong> $${costoFinal.toFixed(2)}</p>
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; color: #ffffff; font-weight: 500;">Método de pago:</label>
        <select id="metodoPago" style="width: 100%; padding: 0.7rem 1rem; border: 1px solid #3a3a3a; border-radius: 8px; background-color: #2a2a2a; color: #ffffff; font-size: 0.95rem;">
          <option value="">-- Seleccionar método de pago --</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="QR">QR</option>
        </select>
      </div>
      <div id="contenedor-formulario-pago" style="margin-bottom: 15px;"></div>
      <div id="contenedor-resumen-pago" style="margin-bottom: 15px; display: none;"></div>
      <div class="${estilos.botones}">
        <button id="atras" class="${estilos.btnAtras}">Atrás</button>
        <button id="confirmar" class="${estilos.btnConfirmar}" style="display: none;">Confirmar Pago</button>
        <button id="imprimir-ticket" class="${estilos.btnContinuar}" style="display: none;">🖨️ Imprimir Ticket</button>
      </div>
    `;

    const metodoPagoSelect = contenido.querySelector('#metodoPago');
    const contenedorFormulario = contenido.querySelector('#contenedor-formulario-pago');
    const botonConfirmar = contenido.querySelector('#confirmar');

    const contenedorResumen = contenido.querySelector('#contenedor-resumen-pago');
    const botonImprimir = contenido.querySelector('#imprimir-ticket');

    // Manejar cambio de método de pago
    metodoPagoSelect.addEventListener('change', () => {
      const metodo = metodoPagoSelect.value;
      contenedorFormulario.innerHTML = '';
      contenedorResumen.innerHTML = '';
      contenedorResumen.style.display = 'none';
      botonConfirmar.style.display = 'none';
      botonImprimir.style.display = 'none';

      if (metodo === 'Efectivo') {
        mostrarFormularioEfectivo(contenedorFormulario, botonConfirmar, botonImprimir, costoFinal);
      } else if (metodo === 'Tarjeta') {
        mostrarFormularioTarjeta(contenedorFormulario, contenedorResumen, botonConfirmar, botonImprimir, costoFinal);
      } else if (metodo === 'QR') {
        mostrarFormularioQR(contenedorFormulario, botonConfirmar, costoFinal, miembroCreado, membresiaSeleccionada);
      }
    });

    contenido.querySelector('#atras').addEventListener('click', mostrarPasoSeleccionMembresia);
    
    botonConfirmar.addEventListener('click', async () => {
      const metodo = metodoPagoSelect.value;
      if (!metodo) {
        alert('Por favor seleccioná un método de pago.');
        return;
      }

      // Validar formulario de tarjeta si es necesario
      if (metodo === 'Tarjeta') {
        const numeroTarjeta = contenido.querySelector('#numeroTarjeta')?.value;
        const nombreTitular = contenido.querySelector('#nombreTitular')?.value;
        const fechaVencimiento = contenido.querySelector('#fechaVencimiento')?.value;
        const cvv = contenido.querySelector('#cvv')?.value;

        if (!numeroTarjeta || !nombreTitular || !fechaVencimiento || !cvv) {
          alert('Por favor completá todos los campos de la tarjeta.');
          return;
        }
        
        // Mostrar resumen de compra después de completar tarjeta
        mostrarResumenCompra(contenedorResumen, botonImprimir, costoFinal, descuentoAplicado);
        botonConfirmar.style.display = 'none';
        return;
      }

      // Para efectivo, procesar el pago y mostrar opción de imprimir
      if (metodo === 'Efectivo') {
        await procesarPago(metodo, costoFinal, descuentoAplicado);
        return; // procesarPago ya muestra el paso de éxito con opción de imprimir
      }

      // Para QR, procesar el pago directamente
      await procesarPago(metodo, costoFinal, descuentoAplicado);
    });

    botonImprimir.addEventListener('click', async () => {
      const metodo = metodoPagoSelect.value;
      if (metodo === 'Tarjeta') {
        // Si es tarjeta, procesar el pago primero y luego mostrar paso de éxito
        await procesarPago(metodo, costoFinal, descuentoAplicado);
      }
      // Para efectivo, el pago ya se procesó, solo se imprime desde el paso de éxito
    });
  };

  // Función para mostrar formulario de efectivo
  const mostrarFormularioEfectivo = (contenedor, botonConfirmar, botonImprimir, costoFinal) => {
    contenedor.innerHTML = `
      <div style="padding: 15px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #3a3a3a;">
        <h4 style="color: #FF6B35; margin-bottom: 10px; border-bottom: 2px solid #FF6B35; padding-bottom: 5px;">Método: Efectivo</h4>
        <p style="color: #cccccc; margin: 5px 0;">Total a pagar: <strong style="font-size: 1.2em; color: #FF6B35;">$${costoFinal.toFixed(2)}</strong></p>
        <p style="color: #888; font-size: 0.9em; margin-top: 10px;">El pago se registrará como efectivo. Podrás imprimir el ticket después de confirmar.</p>
      </div>
    `;
    botonConfirmar.style.display = 'block';
  };

  // Función para mostrar formulario de tarjeta
  const mostrarFormularioTarjeta = (contenedor, contenedorResumen, botonConfirmar, botonImprimir, costoFinal) => {
    contenedor.innerHTML = `
      <div style="padding: 15px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #3a3a3a;">
        <h4 style="color: #FF6B35; margin-bottom: 15px; border-bottom: 2px solid #FF6B35; padding-bottom: 5px;">Datos de la Tarjeta</h4>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #ffffff; font-weight: 500;">Número de Tarjeta:</label>
          <input type="text" id="numeroTarjeta" placeholder="1234 5678 9012 3456" maxlength="19" 
                 style="width: 100%; padding: 0.7rem 1rem; border: 1px solid #3a3a3a; border-radius: 4px; background-color: #2a2a2a; color: #ffffff; font-size: 0.95rem;" required>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #ffffff; font-weight: 500;">Nombre del Titular:</label>
          <input type="text" id="nombreTitular" placeholder="JUAN PEREZ" 
                 style="width: 100%; padding: 0.7rem 1rem; border: 1px solid #3a3a3a; border-radius: 4px; background-color: #2a2a2a; color: #ffffff; font-size: 0.95rem;" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #ffffff; font-weight: 500;">Fecha Vencimiento:</label>
            <input type="text" id="fechaVencimiento" placeholder="MM/AA" maxlength="5" 
                   style="width: 100%; padding: 0.7rem 1rem; border: 1px solid #3a3a3a; border-radius: 4px; background-color: #2a2a2a; color: #ffffff; font-size: 0.95rem;" required>
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; color: #ffffff; font-weight: 500;">CVV:</label>
            <input type="text" id="cvv" placeholder="123" maxlength="4" 
                   style="width: 100%; padding: 0.7rem 1rem; border: 1px solid #3a3a3a; border-radius: 4px; background-color: #2a2a2a; color: #ffffff; font-size: 0.95rem;" required>
          </div>
        </div>
        <p style="color: #888; font-size: 0.85em; margin-top: 10px;">Los datos de la tarjeta se procesarán de forma segura.</p>
      </div>
    `;
    botonConfirmar.style.display = 'block';

    // Formatear número de tarjeta
    const numeroTarjetaInput = contenedor.querySelector('#numeroTarjeta');
    if (numeroTarjetaInput) {
      numeroTarjetaInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        if (value.length > 0) {
          value = value.match(/.{1,4}/g).join(' ').trim();
        }
        e.target.value = value;
      });
    }

    // Formatear fecha de vencimiento
    const fechaVencimientoInput = contenedor.querySelector('#fechaVencimiento');
    if (fechaVencimientoInput) {
      fechaVencimientoInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
          value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
      });
    }
  };

  // Función para mostrar resumen de compra (después de completar tarjeta)
  const mostrarResumenCompra = (contenedorResumen, botonImprimir, costoFinal, descuentoAplicado) => {
    contenedorResumen.innerHTML = `
      <div style="padding: 15px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #3a3a3a; margin-top: 15px;">
        <h4 style="color: #FF6B35; margin-bottom: 10px; border-bottom: 2px solid #FF6B35; padding-bottom: 5px;">Resumen de Compra</h4>
        <p style="color: #cccccc; margin: 5px 0;"><strong>Método de pago:</strong> Tarjeta</p>
        <p style="color: #cccccc; margin: 5px 0;"><strong>Total pagado:</strong> <span style="color: #FF6B35; font-size: 1.1em; font-weight: bold;">$${costoFinal.toFixed(2)}</span></p>
        <p style="color: #888; font-size: 0.9em; margin-top: 10px;">El pago se ha procesado correctamente. Podrás imprimir el ticket ahora.</p>
      </div>
    `;
    contenedorResumen.style.display = 'block';
    botonImprimir.style.display = 'block';
  };

  // Función para mostrar formulario de QR
  const mostrarFormularioQR = (contenedor, botonConfirmar, costoFinal, miembro, membresia) => {
    const datosQR = {
      miembroId: miembro.id,
      membresiaId: membresia.id,
      monto: costoFinal,
      fecha: new Date().toISOString()
    };
    const textoQR = JSON.stringify(datosQR);

    contenedor.innerHTML = `
      <div style="padding: 15px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #3a3a3a; text-align: center;">
        <h4 style="color: #FF6B35; margin-bottom: 15px; border-bottom: 2px solid #FF6B35; padding-bottom: 5px;">Código QR de Pago</h4>
        <div id="qr-code-container" style="display: flex; justify-content: center; margin: 20px 0;">
          <canvas id="qr-canvas" style="background: white; padding: 10px; border-radius: 8px;"></canvas>
        </div>
        <p style="color: #cccccc; margin-top: 15px;">Escaneá este código QR para completar el pago</p>
        <p style="color: #888; font-size: 0.9em; margin-top: 5px;">Total: <strong style="color: #FF6B35;">$${costoFinal.toFixed(2)}</strong></p>
        <p style="color: #888; font-size: 0.85em; margin-top: 10px;">Una vez escaneado y procesado el pago, confirmá para registrar la transacción.</p>
      </div>
    `;
    botonConfirmar.style.display = 'block';

    // Generar QR code
    if (window.QRCode) {
      const canvas = contenedor.querySelector('#qr-canvas');
      QRCode.toCanvas(canvas, textoQR, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('Error al generar QR:', error);
          contenedor.querySelector('#qr-code-container').innerHTML = '<p style="color: red;">Error al generar el código QR</p>';
        }
      });
    } else {
      contenedor.querySelector('#qr-code-container').innerHTML = '<p style="color: red;">Librería QR no disponible</p>';
    }
  };

  // Función para procesar el pago
  const procesarPago = async (metodo, costoFinal, descuentoAplicado) => {
    // Mostramos mensaje de procesamiento
    contenido.innerHTML = `
      <h3>Procesando...</h3>
      <p>Registrando pago y asignando membresía...</p>
    `;

    try {
      // 1️⃣ Crear pago
      const nuevoPago = await apiCrearPago({
        monto: costoFinal,
        fechaPago: new Date().toISOString(),
        metodoPago: metodo,
        descuentoAplicado: descuentoAplicado
      });

      if (!nuevoPago) throw new Error('Error al crear el pago');

      // 2️⃣ Calcular fechas (usar fecha de inicio seleccionada o hoy)
      const fechaInicioFinal = fechaInicio || new Date();
      const fechaFin = new Date(fechaInicioFinal);
      fechaFin.setDate(fechaInicioFinal.getDate() + membresiaSeleccionada.duracionEnDias);

      // 3️⃣ Crear vínculo miembro ↔ membresía
      const nuevaRelacion = {
        miembroId: miembroCreado.id,
        membresiaId: membresiaSeleccionada.id,
        estadoMembresiaId: 1, // Activa
        pagoId: nuevoPago.id,
        fechaInicio: fechaInicioFinal.toISOString(),
        fechaFin: fechaFin.toISOString()
      };

      const resultado = await apiCrearMembresiaXMiembro(nuevaRelacion);

      if (!resultado) throw new Error('Error al crear la relación');

      // Mostrar ticket y éxito
      mostrarPasoExito(nuevoPago);
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
  };

  // ========== PASO 3: Éxito ==========
  const mostrarPasoExito = (nuevoPago) => {
    contenido.innerHTML = `
      <h3>✅ Registro exitoso</h3>
      <p style="color: #cccccc;">El miembro <strong style="color: #FF6B35;">${miembroCreado.nombre}</strong> fue asociado al plan <strong style="color: #FF6B35;">${membresiaSeleccionada.nombrePlan}</strong>.</p>
      <p style="margin-top: 15px; padding: 10px; background-color: #2a2a2a; border-radius: 6px; color: #cccccc; border: 1px solid #3a3a3a;">
        ✅ Pago registrado correctamente
      </p>
      <div class="${estilos.botones}" style="margin-top: 20px;">
        <button id="imprimir-ticket-final" class="${estilos.btnContinuar}">🖨️ Imprimir Ticket</button>
        <button id="cerrar" class="${estilos.btnCerrar}">Cerrar</button>
      </div>
    `;
    
    contenido.querySelector('#imprimir-ticket-final').addEventListener('click', () => {
      imprimirTicket(nuevoPago, miembroCreado, membresiaSeleccionada, tipoDeMiembroSeleccionado);
    });
    
    contenido.querySelector('#cerrar').addEventListener('click', () => {
      modal.remove();
      onFinalizar?.();
    });
  };


  // Iniciar wizard
  // Si ya hay una membresía preseleccionada, ir directamente al paso de pago
  if (membresiaId) {
    (async () => {
      const lista = await apiObtenerMembresias();
      membresiaSeleccionada = lista.find((m) => m.id === membresiaId);
      if (membresiaSeleccionada) {
        mostrarPasoPago();
      } else {
        mostrarPasoSeleccionMembresia();
      }
    })();
  } else {
    mostrarPasoSeleccionMembresia();
  }
};
