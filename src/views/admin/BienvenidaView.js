import estilos from './BienvenidaView.module.css';

/**
 * Renderiza la vista de bienvenida con un fondo y mensaje
 * @param {HTMLElement} contenedor - El contenedor donde se renderizará la vista
 */
export const renderizarVistaBienvenida = (contenedor) => {
    contenedor.innerHTML = `
        <div class="${estilos.contenedorBienvenida}">
            <div class="${estilos.contenidoBienvenida}">
                <h1 class="${estilos.titulo}">¡Bienvenido!</h1>
                <p class="${estilos.subtitulo}">Sistema de Gestión de Gimnasio</p>
            </div>
        </div>
    `;
}

