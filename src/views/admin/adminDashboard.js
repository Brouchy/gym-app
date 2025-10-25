import { navegarAdmin } from '../../router/adminRouter';
import estilos from './AdminDashboard.module.css';


export const renderizarPanelAdmin = (contenedorApp) => { // Cambié 'contenedor' a 'contenedorApp' por claridad

    const divPanel = document.createElement('div');
    
    // --- CORRECCIÓN 1: Sintaxis de classList ---
    divPanel.classList.add(estilos.panelContenedor);

    // (Opcional: es mejor usar '=' que '+=' si el div está vacío)
    divPanel.innerHTML = ` 
        <nav id="adminMenu" class="${estilos.menuLateral}">
            <button data-modulo="miembros" class="${estilos.menuBoton} ${estilos.activo}">Miembros</button>
            <button data-modulo="membresias" class="${estilos.menuBoton}">Membresías</button>
            <button data-modulo="clases" class="${estilos.menuBoton}">Clases</button>
            <button data-modulo="actividades" class="${estilos.menuBoton}">Actividades</button>
            <button data-modulo="entrenadores" class="${estilos.menuBoton}">Entrenadores</button>
            <button data-modulo="asistencia" class="${estilos.menuBoton}">Asistencia</button>
            <button data-modulo="reportes" class="${estilos.menuBoton}">Reportes</button>
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
    menu.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button');
        if (!boton) return; 

        const modulo = boton.dataset.modulo;

        botones.forEach(b => b.classList.remove(estilos.activo));
        boton.classList.add(estilos.activo);

        navegarAdmin(modulo, contenido);
    });

    // Cargar el módulo por defecto (Miembros)
    navegarAdmin('miembros', contenido);

    // Finalmente, añadimos el panel (que ya tiene todo) al contenedor principal
    contenedorApp.appendChild(divPanel);
}