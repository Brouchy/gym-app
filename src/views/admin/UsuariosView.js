    import {
    apiObtenerUsuarios,
    apiObtenerUsuarioPorId,
    apiCrearUsuario,
    apiActualizarUsuario,
    apiEliminarUsuario,
    apiObtenerRoles
} from "../../api/usersApi";
import estilos from './UsuariosView.module.css';

// --- Estado del Módulo ---
let listaUsuarios = [];
let listaRoles = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 5;
let modoFormulario = 'crear';
let guardandoUsuario = false;

// --- Contenedor Principal ---
let contenedorVista;

/**
 * Función principal que renderiza la vista
 */
export const renderizarVistaUsuarios = async (contenedor) => {
    try {
        contenedorVista = contenedor;
        
        // 1. Renderizamos el "esqueleto"
        renderizarEsqueleto();
        
        // 2. Conectamos los listeners
        adjuntarEventListeners();
        
        // 3. Cargamos los roles disponibles
        listaRoles = await apiObtenerRoles();
        
        // 4. Cargamos los datos de los usuarios y los mostramos
        await cargarYMostrarUsuarios();
    } catch (error) {
        console.error('Error en renderizarVistaUsuarios:', error);
        if (contenedor) {
            contenedor.innerHTML = `
                <div style="padding: 2rem; color: #e53e3e;">
                    <h3>Error al cargar la vista de usuarios</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Carga los usuarios desde la API y actualiza la vista
 */
const cargarYMostrarUsuarios = async () => {
    const cuerpoTabla = contenedorVista.querySelector('#usuarios-cuerpo-tabla');
    if (cuerpoTabla) cuerpoTabla.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

    listaUsuarios = await apiObtenerUsuarios();
    mostrarContenido();
}

/**
 * Filtra, pagina y muestra los datos en la tabla
 */
const mostrarContenido = () => {
    const cuerpoTabla = contenedorVista.querySelector('#usuarios-cuerpo-tabla');
    const indicadorPagina = contenedorVista.querySelector('#indicador-pagina');
    const botonPrev = contenedorVista.querySelector('#boton-prev');
    const botonNext = contenedorVista.querySelector('#boton-next');
    
    if (!cuerpoTabla) return;

    // 1. Filtrar (según el buscador)
    const terminoBusqueda = contenedorVista.querySelector('#buscador').value.toLowerCase();
    const usuariosFiltrados = listaUsuarios.filter(usuario => 
        usuario.nombre?.toLowerCase().includes(terminoBusqueda) ||
        usuario.email?.toLowerCase().includes(terminoBusqueda) ||
        String(usuario.id).includes(terminoBusqueda) ||
        usuario.role?.toLowerCase().includes(terminoBusqueda)
    );

    // 2. Paginar
    const totalPaginas = Math.ceil(usuariosFiltrados.length / FILAS_POR_PAGINA);
    paginaActual = Math.max(1, Math.min(paginaActual, totalPaginas)); 
    const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
    const fin = inicio + FILAS_POR_PAGINA;
    const usuariosPaginados = usuariosFiltrados.slice(inicio, fin);

    // 3. Renderizar Tabla
    cuerpoTabla.innerHTML = '';
    const TOTAL_COLUMNAS = 6;

    if (usuariosPaginados.length === 0) {
        cuerpoTabla.innerHTML = `<tr><td colspan="${TOTAL_COLUMNAS}">No se encontraron usuarios.</td></tr>`;
    } else {
        usuariosPaginados.forEach(usuario => {
            const fila = document.createElement('tr');
            
            // Mapear el role a nombre legible
            const nombreRole = usuario.role === 'admin' ? 'Administrador' : 
                              usuario.role === 'recepcion' ? 'Recepcion' : 
                              usuario.role || 'N/A';

            fila.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.nombre || 'N/A'}</td>
                <td>${usuario.email || 'N/A'}</td>
                <td>${nombreRole}</td>
                <td class="${estilos.acciones}">
                    <button class="${estilos.botonEditar}" data-id="${usuario.id}" title="Editar">Editar</button>
                    <button class="${estilos.botonEliminar}" data-id="${usuario.id}" title="Eliminar">Eliminar</button>
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
 * Conecta todos los listeners de la vista
 */
const adjuntarEventListeners = () => {
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
        if (e.target.matches('#boton-agregar-usuario')) {
            abrirModalAgregar();
            return;
        }
        if (e.target.matches(`.${estilos.modalCerrar}`) || e.target.matches(`.${estilos.modalFondo}`)) {
            cerrarModales();
        }
    });

    // --- Buscador ---
    contenedorVista.querySelector('#buscador').addEventListener('input', () => {
        paginaActual = 1;
        mostrarContenido();
    });
    
    // --- Formulario ---
    contenedorVista.querySelector('#modal-formulario-usuario').addEventListener('submit', manejarSubmitFormulario);
}

// --- Lógica de Modales ---

const abrirModalAgregar = () => {
    modoFormulario = 'crear';
    const form = contenedorVista.querySelector('#modal-formulario-usuario');
    form.reset();
    form.querySelector('#usuario-id').value = '';

    // Configurar el campo password para crear
    const passwordInput = form.querySelector('#password');
    passwordInput.required = true;
    passwordInput.placeholder = 'Ingrese contraseña';
    const passwordHint = form.querySelector('#password-hint');
    if (passwordHint) passwordHint.textContent = 'La contraseña es obligatoria';

    // Llenar el select de roles
    const selectRole = form.querySelector('#role');
    selectRole.innerHTML = '<option value="">Seleccione un rol</option>';
    listaRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.nombre;
        selectRole.appendChild(option);
    });

    contenedorVista.querySelector('#modal-titulo').textContent = 'Agregar Nuevo Usuario';
    contenedorVista.querySelector('#modal-usuario').classList.add(estilos.activo);
};

const abrirModalEditar = async (id) => {
    modoFormulario = 'editar';

    const usuario = await apiObtenerUsuarioPorId(id);
    if (!usuario) {
        alert("Error: No se pudo encontrar al usuario.");
        return;
    }

    const form = contenedorVista.querySelector('#modal-formulario-usuario');
    form.querySelector('#usuario-id').value = usuario.id;
    form.querySelector('#nombre').value = usuario.nombre || '';
    form.querySelector('#email').value = usuario.email || '';
    
    // Configurar el campo password para editar
    const passwordInput = form.querySelector('#password');
    passwordInput.value = ''; // No mostramos la contraseña por seguridad
    passwordInput.required = false;
    passwordInput.placeholder = 'Dejar vacío para mantener la actual';
    const passwordHint = form.querySelector('#password-hint');
    if (passwordHint) passwordHint.textContent = 'Dejar vacío para mantener la contraseña actual';
    
    // Llenar el select de roles y seleccionar el actual
    const selectRole = form.querySelector('#role');
    selectRole.innerHTML = '<option value="">Seleccione un rol</option>';
    listaRoles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.nombre;
        if (role.id === usuario.role) {
            option.selected = true;
        }
        selectRole.appendChild(option);
    });

    contenedorVista.querySelector('#modal-titulo').textContent = 'Editar Usuario';
    contenedorVista.querySelector('#modal-usuario').classList.add(estilos.activo);
};

const abrirModalEliminar = (id) => {
    contenedorVista.querySelector('#boton-confirmar-eliminar').dataset.id = id;
    contenedorVista.querySelector('#modal-eliminar').classList.add(estilos.activo);
}

const cerrarModales = () => {
    contenedorVista.querySelector('#modal-usuario').classList.remove(estilos.activo);
    contenedorVista.querySelector('#modal-eliminar').classList.remove(estilos.activo);
    const form = contenedorVista.querySelector('#modal-formulario-usuario');
    if (form) {
        form.reset();
    }
}

// --- Lógica de Formularios ---

const manejarSubmitFormulario = async (e) => {
    e.preventDefault();
    const form = e.target;
    if (guardandoUsuario) return;
    guardandoUsuario = true;

    const botonSubmit = form.querySelector('button[type="submit"]');
    const textoOriginalBoton = botonSubmit ? botonSubmit.textContent : '';
    if (botonSubmit) {
        botonSubmit.disabled = true;
        botonSubmit.textContent = 'Guardando...';
    }

    const id = form.querySelector('#usuario-id').value;
    const password = form.querySelector('#password').value;

    const datosUsuario = {
        nombre: form.querySelector('#nombre').value,
        email: form.querySelector('#email').value,
        role: form.querySelector('#role').value,
    };

    // Solo incluir password si se está creando o si se proporcionó uno nuevo al editar
    if (modoFormulario === 'crear') {
        if (!password) {
            alert("La contraseña es obligatoria para nuevos usuarios.");
            guardandoUsuario = false;
            if (botonSubmit) {
                botonSubmit.disabled = false;
                botonSubmit.textContent = textoOriginalBoton;
            }
            return;
        }
        datosUsuario.password = password;
    } else if (modoFormulario === 'editar' && password) {
        // Solo actualizar password si se proporcionó uno nuevo
        datosUsuario.password = password;
    }

    // Si estamos editando
    if (modoFormulario === 'editar' && id) {
        await apiActualizarUsuario(id, datosUsuario);
        cerrarModales();
        await cargarYMostrarUsuarios();
    } else {
        // Si estamos creando un nuevo usuario
        await apiCrearUsuario(datosUsuario);
        cerrarModales();
        await cargarYMostrarUsuarios();
    }

    guardandoUsuario = false;
    if (botonSubmit) {
        botonSubmit.disabled = false;
        botonSubmit.textContent = textoOriginalBoton;
    }
};

const manejarConfirmarEliminar = async (id) => {
    const usuarioId = Number(id);
    if (Number.isNaN(usuarioId)) {
        console.warn('ID de usuario inválido para eliminar:', id);
        return;
    }

    await apiEliminarUsuario(usuarioId);
    cerrarModales();
    await cargarYMostrarUsuarios();
}

/**
 * Renderiza el HTML "esqueleto"
 */
const renderizarEsqueleto = () => {
    contenedorVista.innerHTML = `
        <div class="${estilos.contenedor}">
            <div class="${estilos.tituloModulo}">
                <h2>Módulo de Gestión de Usuarios</h2>
            </div>
            <div class="${estilos.tituloModulo}">
                <div class="${estilos.tabs}">
                    <button id="tab-gestion" class="${estilos.tab} ${estilos.activa}">Gestión de Usuarios</button>
                </div>
                <div id="zona-dinamica">
                    <div class="${estilos.cabecera}">
                        <input type="search" id="buscador" class="${estilos.buscador}" placeholder="Buscar por ID, nombre, email, rol...">
                        <button id="boton-agregar-usuario" class="${estilos.botonAgregar}">
                            + Agregar Usuario
                        </button>
                    </div>

                    <div class="${estilos.tablaWrapper}">
                        <table class="${estilos.tabla}">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="usuarios-cuerpo-tabla">
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

        <div id="modal-usuario" class="${estilos.modal}">
            <div class="${estilos.modalFondo} modal-cerrar"></div>
            <div class="${estilos.modalContenido}">
                <div class="${estilos.modalCabecera}">
                    <h3 id="modal-titulo">Agregar Usuario</h3>
                    <span class="${estilos.modalCerrar} modal-cerrar">&times;</span>
                </div>
                
                <form id="modal-formulario-usuario" class="${estilos.formularioModal}">
                    <input type="hidden" id="usuario-id">

                    <div class="${estilos.grupoInput}">
                        <label for="nombre">Nombre Completo</label>
                        <input type="text" id="nombre" name="nombre" placeholder="Ingrese nombre completo" required>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="example@gmail.com" required>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" placeholder="Ingrese contraseña" required>
                        <small id="password-hint" style="color: #888; font-size: 0.85rem; margin-top: 0.25rem;">La contraseña es obligatoria</small>
                    </div>

                    <div class="${estilos.grupoInput}">
                        <label for="role">Rol</label>
                        <select id="role" name="role" required>
                            <option value="">Seleccione un rol</option>
                        </select>
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
                <p>¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.</p>
                <div class="${estilos.modalAcciones}">
                    <button type="button" class="${estilos.botonPagina} ${estilos.botonSecundario} modal-cerrar">Cancelar</button>
                    <button id="boton-confirmar-eliminar" class="${estilos.botonEliminar}">Eliminar</button>
                </div>
            </div>
        </div>
    `;
}

