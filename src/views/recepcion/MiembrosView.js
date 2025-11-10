import {
    apiObtenerMiembros,
    apiObtenerMiembroPorId,
    apiCrearMiembro,
    apiActualizarMiembro,
    apiEliminarMiembro,
    apiObtenerTiposDeMiembro
} from "../../api/membersApi";
import { apiObtenerEntrenadores } from '../../api/trainersApi.js';
import { apiObtenerMembresias, apiObtenerMembresiasXMiembros } from '../../api/membershipApi.js';
import { imprimirCredencial } from "../../utils/imprimirCredencial.js";
import { subirImagenAImgbb } from "../../utils/subirImagen.js";
import estilos from './MiembrosView.module.css';
import { renderizarWizardAgregarMiembro } from "./WizardAgregarMiembro/WizardAgregarMiembro.js";
import { apiCrearMembresiaXMiembro } from '../../api/membershipApi.js';
import { apiCrearPago } from '../../api/apiPago.js';
import { imprimirTicket } from '../../utils/imprimirTicket.js';
import QRCode from 'qrcode';

const PERMITE_ELIMINAR_MIEMBROS = false;

/**
 * Muestra un modal con un código QR generado a partir de `textoQR`.
 * Retorna una Promise que se resuelve a true si el usuario confirma, false si cancela.
 */
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

        // Generar QR usando la librería `qrcode` importada (fallback a texto si falla)
        try {
            if (QRCode && typeof QRCode.toCanvas === 'function') {
                // Usar la función toCanvas para dibujar directamente en el canvas
                QRCode.toCanvas(canvas, textoQR, { width: 220, margin: 2 })
                    .catch(err => {
                        console.warn('Error generando QR en canvas:', err);
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
        } catch (e) {
            console.warn('No se pudo generar QR en canvas, mostrando texto fallback. Error:', e);
            const pre = document.createElement('pre');
            pre.style.color = '#fff';
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.textAlign = 'left';
            pre.textContent = textoQR;
            canvas.replaceWith(pre);
        }

        btnCancelar.addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });

        btnConfirmar.addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
    });
};


// Modal simple para mostrar datos de contacto del miembro
const mostrarModalContacto = (miembro) => {
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

    const fotoUrl = miembro.foto || 'https://via.placeholder.com/64?text=👤';
    caja.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;background:#333;flex:0 0 auto;display:flex;align-items:center;justify-content:center;">
                <img src="${fotoUrl}" alt="${miembro.nombre}" style="width:100%;height:100%;object-fit:cover;"/>
            </div>
            <div style="font-size:16px;">${miembro.nombre} ${miembro.apellidos || ''}</div>
        </div>
        <div style="background:#111;margin-bottom:12px;padding:12px;border-radius:8px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <strong>Teléfono:</strong><span id="dato-telefono">${miembro.telefono || 'N/A'}</span>
                </div>
                <button class="btn-copy" data-copy="telefono" style="padding:6px 10px;border:none;border-radius:6px;background:#2d6cdf;color:#fff;cursor:pointer;">Copiar</button>
            </div>
            <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <strong>Dirección:</strong><span>${miembro.direccion || 'N/A'}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <strong>Email:</strong><span id="dato-email">${miembro.email || 'N/A'}</span>
                </div>
                <button class="btn-copy" data-copy="email" style="padding:6px 10px;border:none;border-radius:6px;background:#2d6cdf;color:#fff;cursor:pointer;">Copiar</button>
            </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button id="cerrar-contacto" style="padding:8px 12px;border-radius:6px;border:none;background:#FF6B35;color:white;">Cerrar</button>
        </div>
    `;

    modal.appendChild(caja);
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'cerrar-contacto' || e.target === modal) {
            modal.remove();
        }
    });

    // Copiar al portapapeles
    const tryCopy = async (text, btn) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            const original = btn.textContent;
            btn.textContent = 'Copiado';
            btn.disabled = true;
            setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1500);
        } catch (err) {
            console.warn('No se pudo copiar al portapapeles', err);
            alert('No se pudo copiar al portapapeles.');
        }
    };

    const buttons = caja.querySelectorAll('.btn-copy');
    buttons.forEach(btn => {
        const tipo = btn.getAttribute('data-copy');
        const valor = tipo === 'telefono' ? (miembro.telefono || '') : tipo === 'email' ? (miembro.email || '') : '';
        if (!valor) {
            btn.disabled = true;
            btn.style.opacity = '0.6';
        } else {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                tryCopy(valor, btn);
            });
        }
    });
};

/**
 * Muestra un modal con el comprobante de pago y ofrece dos opciones:
 * - Imprimir comprobante
 * - Terminar registro (cerrar)
 * Retorna una Promise que se resuelve cuando el usuario elige cualquiera de las acciones.
 */
const mostrarModalComprobante = (datosPago, miembro, membresia, tipoMiembro) => {
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

        // Contenido del comprobante (resumen)
        const fechaPago = new Date(datosPago.fechaPago).toLocaleString();
        caja.innerHTML = `
            <h3 style="margin-top:0;margin-bottom:8px;">Comprobante de Pago</h3>
            <p style="color:#ccc;margin-bottom:12px;">Revise los datos del pago. Puede imprimir el comprobante o terminar el registro.</p>
            <div style="background:#111;margin-bottom:12px;padding:12px;border-radius:8px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>Miembro:</strong><span>${miembro.nombre} ${miembro.apellidos || ''}</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>Membresía:</strong><span>${membresia.nombrePlan || 'N/A'}</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>Monto:</strong><span>$${Number(datosPago.monto).toFixed(2)}</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>Método:</strong><span>${datosPago.metodoPago || 'N/A'}</span></div>
                <div style="display:flex;justify-content:space-between;"><strong>Fecha:</strong><span>${fechaPago}</span></div>
            </div>
        `;

        const botones = document.createElement('div');
        botones.style.display = 'flex';
        botones.style.justifyContent = 'flex-end';
        botones.style.gap = '10px';

        const btnTerminar = document.createElement('button');
        btnTerminar.textContent = 'Terminar registro';
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

        btnTerminar.addEventListener('click', () => {
            modal.remove();
            resolve('terminar');
        });

        btnImprimir.addEventListener('click', async () => {
            try {
                imprimirTicket(datosPago, miembro, membresia, tipoMiembro);
            } catch (err) {
                console.error('Error imprimiendo ticket:', err);
            }
            // Después de imprimir, cerramos modal y resolvemos
            modal.remove();
            resolve('imprimir');
        });
    });
};


// --- Estado del Módulo (variables que guardan la información) ---
let listaMiembros = [];       // Cache de todos los miembros
let listaEntrenadores = [];   // Cache para el <select>
let listaTiposMiembro = []; // Cache para el <select>
let listaMembresias = []; // Cache para el <select> de membresías
let listaMembresiasXMiembros = []; // Registros de membresía por miembro
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;
let modoFormulario = 'crear';
let guardandoMiembro = false;
let seccionActual = 1; // Control de sección actual del formulario
let eliminandoMiembro = false; // Evita eliminaciones dobles

// --- Contenedor Principal ---
let contenedorVista; // El 'div' donde se renderiza este módulo

/**
 * Función principal que renderiza la vista
 */
export const renderizarVistaMiembros = async (contenedor) => {
    contenedorVista = contenedor; // Guardamos el contenedor principal
    
    // 1. Renderizamos el "esqueleto" (controles, tabla vacía, modales ocultos)
    renderizarEsqueleto();
    
    // 2. Conectamos los listeners (botones, formularios, etc.)
    adjuntarEventListeners();
    
    // 3. Cargamos las listas para los <select> de los modales
    // (lo hacemos en paralelo para ganar tiempo)
    Promise.all([
        apiObtenerEntrenadores(),
        apiObtenerTiposDeMiembro(),
        apiObtenerMembresias(),
        apiObtenerMembresiasXMiembros()
    ]).then(([entrenadores, tipos, membresias, mxm]) => {
        listaEntrenadores = entrenadores;
        listaTiposMiembro = tipos;
        listaMembresias = membresias;
        if (Array.isArray(mxm)) {
            listaMembresiasXMiembros = mxm;
        }
        // Cargar los selects del formulario si ya existe
        cargarSelectsFormulario();
    });

    // 4. Cargamos los datos de los miembros y los mostramos
    await cargarYMostrarMiembros();
    // const membresiasXMiembros = await apiObtenerMembresiasXMiembros();
    // console.log('Membresias por Miembros:', membresiasXMiembros);
}

// Actualizar cuando otras vistas cambian las asignaciones
try {
    window.removeEventListener('mxm:changed', cargarYMostrarMiembros);
    window.addEventListener('mxm:changed', cargarYMostrarMiembros);
} catch (_) {}

/**
 * Carga los miembros desde la API y actualiza la vista
 */
const cargarYMostrarMiembros = async () => {
    // Mostramos un 'cargando' en la tabla
    const cuerpoTabla = contenedorVista.querySelector('#miembros-cuerpo-tabla');
    if (cuerpoTabla) cuerpoTabla.innerHTML = '<tr><td colspan="9">Cargando...</td></tr>';

    listaMiembros = await apiObtenerMiembros();
    // Asegurar que la lista de planes esté disponible antes de renderizar
    if (!Array.isArray(listaMembresias) || listaMembresias.length === 0) {
        try {
            const mems = await apiObtenerMembresias();
            if (Array.isArray(mems)) listaMembresias = mems;
        } catch (e) {
            console.warn('No se pudieron cargar las membresías para la tabla de miembros.');
        }
    }
    // Siempre refrescamos las membresías por miembro para tener datos actualizados
    const mxm = await apiObtenerMembresiasXMiembros();
    // Solo reemplazar el cache si la respuesta es un arreglo válido.
    if (Array.isArray(mxm)) {
        listaMembresiasXMiembros = mxm;
    } else {
        console.warn('apiObtenerMembresiasXMiembros no devolvió un arreglo; se conserva el cache existente.');
    }
    mostrarContenido();
    if (contenedorVista) {
        const filtroActual = contenedorVista.querySelector('#filtro-premium')?.value || '';
        renderizarListaPremiumModal(filtroActual);
    }
}

/**
 * Filtra, pagina y muestra los datos en la tabla
 */
const mostrarContenido = () => {
    // Obtenemos las referencias a los elementos del DOM
    const cuerpoTabla = contenedorVista.querySelector('#miembros-cuerpo-tabla');
    const indicadorPagina = contenedorVista.querySelector('#indicador-pagina');
    const botonPrev = contenedorVista.querySelector('#boton-prev');
    const botonNext = contenedorVista.querySelector('#boton-next');
    
    if (!cuerpoTabla) return; // Si la vista no está cargada, salir

    // 1. Filtrar (según el buscador)
    const terminoBusqueda = (contenedorVista.querySelector('#buscador').value || '').toLowerCase();
    const miembrosFiltrados = listaMiembros.filter(miembro => 
        (miembro.nombre || '').toLowerCase().includes(terminoBusqueda) ||
        (miembro.apellidos || '').toLowerCase().includes(terminoBusqueda) ||
        String(miembro.dni).includes(terminoBusqueda)
    );


    // 2. Paginar
    const totalPaginas = Math.ceil(miembrosFiltrados.length / FILAS_POR_PAGINA);
    paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas)); 
    const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
    const fin = inicio + FILAS_POR_PAGINA;
    const miembrosPaginados = miembrosFiltrados.slice(inicio, fin);

    // 3. Renderizar Tabla
    cuerpoTabla.innerHTML = ''; // Limpiar
    const TOTAL_COLUMNAS = 9;

    if (miembrosPaginados.length === 0) {
        cuerpoTabla.innerHTML = `<tr><td colspan="${TOTAL_COLUMNAS}">No se encontraron miembros.</td></tr>`;
    } else {
        miembrosPaginados.forEach(miembro => {
            const fila = document.createElement('tr');
            // Formatear fecha
            const fechaNac = miembro.fechaNacimiento
                ? new Date(miembro.fechaNacimiento).toLocaleDateString()
                : 'N/A';
            const fotoUrl = miembro.foto || 'https://via.placeholder.com/40?text=-';
            // Determinar última membresía y estado activo
            const registros = (listaMembresiasXMiembros || []).filter(r => Number(r.miembroId) === Number(miembro.id));
            let ultimo = null;
            if (registros.length > 0) {
                ultimo = registros.reduce((acc, cur) => {
                    const fAcc = acc?.fechaFin ? new Date(acc.fechaFin).getTime() : 0;
                    const fCur = cur?.fechaFin ? new Date(cur.fechaFin).getTime() : 0;
                    return fCur >= fAcc ? cur : acc;
                }, registros[0]);
            }
            const ahora = Date.now();
            const inicio = ultimo?.fechaInicio ? new Date(ultimo.fechaInicio).getTime() : null;
            const fin = ultimo?.fechaFin ? new Date(ultimo.fechaFin).getTime() : null;
            // Considerar el fin como inclusivo hasta el final del día
            const finInclusivo = fin != null ? (fin + 24*60*60*1000 - 1) : null;
            const activaPorFecha = (inicio != null && finInclusivo != null) ? (ahora >= inicio && ahora <= finInclusivo) : false;
            const puntoColor = activaPorFecha ? '#16a34a' : '#dc2626';
            const puntoHtml = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${puntoColor};margin-right:6px;vertical-align:middle"></span>`;
            const fechaFinTexto = ultimo?.fechaFin ? new Date(ultimo.fechaFin).toLocaleDateString() : null;
            let textoMembresia = 'N/A';
            if (ultimo) {
                let planName = ultimo?.membresia?.nombrePlan || null;
                let typeName = ultimo?.membresia?.tipoDeMembresia?.descripcion || null;
                if (!planName || !typeName) {
                    const targetId = Number(ultimo.membresiaId || ultimo.membresia?.id);
                    const mem = listaMembresias.find(m => Number(m.id) === targetId);
                    if (mem) {
                        planName = planName || mem?.nombrePlan || null;
                        typeName = typeName || mem?.tipoDeMembresia?.descripcion || null;
                    }
                }
                if (planName && typeName) textoMembresia = `${planName} (${typeName})`;
                else textoMembresia = planName || typeName || 'N/A';
            }
            
            fila.innerHTML = `
                <td>${miembro.id}</td>
                <td>${miembro.nombre}</td>
                <td>${miembro.apellidos || ''}</td>
                <td>${miembro.dni || 'N/A'}</td>
                <td>${fechaNac}</td>
                <td><img src="${fotoUrl}" alt="${miembro.nombre}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                <td>${textoMembresia}</td>
                <td>
                    ${puntoHtml}${activaPorFecha ? 'Activa' : 'Vencida'}
                    ${fechaFinTexto ? `<div style="margin-top:4px;color:#64748b;font-size:12px;">${activaPorFecha ? 'Hasta' : 'Venció'} ${fechaFinTexto}</div>` : ''}
                </td>
                <td class="${estilos.acciones}">
                    <svg class="${estilos.botonEditar} ${estilos.accionIcon}" data-id="${miembro.id}" title="Editar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                    </svg>
                    ${PERMITE_ELIMINAR_MIEMBROS ? `
                        <svg class="${estilos.botonEliminar} ${estilos.accionIcon}" data-id="${miembro.id}" title="Eliminar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
                            <path d="M9 3h6v1h5v2H4V4h5V3zm1 4h1v10h-1V7zm4 0h1v10h-1V7zm-7 0h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"/>
                        </svg>
                    ` : ''}
                    <svg class="${estilos.botonImprimir} ${estilos.accionIcon}" data-id="${miembro.id}" title="Imprimir" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
                        <path d="M6 9V4h12v5h2a2 2 0 0 1 2 2v6h-4v4H8v-4H4v-6a2 2 0 0 1 2-2h2zm2-3v3h8V6H8zm0 10v2h8v-2H8z"/>
                    </svg>
                    <svg class="boton-contacto ${estilos.accionIcon}" data-id="${miembro.id}" title="Contacto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF5722">
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z"/>
                    </svg>
                </td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    // 4. Actualizar Paginación
    indicadorPagina.textContent = `Página ${totalPaginas === 0 ? 0 : paginaActual} de ${totalPaginas}`;
    botonPrev.disabled = (paginaActual === 1);
    botonNext.disabled = (paginaActual === totalPaginas || totalPaginas === 0);
}

const membresiaEstaActiva = (registro) => {
    if (!registro) return false;
    const estado = (registro.estadoMembresia?.descripcion || '').toLowerCase();
    if (estado === 'activa') return true;
    const inicio = registro.fechaInicio ? new Date(registro.fechaInicio).getTime() : null;
    const fin = registro.fechaFin ? new Date(registro.fechaFin).getTime() : null;
    if (inicio == null || fin == null) return false;
    const ahora = Date.now();
    const finInclusivo = fin + (24 * 60 * 60 * 1000 - 1);
    return ahora >= inicio && ahora <= finInclusivo;
};

const registroEsPremium = (registro) => {
    const descripcion = (registro?.membresia?.tipoDeMembresia?.descripcion || '').toLowerCase();
    const plan = (registro?.membresia?.nombrePlan || '').toLowerCase();
    return descripcion.includes('premium') || plan.includes('premium');
};

const obtenerMiembrosPremiumActivos = () => {
    if (!Array.isArray(listaMembresiasXMiembros) || listaMembresiasXMiembros.length === 0) return [];
    const premiumPorMiembro = new Map();
    listaMembresiasXMiembros.forEach(registro => {
        if (!registro?.miembro) return;
        if (!registroEsPremium(registro)) return;
        if (!membresiaEstaActiva(registro)) return;
        const anterior = premiumPorMiembro.get(registro.miembroId);
        const fechaAnterior = anterior?.fechaFin ? new Date(anterior.fechaFin).getTime() : 0;
        const fechaActual = registro.fechaFin ? new Date(registro.fechaFin).getTime() : 0;
        if (!anterior || fechaActual >= fechaAnterior) {
            premiumPorMiembro.set(registro.miembroId, registro);
        }
    });
    return Array.from(premiumPorMiembro.values());
};

const renderizarListaPremiumModal = (terminoBusqueda = '') => {
    if (!contenedorVista) return;
    const cuerpo = contenedorVista.querySelector('#lista-premium-cuerpo');
    const resumen = contenedorVista.querySelector('#premium-resumen');
    const alertaEntrenadores = contenedorVista.querySelector('#alerta-entrenadores');
    if (!cuerpo) return;

    const registros = obtenerMiembrosPremiumActivos();
    const termino = terminoBusqueda.trim().toLowerCase();
    const filtrados = termino
        ? registros.filter(registro => {
            const miembro = registro.miembro || {};
            const texto = `${miembro.nombre || ''} ${miembro.apellidos || ''} ${miembro.dni || ''}`.toLowerCase();
            return texto.includes(termino);
        })
        : registros;

    const entrenadoresActivos = (listaEntrenadores || []).filter(ent => ent.activo);
    if (alertaEntrenadores) {
        alertaEntrenadores.textContent = entrenadoresActivos.length
            ? `Entrenadores activos disponibles: ${entrenadoresActivos.length}`
            : 'No hay entrenadores activos cargados. Agrega o activa alguno para asignarlos.';
    }

    if (resumen) {
        if (!registros.length) resumen.textContent = 'No hay miembros premium con membresías activas.';
        else resumen.textContent = `${filtrados.length} de ${registros.length} miembros listados.`;
    }

    if (!filtrados.length) {
        cuerpo.innerHTML = `<tr><td colspan="5">No se encontraron miembros que coincidan.</td></tr>`;
        return;
    }

    const optionsHTML = (miembro) => {
        const actualId = miembro.entrenadorId || miembro.entrenador?.id || '';
        const placeholder = '<option value="">Elegir entrenador</option>';
        if (!entrenadoresActivos.length) return '<option value="">Sin entrenadores activos</option>';
        const options = entrenadoresActivos.map(ent => {
            const selected = Number(actualId) === Number(ent.id) ? 'selected' : '';
            return `<option value="${ent.id}" ${selected}>${ent.nombre}</option>`;
        }).join('');
        return `${placeholder}${options}`;
    };

    cuerpo.innerHTML = filtrados.map(registro => {
        const miembro = registro.miembro || {};
        const miembroGlobal = listaMiembros.find(m => Number(m.id) === Number(registro.miembroId)) || miembro;
        const plan = registro.membresia?.nombrePlan || 'Sin plan';
        const tipo = registro.membresia?.tipoDeMembresia?.descripcion || 'Premium';
        const vence = registro.fechaFin ? new Date(registro.fechaFin).toLocaleDateString() : 'Sin fecha';
        const entrenadorActual = miembroGlobal?.entrenador?.nombre || 'Sin asignar';
        const miembroId = miembro.id || registro.miembroId;
        return `
            <tr>
                <td>
                    <div class="${estilos.premiumInfo}">
                        <span class="${estilos.premiumNombre}">${miembro.nombre || 'Sin nombre'} ${miembro.apellidos || ''}</span>
                        <span class="${estilos.premiumDni}">DNI: ${miembro.dni || 'N/A'}</span>
                    </div>
                </td>
                <td>
                    <div class="${estilos.premiumPlan}">
                        <strong>${plan}</strong>
                        <small>${tipo}</small>
                    </div>
                </td>
                <td>
                    <div class="${estilos.premiumEstado}">
                        <span class="${estilos.estadoBadge}">Activa</span>
                        <small>Hasta ${vence}</small>
                    </div>
                </td>
                <td>${entrenadorActual}</td>
                <td>
                    <div class="${estilos.asignarAccion}">
                        <select class="${estilos.selectAsignar}" data-select-miembro="${miembroId}" ${entrenadoresActivos.length ? '' : 'disabled'}>
                            ${optionsHTML(miembroGlobal)}
                        </select>
                        <button type="button" class="${estilos.botonAsignarEntrenador}" data-accion="asignar-entrenador" data-miembro-id="${miembroId}" ${entrenadoresActivos.length ? '' : 'disabled'}>
                            Asignar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

const abrirModalAsignarEntrenador = async () => {
    if (!contenedorVista) return;
    if (!Array.isArray(listaEntrenadores) || listaEntrenadores.length === 0) {
        try {
            listaEntrenadores = await apiObtenerEntrenadores();
        } catch (err) {
            console.error('Error al cargar entrenadores:', err);
        }
    }
    if (!Array.isArray(listaMembresiasXMiembros) || listaMembresiasXMiembros.length === 0) {
        try {
            const mxm = await apiObtenerMembresiasXMiembros();
            listaMembresiasXMiembros = Array.isArray(mxm) ? mxm : [];
        } catch (err) {
            console.error('Error al cargar membresiaXMiembros:', err);
        }
    }
    const filtroActual = contenedorVista.querySelector('#filtro-premium')?.value || '';
    renderizarListaPremiumModal(filtroActual);
    const modal = contenedorVista.querySelector('#modal-asignar-entrenador');
    if (modal) modal.classList.add(estilos.activo);
};

const manejarAsignacionEntrenador = async (miembroId) => {
    if (!miembroId) return;
    const select = contenedorVista.querySelector(`select[data-select-miembro="${miembroId}"]`);
    if (!select) return;
    const entrenadorId = Number(select.value);
    if (!entrenadorId) {
        alert('Selecciona un entrenador activo para continuar.');
        return;
    }
    const miembro = listaMiembros.find(m => Number(m.id) === Number(miembroId));
    if (!miembro) {
        alert('No se pudo encontrar al miembro seleccionado.');
        return;
    }
    const payload = {
        nombre: miembro.nombre,
        apellidos: miembro.apellidos || '',
        email: miembro.email || '',
        dni: miembro.dni || '',
        telefono: miembro.telefono || '',
        direccion: miembro.direccion || '',
        fechaNacimiento: miembro.fechaNacimiento || '',
        foto: miembro.foto || '',
        tipoDeMiembroId: miembro.tipoDeMiembroId || miembro.tipoDeMiembro?.id || 0,
        entrenadorId,
        eliminado: miembro.eliminado ?? false
    };
    try {
        await apiActualizarMiembro(miembro.id, payload);
        await cargarYMostrarMiembros();
        const filtroActual = contenedorVista.querySelector('#filtro-premium')?.value || '';
        renderizarListaPremiumModal(filtroActual);
        alert('Entrenador asignado correctamente.');
    } catch (err) {
        console.error('Error asignando entrenador:', err);
        alert('No se pudo asignar el entrenador. Intenta nuevamente.');
    }
};

/**
 * Conecta todos los listeners de la vista (solo se llama una vez)
 */
const adjuntarEventListeners = () => {
    // Usamos delegación de eventos en el contenedor de la vista
    contenedorVista.addEventListener('click', async (e) => {
        if (PERMITE_ELIMINAR_MIEMBROS && e.target.matches('#boton-confirmar-eliminar')) {
            if (eliminandoMiembro) return;
            eliminandoMiembro = true;
            const { id } = e.target.dataset;
            if (id) {
                await manejarConfirmarEliminar(id);
            }
            eliminandoMiembro = false;
            return;
        }

        if (e.target.matches('#tab-gestion')) {
            await abrirModalAsignarEntrenador();
            return;
        }

        // --- Botones de la Tabla (soportando clicks dentro del SVG) ---
        const editarBtn = e.target.closest(`.${estilos.botonEditar}`);
        if (editarBtn) {
            abrirModalEditar(editarBtn.dataset.id);
            return;
        }
        if (PERMITE_ELIMINAR_MIEMBROS) {
            const eliminarBtn = e.target.closest(`.${estilos.botonEliminar}`);
            if (eliminarBtn) {
                abrirModalEliminar(eliminarBtn.dataset.id);
                return;
            }
        }
        
        // --- Botones de Paginación ---
        if (e.target.matches('#boton-prev') && paginaActual > 1) {
            paginaActual--;
            mostrarContenido();
            return;
        }
        if (e.target.matches('#boton-next')) {
            paginaActual++; 
            mostrarContenido();
            return;
        }

        // --- Botón Agregar y Cerrar Modales ---
        if (e.target.matches('#boton-agregar-miembro')) {
            abrirModalAgregar();
            return;
        }
        if (e.target.matches(`.${estilos.modalCerrar}`) || e.target.matches(`.${estilos.modalFondo}`)) {
            cerrarModales();
        }
        if (e.target.matches('#cancelar')) {
            cerrarModales();
            return;
        }
        if (e.target.matches('.modal-cerrar')) {
            const modalAsignar = e.target.closest('#modal-asignar-entrenador');
            if (modalAsignar) {
                modalAsignar.classList.remove(estilos.activo);
                return;
            }
            cerrarModales();
            return;
        }
        const imprimirBtn = e.target.closest(`.${estilos.botonImprimir}`);
        if (imprimirBtn) {
            const id = imprimirBtn.dataset.id;
            const miembro = listaMiembros.find(m => m.id === Number(id));
            imprimirCredencial(miembro);
        }

        const asignarBtn = e.target.closest('[data-accion="asignar-entrenador"]');
        if (asignarBtn) {
            const miembroId = Number(asignarBtn.dataset.miembroId);
            if (miembroId) {
                await manejarAsignacionEntrenador(miembroId);
            }
            return;
        }

        const contactoBtn = e.target.closest('.boton-contacto');
        if (contactoBtn) {
            const id = Number(contactoBtn.dataset.id);
            const m = listaMiembros.find(x => x.id === id);
            if (m) {
                mostrarModalContacto(m);
            }
            return;
        }
    });

    const inputFoto = contenedorVista.querySelector('#foto');
    const previewFoto = contenedorVista.querySelector('#preview-foto');
    const fileInputLabel = contenedorVista.querySelector('.fileInputLabel .fileInputText');

    if (inputFoto && previewFoto) {
        inputFoto.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file) {
                previewFoto.src = URL.createObjectURL(file);
                previewFoto.style.display = 'block';
                // Actualizar texto del botón con el nombre del archivo
                if (fileInputLabel) {
                    fileInputLabel.textContent = file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name;
                }
            } else {
                previewFoto.removeAttribute('src');
                previewFoto.style.display = 'none';
                // Restaurar texto original
                if (fileInputLabel) {
                    fileInputLabel.textContent = 'Seleccionar archivo';
                }
            }
        });
    }

    // Listener para calcular costo cuando cambian tipo de miembro o membresía
    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    if (form) {
        const tipoMiembroSelect = form.querySelector('#tipoDeMiembroId');
        const membresiaSelect = form.querySelector('#membresiaId');
        
        const calcularCosto = () => {
            if (!tipoMiembroSelect || !membresiaSelect) return;
            
            const tipoMiembroId = parseInt(tipoMiembroSelect.value, 10);
            const membresiaId = parseInt(membresiaSelect.value, 10);
            
            if (!tipoMiembroId || !membresiaId) {
                const costoCalculado = form.querySelector('#costo-calculado');
                const costoCalculadoPago = form.querySelector('#costo-calculado-pago');
                const fechaFin = form.querySelector('#fecha-fin-membresia');
                const fechaFinPago = form.querySelector('#fecha-fin-membresia-pago');
                if (costoCalculado) costoCalculado.textContent = '$0.00';
                if (costoCalculadoPago) costoCalculadoPago.textContent = '$0.00';
                if (fechaFin) fechaFin.textContent = '-';
                if (fechaFinPago) fechaFinPago.textContent = '-';
                return;
            }
            
            const tipoMiembro = listaTiposMiembro.find(t => t.id === tipoMiembroId);
            const membresia = listaMembresias.find(m => m.id === membresiaId);
            
            if (tipoMiembro && membresia) {
                const descuento = tipoMiembro.porcentajeDescuento || 0;
                const costoBase = membresia.costoBase || 0;
                const costoFinal = costoBase * (1 - descuento / 100);

                // Actualizar ambos resúmenes si existen (sección membresía y sección pago)
                const costoCalculado = form.querySelector('#costo-calculado');
                const costoCalculadoPago = form.querySelector('#costo-calculado-pago');
                if (costoCalculado) {
                    costoCalculado.textContent = `$${costoFinal.toFixed(2)}`;
                }
                if (costoCalculadoPago) {
                    costoCalculadoPago.textContent = `$${costoFinal.toFixed(2)}`;
                }

                // Calcular fecha fin basada en fechaInicioMembresia y duracionEnDias
                const fechaInicioVal = form.querySelector('#fechaInicioMembresia')?.value;
                let fechaFinTexto = '-';
                if (fechaInicioVal) {
                    const fechaInicioObj = new Date(fechaInicioVal);
                    const durDias = membresia.duracionEnDias || 0;
                    const fechaFinObj = new Date(fechaInicioObj);
                    fechaFinObj.setDate(fechaInicioObj.getDate() + durDias);
                    // Formatear como dd/mm/yyyy
                    const dd = String(fechaFinObj.getDate()).padStart(2, '0');
                    const mm = String(fechaFinObj.getMonth() + 1).padStart(2, '0');
                    const yyyy = fechaFinObj.getFullYear();
                    fechaFinTexto = `${dd}/${mm}/${yyyy}`;
                }

                const fechaFin = form.querySelector('#fecha-fin-membresia');
                const fechaFinPago = form.querySelector('#fecha-fin-membresia-pago');
                if (fechaFin) fechaFin.textContent = fechaFinTexto;
                if (fechaFinPago) fechaFinPago.textContent = fechaFinTexto;
            }
        };
        
        if (tipoMiembroSelect) {
            tipoMiembroSelect.addEventListener('change', calcularCosto);
        }
        if (membresiaSelect) {
            membresiaSelect.addEventListener('change', calcularCosto);
        }
        const fechaInicioInput = form.querySelector('#fechaInicioMembresia');
        if (fechaInicioInput) {
            fechaInicioInput.addEventListener('change', calcularCosto);
        }
    }

    // --- Buscador (evento 'input') ---
    contenedorVista.querySelector('#buscador').addEventListener('input', () => {
        paginaActual = 1; // Resetear a pág 1 al buscar
        mostrarContenido();
    });

    const filtroPremium = contenedorVista.querySelector('#filtro-premium');
    if (filtroPremium) {
        filtroPremium.addEventListener('input', (event) => {
            renderizarListaPremiumModal(event.target.value);
        });
    }
    
    // --- Formulario (evento 'submit') ---
    contenedorVista.querySelector('#modal-formulario-miembro').addEventListener('submit', manejarSubmitFormulario);

    // --- Navegación entre secciones ---
    const botonSiguiente = contenedorVista.querySelector('#boton-siguiente');
    const botonAnterior = contenedorVista.querySelector('#boton-anterior');
    const botonGuardar = contenedorVista.querySelector('#boton-guardar');
    

    if (botonSiguiente) {
        botonSiguiente.addEventListener('click', () => {
            if (validarSeccionActual()) {
                avanzarSeccion();
            }
        });
    }

    if (botonAnterior) {
        botonAnterior.addEventListener('click', () => {
            retrocederSeccion();
        });
    }
}

// --- Lógica de Modales ---

const abrirModalAgregar = () => {
    modoFormulario = 'crear';
    seccionActual = 1; // Resetear a la primera sección

    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    form.reset();
    form.querySelector('#miembro-id').value = '';
    form.querySelector('#foto-actual').value = '';
    const preview = form.querySelector('#preview-foto');
    if (preview) {
        preview.removeAttribute('src');
        preview.style.display = 'none';
    }

    // Establecer fecha de inicio por defecto (hoy)
    const fechaInicioInput = form.querySelector('#fechaInicioMembresia');
    if (fechaInicioInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInicioInput.value = hoy;
    }

    // Limpiar costo calculado
    const costoCalculado = form.querySelector('#costo-calculado');
    if (costoCalculado) {
        costoCalculado.textContent = '$0.00';
    }

    // Cargar los selects
    cargarSelectsFormulario();

    // Mostrar stepper en modo crear
    const stepper = form.querySelector(`.${estilos.stepper}`);
    if (stepper) stepper.style.display = 'flex';

    // Resetear navegación de secciones
    actualizarNavegacionSecciones();

    contenedorVista.querySelector('#modal-titulo').textContent = 'Agregar Nuevo Miembro';
    contenedorVista.querySelector('#modal-miembro').classList.add(estilos.activo);
};
const abrirModalEditar = async (id) => {
    modoFormulario = 'editar';
    seccionActual = 1; // Resetear a la primera sección

    const miembro = await apiObtenerMiembroPorId(id);
    if (!miembro) {
        alert("Error: No se pudo encontrar al miembro.");
        return;
    }

    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    form.querySelector('#miembro-id').value = miembro.id;
    form.querySelector('#nombre').value = miembro.nombre;
    form.querySelector('#apellidos').value = miembro.apellidos || '';
    form.querySelector('#email').value = miembro.email;
    form.querySelector('#dni').value = miembro.dni;
    form.querySelector('#telefono').value = miembro.telefono;
    form.querySelector('#direccion').value = miembro.direccion;
    form.querySelector('#fechaNacimiento').value = miembro.fechaNacimiento ? miembro.fechaNacimiento.split('T')[0] : '';
    form.querySelector('#foto-actual').value = miembro.foto || '';
    
    // Cargar tipo de miembro si existe
    const tipoMiembroSelect = form.querySelector('#tipoDeMiembroId');
    if (tipoMiembroSelect && miembro.tipoDeMiembroId) {
        tipoMiembroSelect.value = miembro.tipoDeMiembroId;
    }

    const preview = form.querySelector('#preview-foto');
    if (preview) {
        if (miembro.foto) {
            preview.src = miembro.foto;
            preview.style.display = 'block';
        } else {
            preview.removeAttribute('src');
            preview.style.display = 'none';
        }
    }

    // Ocultar campos de membresía en modo edición
    const camposMembresia = form.querySelectorAll('.campo-membresia');
    camposMembresia.forEach(campo => {
        if (campo) campo.style.display = 'none';
    });

    // Ocultar stepper y navegación en modo edición
    const stepper = form.querySelector(`.${estilos.stepper}`);
    const botonSiguiente = contenedorVista.querySelector('#boton-siguiente');
    const botonAnterior = contenedorVista.querySelector('#boton-anterior');
    const botonGuardar = contenedorVista.querySelector('#boton-guardar');
    
    if (stepper) stepper.style.display = 'none';
    if (botonSiguiente) botonSiguiente.style.display = 'none';
    if (botonAnterior) botonAnterior.style.display = 'none';
    if (botonGuardar) botonGuardar.style.display = 'none';
    
    // Mostrar todas las secciones en modo edición
    const seccion1 = form.querySelector('[data-seccion="1"]');
    const seccion2 = form.querySelector('[data-seccion="2"]');
    if (seccion1) seccion1.style.display = 'block';
    if (seccion2) seccion2.style.display = 'none'; // Mantener oculta la sección 2 en edición

    // Cargar los selects
    cargarSelectsFormulario();

    contenedorVista.querySelector('#modal-titulo').textContent = 'Editar Miembro';
    contenedorVista.querySelector('#modal-miembro').classList.add(estilos.activo);
};

const abrirModalEliminar = (id) => {
    if (!PERMITE_ELIMINAR_MIEMBROS) return;
    const boton = contenedorVista.querySelector('#boton-confirmar-eliminar');
    const modal = contenedorVista.querySelector('#modal-eliminar');
    if (!boton || !modal) return;
    boton.dataset.id = id;
    modal.classList.add(estilos.activo);
}

const cerrarModales = () => {
    const modalMiembro = contenedorVista.querySelector('#modal-miembro');
    if (modalMiembro) {
        modalMiembro.classList.remove(estilos.activo);
    }
    const modalEliminar = contenedorVista.querySelector('#modal-eliminar');
    if (modalEliminar) {
        modalEliminar.classList.remove(estilos.activo);
    }
    const modalAsignar = contenedorVista.querySelector('#modal-asignar-entrenador');
    if (modalAsignar) {
        modalAsignar.classList.remove(estilos.activo);
    }
    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    if (form) {
        form.reset();
        const hidden = form.querySelector('#foto-actual');
        if (hidden) hidden.value = '';
        const preview = form.querySelector('#preview-foto');
        if (preview) {
            preview.removeAttribute('src');
            preview.style.display = 'none';
        }
        // Mostrar campos de membresía nuevamente
        const camposMembresia = form.querySelectorAll('.campo-membresia');
        camposMembresia.forEach(campo => {
            if (campo) campo.style.display = '';
        });
        // Resetear secciones
        seccionActual = 1;
        // Mostrar stepper nuevamente
        const stepper = form.querySelector(`.${estilos.stepper}`);
        if (stepper) stepper.style.display = 'flex';
        actualizarNavegacionSecciones();
    }
}

/**
 * Carga los selects del formulario con las opciones disponibles
 */
const cargarSelectsFormulario = () => {
    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    if (!form) return;

    // Cargar tipos de miembro
    const tipoMiembroSelect = form.querySelector('#tipoDeMiembroId');
    if (tipoMiembroSelect && listaTiposMiembro.length > 0) {
        tipoMiembroSelect.innerHTML = '<option value="">-- Seleccionar tipo de miembro --</option>';
        listaTiposMiembro.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = `${tipo.descripcion}${tipo.porcentajeDescuento > 0 ? ` (${tipo.porcentajeDescuento}% desc.)` : ''}`;
            tipoMiembroSelect.appendChild(option);
        });
    }

    // Cargar membresías
    const membresiaSelect = form.querySelector('#membresiaId');
    if (membresiaSelect && listaMembresias.length > 0) {
        membresiaSelect.innerHTML = '<option value="">-- Seleccionar membresía --</option>';
        listaMembresias.forEach(membresia => {
            const option = document.createElement('option');
            option.value = membresia.id;
            option.textContent = `${membresia.nombrePlan} - ${membresia.duracionEnDias} días ($${membresia.costoBase})`;
            membresiaSelect.appendChild(option);
        });
    }
}

// --- Lógica de Formularios ---

const manejarSubmitFormulario = async (e) => {
  e.preventDefault();
  const form = e.target;
  if (guardandoMiembro) return;
  guardandoMiembro = true;

  const botonSubmit = form.querySelector('button[type="submit"]');
  const textoOriginalBoton = botonSubmit ? botonSubmit.textContent : '';
  if (botonSubmit) {
    botonSubmit.disabled = true;
    botonSubmit.textContent = 'Guardando...';
  }

  const id = form.querySelector('#miembro-id').value;
  const file = form.querySelector('#foto').files[0]; // archivo seleccionado
  const fotoActual = form.querySelector('#foto-actual').value || "";

  // Subimos la imagen si se eligió una
  let urlFoto = fotoActual;
  if (file) {
    const subida = await subirImagenAImgbb(file);
    if (subida) {
      urlFoto = subida;
    } else if (!fotoActual) {
      alert("No se pudo subir la imagen. El miembro se guardará sin foto.");
    } else {
      alert("No se pudo subir la nueva imagen. Se conservará la foto anterior.");
    }
  }

  const tipoDeMiembroId = form.querySelector('#tipoDeMiembroId')?.value 
    ? parseInt(form.querySelector('#tipoDeMiembroId').value, 10) 
    : 0;

  const datosMiembro = {
        nombre: form.querySelector('#nombre').value,
        apellidos: form.querySelector('#apellidos') ? form.querySelector('#apellidos').value : '',
    email: form.querySelector('#email').value,
    dni: form.querySelector('#dni').value,
    telefono: form.querySelector('#telefono').value,
    direccion: form.querySelector('#direccion').value,
    fechaNacimiento: form.querySelector('#fechaNacimiento').value,
    foto: urlFoto || "",
    tipoDeMiembroId: tipoDeMiembroId || 0,
    entrenadorId: 0,
    eliminado: false
  };

  // Si estamos editando, todo sigue igual
  if (modoFormulario === 'editar' && id) {
    await apiActualizarMiembro(id, datosMiembro);
        cerrarModales();
        await cargarYMostrarMiembros();
        // Restaurar estado del guardado y botón
        const botonSubmitEdit = form.querySelector('button[type="submit"]');
        if (botonSubmitEdit) {
            botonSubmitEdit.disabled = false;
            botonSubmitEdit.textContent = textoOriginalBoton;
        }
        guardandoMiembro = false;
        return;
  }

    // Si estamos creando un nuevo miembro, procesamos el flujo completo (membresía + pago)
    const miembroCreado = await apiCrearMiembro(datosMiembro);

    // Obtener datos de membresía del formulario (no cerramos el modal todavía)
    const membresiaId = form.querySelector('#membresiaId')?.value 
        ? parseInt(form.querySelector('#membresiaId').value, 10) 
        : null;
    const fechaInicioMembresia = form.querySelector('#fechaInicioMembresia')?.value || null;
    const tipoDeMiembroSeleccionado = listaTiposMiembro.find(t => t.id === tipoDeMiembroId);

    if (miembroCreado) {
        try {
            if (membresiaId) {
                // Calcular costo y descuento
                const membresiaSeleccionada = listaMembresias.find(m => m.id === Number(membresiaId));
                const descuento = tipoDeMiembroSeleccionado?.porcentajeDescuento || 0;
                const costoBase = membresiaSeleccionada?.costoBase || 0;
                const costoFinal = costoBase * (1 - descuento / 100);
                const descuentoAplicado = costoBase - costoFinal;

                // Leer el método de pago seleccionado en el formulario (por defecto Efectivo)
                const metodoPagoSeleccionado = form?.querySelector('#metodoPago')?.value || 'Efectivo';

                // Si el método es QR, mostrar modal con el QR y esperar confirmación del usuario
                if (metodoPagoSeleccionado === 'QR') {
                    const qrPayload = JSON.stringify({
                        miembroId: miembroCreado.id,
                        nombre: miembroCreado.nombre,
                        apellidos: miembroCreado.apellidos || '',
                        membresiaId: Number(membresiaId),
                        monto: Number(costoFinal),
                        fecha: new Date().toISOString()
                    });

                    const confirmado = await mostrarModalQR(qrPayload);
                    if (!confirmado) {
                        // Usuario canceló el pago por QR: revertimos el miembro creado para evitar huérfanos
                        try {
                            await apiEliminarMiembro(miembroCreado.id);
                        } catch {}
                        // Restaurar estado de UI (botón y flag) y mantener modal abierto para que el usuario cambie método
                        if (botonSubmit) {
                            botonSubmit.disabled = false;
                            botonSubmit.textContent = textoOriginalBoton;
                        }
                        guardandoMiembro = false;
                        return;
                    }
                }

                // Crear pago con el método seleccionado (Efectivo o QR)
                const nuevoPago = await apiCrearPago({
                    monto: Number(costoFinal),
                    fechaPago: new Date().toISOString(),
                    metodoPago: metodoPagoSeleccionado,
                    descuentoAplicado: Number(descuentoAplicado || 0)
                });

                // Calcular fechas
                const fechaInicioFinal = fechaInicioMembresia ? new Date(fechaInicioMembresia) : new Date();
                const fechaFin = new Date(fechaInicioFinal);
                fechaFin.setDate(fechaInicioFinal.getDate() + (membresiaSeleccionada?.duracionEnDias || 0));

                // Crear relación miembro↔membresía
                const nuevaRelacion = {
                    miembroId: miembroCreado.id,
                    membresiaId: Number(membresiaId),
                    estadoMembresiaId: 1,
                    pagoId: nuevoPago?.id || null,
                    fechaInicio: fechaInicioFinal.toISOString(),
                    fechaFin: fechaFin.toISOString()
                };

                await apiCrearMembresiaXMiembro(nuevaRelacion);
                console.log('Membresía y pago creados automáticamente (miembroId:', miembroCreado.id, ', metodoPago:', metodoPagoSeleccionado, ')');

                // Mostrar comprobante con opciones: imprimir o terminar
                try {
                    await mostrarModalComprobante(nuevoPago, miembroCreado, membresiaSeleccionada, tipoDeMiembroSeleccionado);
                } catch (err) {
                    console.warn('Usuario cerró el comprobante sin acción explícita.', err);
                }
            }
        } catch (err) {
            console.error('Error al asignar membresía/pago automáticamente:', err);
        } finally {
            // Cerrar modal y refrescar la lista de miembros
            cerrarModales();
            await cargarYMostrarMiembros();
        }
    } else {
        await cargarYMostrarMiembros();
    }

    // Restaurar estado del guardado y botón (se hace también en paths anteriores)
    if (botonSubmit) {
        botonSubmit.disabled = false;
        botonSubmit.textContent = textoOriginalBoton;
    }
    guardandoMiembro = false;
};


/**
 * Valida los campos de la sección actual
 */
const validarSeccionActual = () => {
    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    if (!form) return false;

    if (seccionActual === 1) {
        // Validar campos de la sección 1
        const nombre = form.querySelector('#nombre');
        const apellidos = form.querySelector('#apellidos');
        const dni = form.querySelector('#dni');
        const direccion = form.querySelector('#direccion');
        
        if (!nombre || !nombre.value.trim()) {
            alert('Por favor, ingrese el nombre completo.');
            nombre?.focus();
            return false;
        }
        if (!apellidos || !apellidos.value.trim()) {
            alert('Por favor, ingrese los apellidos.');
            apellidos?.focus();
            return false;
        }
        if (!dni || !dni.value || dni.value.length < 8) {
            alert('Por favor, ingrese un DNI válido (mínimo 8 dígitos).');
            dni?.focus();
            return false;
        }
        if (!direccion || !direccion.value.trim()) {
            alert('Por favor, ingrese la dirección.');
            direccion?.focus();
            return false;
        }
        return true;
    } else if (seccionActual === 2) {
        // Validar campos de la sección 2
        const tipoMiembro = form.querySelector('#tipoDeMiembroId');
        const membresia = form.querySelector('#membresiaId');
        const fechaInicio = form.querySelector('#fechaInicioMembresia');
        
        if (!tipoMiembro || !tipoMiembro.value) {
            alert('Por favor, seleccione un tipo de miembro.');
            tipoMiembro?.focus();
            return false;
        }
        if (!membresia || !membresia.value) {
            alert('Por favor, seleccione una membresía.');
            membresia?.focus();
            return false;
        }
        if (!fechaInicio || !fechaInicio.value) {
            alert('Por favor, seleccione la fecha de inicio de la membresía.');
            fechaInicio?.focus();
            return false;
        }
        return true;
    } else if (seccionActual === 3) {
        // Validar campos de la sección 3 (pago)
        const metodoPago = form.querySelector('#metodoPago');
        if (!metodoPago || !metodoPago.value) {
            alert('Por favor, seleccione un método de pago.');
            metodoPago?.focus();
            return false;
        }
        return true;
    }
    return true;
};

/**
 * Avanza a la siguiente sección
 */
const avanzarSeccion = () => {
    if (seccionActual < 3) {
        seccionActual++;
        actualizarNavegacionSecciones();
    }
};

/**
 * Retrocede a la sección anterior
 */
const retrocederSeccion = () => {
    if (seccionActual > 1) {
        seccionActual--;
        actualizarNavegacionSecciones();
    }
};

/**
 * Actualiza la UI del stepper y los botones de navegación
 */
const actualizarNavegacionSecciones = () => {
    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    if (!form) return;

    // Ocultar/mostrar secciones
    const seccion1 = form.querySelector('[data-seccion="1"]');
    const seccion2 = form.querySelector('[data-seccion="2"]');
    const seccion3 = form.querySelector('[data-seccion="3"]');

    if (seccion1) seccion1.style.display = seccionActual === 1 ? 'block' : 'none';
    if (seccion2) seccion2.style.display = seccionActual === 2 ? 'block' : 'none';
    if (seccion3) seccion3.style.display = seccionActual === 3 ? 'block' : 'none';

    // Actualizar stepper (3 pasos)
    const stepper = form.querySelector(`.${estilos.stepper}`);
    if (stepper) {
        const steps = stepper.querySelectorAll(`.${estilos.step}`);
        const stepLines = stepper.querySelectorAll(`.${estilos.stepLine}`);

        steps.forEach((step, index) => {
            const stepNum = index + 1;
            if (stepNum === seccionActual) {
                step.classList.add(estilos.stepActivo);
                step.classList.remove(estilos.stepCompletado);
            } else if (stepNum < seccionActual) {
                step.classList.add(estilos.stepCompletado);
                step.classList.remove(estilos.stepActivo);
            } else {
                step.classList.remove(estilos.stepActivo, estilos.stepCompletado);
            }
        });

        // Activar líneas según el progreso
        stepLines.forEach((line, idx) => {
            // line 0 = entre paso1 y 2 -> activo si seccionActual >= 2
            // line 1 = entre paso2 y 3 -> activo si seccionActual >= 3
            if (seccionActual >= idx + 2) {
                line.classList.add('activo');
            } else {
                line.classList.remove('activo');
            }
        });
    }

    // Actualizar botones de navegación
    const botonAnterior = contenedorVista.querySelector('#boton-anterior');
    const botonSiguiente = contenedorVista.querySelector('#boton-siguiente');
    const botonGuardar = contenedorVista.querySelector('#boton-guardar');

    if (botonAnterior) {
        botonAnterior.style.display = seccionActual > 1 ? 'inline-block' : 'none';
    }
    if (botonSiguiente) {
        botonSiguiente.style.display = seccionActual < 3 ? 'inline-block' : 'none';
    }
    if (botonGuardar) {
        botonGuardar.style.display = seccionActual === 3 ? 'inline-block' : 'none';
    }
};

const manejarConfirmarEliminar = async (id) => {
    const miembroId = Number(id);
    if (Number.isNaN(miembroId)) {
        console.warn('ID de miembro inválido para eliminar:', id);
        return;
    }

    await apiEliminarMiembro(miembroId);
    cerrarModales();
    await cargarYMostrarMiembros(); // Recargar la tabla
}



/**
 * Renderiza el HTML "esqueleto" (vacío)
 */
const renderizarEsqueleto = () => {
    contenedorVista.innerHTML = `
        <div class="${estilos.contenedor}">
        <div class="${estilos.tituloModulo}">
            <h2>Módulo de Gestión de Miembros</h2>
        </div>
        <div class="${estilos.tituloModulo}">
            <div id="zona-dinamica">
                <div class="${estilos.cabecera}">
                    <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar por DNI, nombre...">
                </div>
                <div class="${estilos.accionesHeader}">
                    <button id="tab-gestion" class="${estilos.botonAgregar}">Asignar entrenador personal</button>
                    <button id="boton-agregar-miembro" class="${estilos.botonAgregar}">+ Agregar Miembro</button>
                </div>

                <div class="${estilos.tablaWrapper}">
                    <table class="${estilos.tabla}">
                        <thead>
                           <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Apellidos</th>
                                <th>DNI</th>
                                <th>F. Nac.</th>
                                <th>Foto</th>
                                <th>Membresía</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="miembros-cuerpo-tabla">
                            </tbody>
                    </table>
                </div>

                <div class="${estilos.paginacion}">
                    <button id="boton-prev" class="${estilos.botonPagina}" disabled>Anterior</button>
                    <span id="indicador-pagina" class="${estilos.indicadorPagina}">Página 0 de 0</span>
                    <button id="boton-next" class="${estilos.botonPagina}" disabled>Siguiente</button>
                </div>
            </div>
        </div>
        </div>

       <div id="modal-miembro" class="${estilos.modal}">
            <div class="${estilos.modalFondo} modal-cerrar"></div>
            <div class="${estilos.modalContenido}">
                <div class="${estilos.modalCabecera}">
                <h3 id="modal-titulo">Agregar Miembro</h3>
                <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
                </div>
                
                <form id="modal-formulario-miembro" class="${estilos.formularioModal}">
                <input type="hidden" id="miembro-id">

                <!-- Indicador de Secciones (Stepper) -->
                <div class="${estilos.stepper}">
                    <div class="${estilos.step} ${estilos.stepActivo}" data-step="1">
                        <div class="${estilos.stepNumber}">1</div>
                        <div class="${estilos.stepLabel}">Registro de Datos</div>
                    </div>
                    <div class="${estilos.stepLine}"></div>
                    <div class="${estilos.step}" data-step="2">
                        <div class="${estilos.stepNumber}">2</div>
                        <div class="${estilos.stepLabel}">Membresía</div>
                    </div>
                    <div class="${estilos.stepLine}"></div>
                    <div class="${estilos.step}" data-step="3">
                        <div class="${estilos.stepNumber}">3</div>
                        <div class="${estilos.stepLabel}">Pago</div>
                    </div>
                </div>

                <!-- Sección 1: Registro de Datos -->
                <div class="${estilos.seccionFormulario} ${estilos.seccionActiva} ${estilos.seccionCompacta}" data-seccion="1">
                    <h4 class="${estilos.tituloSeccion}">📋 Sección 1: Registro de Datos</h4>
                    
                    <div class="${estilos.grupoInput}">
                        <label for="nombre">Nombres</label>
                        <input type="text" id="nombre" name="nombre" placeholder="Ingrese nombre" required>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="apellidos">Apellidos</label>
                        <input type="text" id="apellidos" name="apellidos" placeholder="Ingrese apellidos" required>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="dni">DNI</label>
                        <input type="number" id="dni" name="dni" required min="10000000" step="1" title="Ingresá un DNI válido con al menos 8 dígitos">
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="email">Ingrese email: </label>
                        <input type="email" name="email" id="email" placeholder="example@gmail.com">
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="telefono">Teléfono</label>
                        <input type="tel" id="telefono" placeholder="example: 1124584102" name="telefono">
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="direccion">Ingrese direccion: </label>
                        <input type="text" name="direccion" id="direccion" placeholder="Ingrese direccion" required>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="fechaNacimiento">Fecha Nacimiento</label>
                        <input type="date" id="fechaNacimiento" name="fechaNacimiento">
                    </div>
                    
                    <div class="${estilos.grupoInput}">
                        <label for="foto">Foto</label>
                        <div class="${estilos.fileInputWrapper}">
                            <input type="file" id="foto" name="foto" accept="image/*" class="${estilos.fileInput}">
                            <label for="foto" class="${estilos.fileInputLabel}">
                                <span class="${estilos.fileInputText}">Seleccionar archivo</span>
                                <span class="${estilos.fileInputIcon}">📁</span>
                            </label>
                        </div>
                        <input type="hidden" id="foto-actual" name="fotoActual" value="">
                        <img id="preview-foto" class="${estilos.previewFoto}" style="display:none;">
                    </div>
                </div>

                <!-- Sección 2: Membresía -->
                <div class="${estilos.seccionFormulario} ${estilos.seccionCompacta} campo-membresia" data-seccion="2" style="display: none;">
                    <h4 class="${estilos.tituloSeccion}">💳 Sección 2: Membresía</h4>
                    
                    <div class="${estilos.grupoInput}">
                        <label for="tipoDeMiembroId">Tipo de Miembro</label>
                        <select id="tipoDeMiembroId" name="tipoDeMiembroId" required>
                            <option value="">-- Seleccionar tipo de miembro --</option>
                        </select>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="membresiaId">Tipo de Membresía</label>
                        <select id="membresiaId" name="membresiaId" required>
                            <option value="">-- Seleccionar membresía --</option>
                        </select>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label>Fecha fin estimada</label>
                        <div id="fecha-fin-membresia" style="color:#fff; padding:6px; background:#222; border-radius:6px;">-</div>
                    </div>

                    <!-- Método de pago movido a la Sección 3 (Pago) -->

                    <div class="${estilos.grupoInput}">
                        <label for="fechaInicioMembresia">Fecha de Inicio de la Membresía</label>
                        <input type="date" id="fechaInicioMembresia" name="fechaInicioMembresia" required>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label>Costo de la Membresía</label>
                        <div id="costo-calculado" style="font-size: 1.2em; font-weight: bold; color: #ff6600; padding: 8px; background-color: #f5f5f5; border-radius: 4px;">
                            $0.00
                        </div>
                    </div>
                </div>

                <!-- Sección 3: Pago -->
                <div class="${estilos.seccionFormulario} ${estilos.seccionCompacta} campo-membresia" data-seccion="3" style="display: none;">
                    <h4 class="${estilos.tituloSeccion}">💸 Sección 3: Pago</h4>

                    <div class="${estilos.grupoInput}">
                        <label for="metodoPago">Método de pago</label>
                        <select id="metodoPago" name="metodoPago" required>
                            <option value="Efectivo">Efectivo</option>
                            <option value="QR">QR</option>
                        </select>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label>Resumen de monto a pagar</label>
                        <div id="costo-calculado-pago" style="font-size: 1.05em; font-weight: bold; color: #ff6600; padding: 6px; background-color: #f5f5f5; border-radius: 4px;">
                            $0.00
                        </div>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label>Fecha fin estimada</label>
                        <div id="fecha-fin-membresia-pago" style="color:#fff; padding:6px; background:#222; border-radius:6px;">-</div>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="notaPago">Observaciones (opcional)</label>
                        <input type="text" id="notaPago" name="notaPago" placeholder="Ej: Pago en efectivo en caja">
                    </div>
                </div>

                <div class="${estilos.modalAcciones}">
                    <button type="button" id="cancelar" class="${estilos.botonPagina} ${estilos.botonSecundario} modal-cerrar">Cancelar</button>
                    <button type="button" id="boton-anterior" class="${estilos.botonPagina} ${estilos.botonSecundario}" style="display: none;">Anterior</button>
                    <button type="button" id="boton-siguiente" class="${estilos.botonAgregar}">Siguiente</button>
                    <button type="submit" id="boton-guardar" class="${estilos.botonAgregar}" style="display: none;">Guardar</button>
                </div>
                </form>
            </div>
            </div>

        <div id="modal-asignar-entrenador" class="${estilos.modal}">
            <div class="${estilos.modalFondo} modal-cerrar"></div>
            <div class="${estilos.modalContenido} ${estilos.modalAsignar}">
                <div class="${estilos.modalCabecera}">
                    <h3>Asignar entrenador personal</h3>
                    <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
                </div>
                <div class="${estilos.modalAsignarBody}">
                    <div class="${estilos.asignarHeader}">
                        <input type="search" id="filtro-premium" class="${estilos.buscadorAsignar}" placeholder="Buscar miembro premium por nombre o DNI">
                        <p id="premium-resumen" class="${estilos.resumenPremium}">Cargando miembros premium...</p>
                    </div>
                    <p id="alerta-entrenadores" class="${estilos.textoAyuda}"></p>
                    <div class="${estilos.tablaWrapper}">
                        <table class="${estilos.tabla}">
                            <thead>
                                <tr>
                                    <th>Miembro</th>
                                    <th>Membresía</th>
                                    <th>Estado</th>
                                    <th>Entrenador actual</th>
                                    <th>Asignación</th>
                                </tr>
                            </thead>
                            <tbody id="lista-premium-cuerpo">
                                <tr><td colspan="5">Cargando miembros premium...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        ${PERMITE_ELIMINAR_MIEMBROS ? `
        <div id="modal-eliminar" class="${estilos.modal}">
            <div class="${estilos.modalFondo} modal-cerrar"></div>
            <div class="${estilos.modalContenido}" style="max-width: 400px;">
                <div class="${estilos.modalCabecera}">
                    <h3>Confirmar Eliminación</h3>
                    <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
                </div>
                <p>¿Estás seguro de que deseas eliminar a este miembro? Esta acción no se puede deshacer.</p>
                <div class="${estilos.modalAcciones}">
                    <button type="button" class="${estilos.botonPagina} ${estilos.botonSecundario} modal-cerrar">Cancelar</button>
                    <button id="boton-confirmar-eliminar" class="${estilos.botonEliminar}">Eliminar</button>
                    
                </div>
            </div>
        </div>
        ` : ''}
    `;
    
}

