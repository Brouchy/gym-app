import { navegarAdmin } from '../../router/adminRouter';
import estilos from './AdminDashboard.module.css';


export const renderizarPanelAdmin = (contenedorApp) => { // Cambié 'contenedor' a 'contenedorApp' por claridad

    const divPanel = document.createElement('div');
    
    // --- CORRECCIÓN 1: Sintaxis de classList ---
    divPanel.classList.add(estilos.panelContenedor);

    // (Opcional: es mejor usar '=' que '+=' si el div está vacío)
    divPanel.innerHTML = ` 
        <nav id="adminMenu" class="${estilos.menuLateral}">
            <button data-modulo="inicio" class="${estilos.menuBoton} ${estilos.activo}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3z"/></svg>
                <span>Inicio</span>
            </button>
            <button data-modulo="miembros" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"/></svg>
                <span>Socios</span>
            </button>
            <button data-modulo="membresias" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M17 3H7a2 2 0 0 0-2 2v14l7-3 7 3V5a2 2 0 0 0-2-2z"/></svg>
                <span>Membresías</span>
            </button>
            <button data-modulo="clases" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M20 6H4v2h16V6zm0 5H4v2h16v-2zm0 5H4v2h16v-2z"/></svg>
                <span>Clases</span>
            </button>
            <button data-modulo="actividades" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M13 2H6a2 2 0 0 0-2 2v7h2V4h7V2zm5 4h-6a2 2 0 0 0-2 2v12l5-3 5 3V8a2 2 0 0 0-2-2z"/></svg>
                <span>Actividades</span>
            </button>
            <button data-modulo="entrenadores" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M12 6a3 3 0 110-6 3 3 0 010 6zm-9 7a5 5 0 0110 0v5H3v-5zm12 0h8v2h-8v-2zm0 4h6v2h-6v-2z"/></svg>
                <span>Entrenadores</span>
            </button>
            <button data-modulo="asistencia" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M19 3H5a2 2 0 00-2 2v14l4-4h12a2 2 0 002-2V5a2 2 0 00-2-2z"/></svg>
                <span>Asistencia</span>
            </button>
            <button data-modulo="reportes" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M3 13h2v-2H3v2zm4 0h2V7H7v6zm4 0h2V3h-2v10zm4 0h2V9h-2v4zm4 6H3v-2h18v2z"/></svg>
                <span>Reportes</span>
            </button>
            <button data-modulo="usuarios" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M16 11c1.7 0 3-1.3 3-3S17.7 5 16 5s-3 1.3-3 3 1.3 3 3 3zM8 11c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.7 0-8 1.3-8 4v3h10v-3c0-1.6.7-2.9 1.8-3.9C10.9 12.4 9.5 13 8 13zm8 0c-.5 0-1 .1-1.5.2 1.3.9 2.5 2.2 2.5 3.8v3h7v-3c0-2.7-5.3-4-8-4z"/></svg>
                <span>Usuarios</span>
            </button>
            <button data-modulo="configuraciones" class="${estilos.menuBoton}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px"><path d="M19.14 12.94a7.002 7.002 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.027 7.027 0 00-1.63-.95l-.36-2.54A.5.5 0 0012.89 2h-3.78a.5.5 0 00-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.95l-2.39-.96a.5.5 0 00-.6.22L1.33 8.05a.5.5 0 00.12.64l2.03 1.58c-.05.31-.08.63-.08.95s.03.64.08.95l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.14.24.43.34.69.22l2.39-.96c.5.41 1.05.74 1.63.95l.36 2.54c.05.25.25.42.49.42h3.78c.24 0 .44-.17.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.95l2.39.96c.26.12.55.02.69-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM11 16a4 4 0 110-8 4 4 0 010 8z"/></svg>
                <span>Configuraciones</span>
            </button>
        </nav>

        <div id="admin-contenido" class="${estilos.contenidoPrincipal}">
            </div>
    `;

    // --- CORRECCIÓN 2: Lógica del DOM ---
    // Buscamos los IDs DENTRO de divPanel, no en 'document'
    const menu = divPanel.querySelector('#adminMenu');
    const contenido = divPanel.querySelector('#admin-contenido');
    // --- FIN CORRECCIÓN 2 ---
    
    // (Esta línea ahora funciona porque 'menu' no es null)
    const botones = menu.querySelectorAll(`.${estilos.menuBoton}`);

    // Usamos delegación de eventos en el menú
    menu.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('button');
        if (!boton) return; 

        const modulo = boton.dataset.modulo;

        botones.forEach(b => b.classList.remove(estilos.activo));
        boton.classList.add(estilos.activo);

        await navegarAdmin(modulo, contenido);
    });

    // Cargar el módulo por defecto (Inicio/Bienvenida)
    navegarAdmin('inicio', contenido).catch(error => {
        console.error('Error al cargar el módulo inicial:', error);
    });

    // Finalmente, añadimos el panel (que ya tiene todo) al contenedor principal
    contenedorApp.appendChild(divPanel);
}