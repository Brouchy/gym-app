import { navegarAdmin } from '../../router/adminRouter';
import estilos from './AdminDashboard.module.css';


export const renderizarPanelAdmin=(contenedor)=>
{
   // 3. Renderizamos el layout (menú + div de contenido)
    // Usamos 'data-modulo' para saber qué botón se apretó
    contenedor.innerHTML = `
        <div class="${estilos.panelContenedor}">
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
        </div>
    `;

    // 4. Lógica de navegación interna
    const menu = document.getElementById('adminMenu');
    const contenido = document.getElementById('admin-contenido');
    const botones = menu.querySelectorAll(`.${estilos.menuBoton}`);

    // Usamos delegación de eventos en el menú
    menu.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button');
        if (!boton) return; // Se hizo clic fuera de un botón

        // Obtenemos el módulo (ej. "miembros")
        const modulo = boton.dataset.modulo;

        // Actualizamos la clase 'activa'
        botones.forEach(b => b.classList.remove(estilos.activo));
        boton.classList.add(estilos.activo);

        // 5. Llamamos al sub-router para que cargue el módulo
        navegarAdmin(modulo, contenido);
    });

    // 6. Cargar el módulo por defecto (Miembros)
    navegarAdmin('miembros', contenido);

}