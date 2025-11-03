import {
    apiObtenerMiembros,
    apiObtenerMiembroPorId,
    apiCrearMiembro,
    apiActualizarMiembro,
    apiEliminarMiembro,
    apiObtenerTiposDeMiembro
} from "../../api/membersApi";
import { apiObtenerEntrenadores } from '../../api/trainersApi.js';
import { imprimirCredencial } from "../../utils/imprimirCredencial.js";
import { subirImagenAImgbb } from "../../utils/subirImagen.js";
import estilos from './MiembrosView.module.css';
import { renderizarWizardAgregarMiembro } from "./WizardAgregarMiembro/WizardAgregarMiembro.js";


// --- Estado del Módulo (variables que guardan la información) ---
let listaMiembros = [];       // Cache de todos los miembros
let listaEntrenadores = [];   // Cache para el <select>
let listaTiposMiembro = []; // Cache para el <select>
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;
let modoFormulario = 'crear';
let guardandoMiembro = false;

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
        apiObtenerTiposDeMiembro()
    ]).then(([entrenadores, tipos]) => {
        listaEntrenadores = entrenadores;
        listaTiposMiembro = tipos;
    });

    // 4. Cargamos los datos de los miembros y los mostramos
    await cargarYMostrarMiembros();
    // const membresiasXMiembros = await apiObtenerMembresiasXMiembros();
    // console.log('Membresias por Miembros:', membresiasXMiembros);
}

/**
 * Carga los miembros desde la API y actualiza la vista
 */
const cargarYMostrarMiembros = async () => {
    // Mostramos un 'cargando' en la tabla
    const cuerpoTabla = contenedorVista.querySelector('#miembros-cuerpo-tabla');
    if (cuerpoTabla) cuerpoTabla.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

    listaMiembros = await apiObtenerMiembros();
    mostrarContenido();
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
    const terminoBusqueda = contenedorVista.querySelector('#buscador').value.toLowerCase();
    const miembrosFiltrados = listaMiembros.filter(miembro => 
        miembro.nombre.toLowerCase().includes(terminoBusqueda) ||
        miembro.email.toLowerCase().includes(terminoBusqueda) ||
        String(miembro.id).includes(terminoBusqueda) ||
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
    const TOTAL_COLUMNAS = 11;

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
            // Combinar entrenador y certificación
            const entrenadorInfo = miembro.entrenador
                ? `${miembro.entrenador.nombre} (${miembro.entrenador.certificacion || 'N/A'})`
                : 'N/A';

            fila.innerHTML = `
                <td>${miembro.id}</td>
                <td>${miembro.nombre}</td>
                <td>${miembro.dni || 'N/A'}</td>
                <td>${miembro.direccion || 'N/A'}</td>
                <td>${miembro.telefono || 'N/A'}</td>
                <td>${fechaNac}</td>
                <td>${miembro.email}</td>
                <td><img src="${fotoUrl}" alt="${miembro.nombre}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                <td>${miembro.tipoDeMiembro?.descripcion || 'N/A'}</td>
                <td>${entrenadorInfo}</td>
                <td class="${estilos.acciones}">
                    <button class="${estilos.botonEditar}" data-id="${miembro.id}" title="Editar">Editar</button>
                    <button class="${estilos.botonEliminar}" data-id="${miembro.id}" title="Eliminar">Eliminar</button>
                    <button class="${estilos.botonImprimir}" data-id="${miembro.id}" title="Imprimir">Imprimir</button>
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

/**
 * Conecta todos los listeners de la vista (solo se llama una vez)
 */
const adjuntarEventListeners = () => {
    // Usamos delegación de eventos en el contenedor de la vista
    contenedorVista.addEventListener('click', async (e) => {
        if (e.target.matches('#boton-confirmar-eliminar')) {
            const { id } = e.target.dataset;
            if (id) {
                await manejarConfirmarEliminar(id);
            }
            return;
        }

        // --- Botones de la Tabla ---
        if (e.target.matches(`.${estilos.botonEditar}`)) {
            abrirModalEditar(e.target.dataset.id);
            return;
        }
        if (e.target.matches(`.${estilos.botonEliminar}`)) {
            abrirModalEliminar(e.target.dataset.id);
            return;
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
        if (e.target.matches(`.${estilos.botonImprimir}`)) {
            const id = e.target.dataset.id;
            const miembro = listaMiembros.find(m => m.id === Number(id));
            imprimirCredencial(miembro);
        }
    });

    const inputFoto = contenedorVista.querySelector('#foto');
    const previewFoto = contenedorVista.querySelector('#preview-foto');

    if (inputFoto && previewFoto) {
        inputFoto.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file) {
                previewFoto.src = URL.createObjectURL(file);
                previewFoto.style.display = 'block';
            } else {
                previewFoto.removeAttribute('src');
                previewFoto.style.display = 'none';
            }
        });
    }

    // --- Buscador (evento 'input') ---
    contenedorVista.querySelector('#buscador').addEventListener('input', () => {
        paginaActual = 1; // Resetear a pág 1 al buscar
        mostrarContenido();
    });
    
    // --- Formulario (evento 'submit') ---
    contenedorVista.querySelector('#modal-formulario-miembro').addEventListener('submit', manejarSubmitFormulario);
}

// --- Lógica de Modales ---

const abrirModalAgregar = () => {
    modoFormulario = 'crear';

    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    form.reset();
    form.querySelector('#miembro-id').value = '';
    form.querySelector('#foto-actual').value = '';
    const preview = form.querySelector('#preview-foto');
    if (preview) {
        preview.removeAttribute('src');
        preview.style.display = 'none';
    }

    contenedorVista.querySelector('#modal-titulo').textContent = 'Agregar Nuevo Miembro';
    contenedorVista.querySelector('#modal-miembro').classList.add(estilos.activo);
};
const abrirModalEditar = async (id) => {
    modoFormulario = 'editar';

    const miembro = await apiObtenerMiembroPorId(id);
    if (!miembro) {
        alert("Error: No se pudo encontrar al miembro.");
        return;
    }

    const form = contenedorVista.querySelector('#modal-formulario-miembro');
    form.querySelector('#miembro-id').value = miembro.id;
    form.querySelector('#nombre').value = miembro.nombre;
    form.querySelector('#email').value = miembro.email;
    form.querySelector('#dni').value = miembro.dni;
    form.querySelector('#telefono').value = miembro.telefono;
    form.querySelector('#direccion').value = miembro.direccion;
    form.querySelector('#fechaNacimiento').value = miembro.fechaNacimiento ? miembro.fechaNacimiento.split('T')[0] : '';
    form.querySelector('#foto-actual').value = miembro.foto || '';
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

    contenedorVista.querySelector('#modal-titulo').textContent = 'Editar Miembro';
    contenedorVista.querySelector('#modal-miembro').classList.add(estilos.activo);
};

const abrirModalEliminar = (id) => {
    contenedorVista.querySelector('#boton-confirmar-eliminar').dataset.id = id;
    contenedorVista.querySelector('#modal-eliminar').classList.add(estilos.activo);
}

const cerrarModales = () => {
    contenedorVista.querySelector('#modal-miembro').classList.remove(estilos.activo);
    contenedorVista.querySelector('#modal-eliminar').classList.remove(estilos.activo);
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

  const datosMiembro = {
    nombre: form.querySelector('#nombre').value,
    email: form.querySelector('#email').value,
    dni: form.querySelector('#dni').value,
    telefono: form.querySelector('#telefono').value,
    direccion: form.querySelector('#direccion').value,
    fechaNacimiento: form.querySelector('#fechaNacimiento').value,
    foto: urlFoto || "",
    tipoDeMiembroId: 0,
    entrenadorId: 0,
    eliminado: false
  };

  // Si estamos editando, todo sigue igual
  if (modoFormulario === 'editar' && id) {
    await apiActualizarMiembro(id, datosMiembro);
    cerrarModales();
    await cargarYMostrarMiembros();
    return;
  }

  // Si estamos creando un nuevo miembro, abrimos el wizard
  const miembroCreado = await apiCrearMiembro(datosMiembro);
cerrarModales();

// Mostrar wizard solo si se creó correctamente
if (miembroCreado) {
  renderizarWizardAgregarMiembro(contenedorVista, miembroCreado, async () => {
    //  Callback al cerrar wizard (éxito o cancelación)
    await cargarYMostrarMiembros();
  });
} else {
  await cargarYMostrarMiembros();
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
        <div class="${estilos.contenedor}"
        <div class="tituloModulo">
            <h2>🧑‍🤝‍🧑 Módulo de Gestión de Miembros</h2>
        </div>
            <div class="${estilos.cabecera}">
                <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar por ID, DNI, nombre, email...">
                <button id="boton-agregar-miembro" class="${estilos.botonAgregar}">
                    + Agregar Miembro
                </button>
            </div>

            <div class="${estilos.tablaWrapper}">
                <table class="${estilos.tabla}">
                    <thead>
                       <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>DNI</th>
                            <th>Dirección</th>
                            <th>Teléfono</th>
                            <th>F. Nac.</th>
                            <th>Email</th>
                             <th>Foto</th>
                            <th>Tipo</th>
                            <th>Entrenador a cargo</th> 
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

       <div id="modal-miembro" class="${estilos.modal}">
            <div class="${estilos.modalFondo} modal-cerrar"></div>
            <div class="${estilos.modalContenido}">
                <div class="${estilos.modalCabecera}">
                <h3 id="modal-titulo">Agregar Miembro</h3>
                <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
                </div>
                
                <form id="modal-formulario-miembro" class="${estilos.formularioModal}">
                <input type="hidden" id="miembro-id">

                <div class="${estilos.grupoInput}">
                    <label for="nombre">Nombres Completos</label>
                    <input type="text" id="nombre" name="nombre" placeholder="Ingrese nombres" required>
                </div>

                <div class="${estilos.grupoInput}">
                    <label for="dni">DNI</label>
                    <input type="number" id="dni" name="dni" required min="10000000" step="1" title="Ingresá un DNI válido con al menos 8 dígitos">
                </div>

                <div class="${estilos.grupoInput}">
                    <label for="email">Ingrese email: </label>
                    <input type="email" name="email" id="email" placeholder="example@gmail.com" 
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
                <input type="file" id="foto" name="foto" accept="image/*">
                <input type="hidden" id="foto-actual" name="fotoActual" value="">
                <img id="preview-foto" style="width:60px;height:60px;border-radius:50%;margin-top:5px;display:none;">
                </div>

                <div class="${estilos.modalAcciones}">
                    <button type="button" class="${estilos.botonPagina} ${estilos.botonSecundario} modal-cerrar">Cancelar</button>
                    <button type="submit" class="${estilos.botonAgregar}">Guardar</button>
                </div>
                </form>
            </div>
            </div>

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
    `;
}
