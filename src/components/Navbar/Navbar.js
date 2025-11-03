import { manejarLogout, obtenerSesionUsuario } from "../../router/auth";
import estilos from './Navbar.module.css';

export const renderizarBarraNavegacion = (contenedorApp) => {
    const usuario = obtenerSesionUsuario();
    
    const nav = document.createElement('nav');
    nav.className = estilos.navbar;
    
    if (usuario) {
        // Si el usuario está logueado
        nav.innerHTML = `
            <h1>Sistema Cuerpo Sano</h1>
            <div class="${estilos.infoUsuario}">
                <span>Bienvenido, ${usuario.nombre}</span>
                <button id="logout-button" class="${estilos.botonLogout}">Cerrar Sesión</button>
            </div>
        `;
    } else {
        // Si no está logueado (en la vista de Login)
        nav.innerHTML = `<h1>Sistema Cuerpo Sano</h1>`;
    }
    
    // Lo insertamos al principio del contenedor de la app
    contenedorApp.prepend(nav);

    // Añadimos listener al botón de logout (solo si existe)
    const botonLogout = nav.querySelector('#logout-button');
    if (botonLogout) {
        botonLogout.addEventListener('click',manejarLogout);
    }
}