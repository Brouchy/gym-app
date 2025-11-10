import estilos from './InicioView.module.css';

export const renderizarVistaInicioRecepcion = (contenedor) => {
    contenedor.innerHTML = `
        <div class="${estilos.contenedorBienvenida}">
            <div class="${estilos.contenidoBienvenida}">
                <h1 class="${estilos.titulo}">¡Bienvenido!</h1>
                <p class="${estilos.subtitulo}">Sistema de Gestión de Gimnasio</p>
            </div>
        </div>
    `;
}
