import { navegarRecepcion } from '../../router/recepcionRouter';
import estilos from '../admin/AdminDashboard.module.css';

export const renderizarPanelRecepcion = (contenedorApp, usuario) => {
    const panel = document.createElement('div');
    panel.classList.add(estilos.panelContenedor);

    panel.innerHTML = `
        <nav id="recepcionMenu" class="${estilos.menuLateral}">
            <button data-modulo="inicio" class="${estilos.menuBoton} ${estilos.activo}">Inicio</button>
            <button data-modulo="miembros" class="${estilos.menuBoton}">Miembros</button>
            <button data-modulo="asistencia" class="${estilos.menuBoton}">Asistencia</button>
            <button data-modulo="clases" class="${estilos.menuBoton}">Clases</button>
        </nav>
        <div id="recepcion-contenido" class="${estilos.contenidoPrincipal}"></div>
    `;

    const menu = panel.querySelector('#recepcionMenu');
    const contenido = panel.querySelector('#recepcion-contenido');
    const botones = menu.querySelectorAll(`.${estilos.menuBoton}`);

    menu.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('button');
        if (!boton) return;

        const modulo = boton.dataset.modulo;
        botones.forEach(b => b.classList.remove(estilos.activo));
        boton.classList.add(estilos.activo);

        await navegarRecepcion(modulo, contenido);
    });

    navegarRecepcion('inicio', contenido).catch(err => {
        console.error('Error al cargar el módulo inicial de recepción:', err);
    });

    contenedorApp.appendChild(panel);
};

