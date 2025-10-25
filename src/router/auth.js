
import {apiLogin} from '../api/apiLogin.js';
import { navegar } from './router';
const CLAVE_SESION = 'gymUser';




const guardarSesionUsuario = (usuario) => {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

export const obtenerSesionUsuario = () => {
    const usuario = sessionStorage.getItem(CLAVE_SESION);
    // Leemos de la sesión real
    return usuario ? JSON.parse(usuario) : null;
}

const limpiarSesionUsuario = () => {
    sessionStorage.removeItem(CLAVE_SESION);
}
// --- Funciones de Control (Usadas por las Vistas) ---
export const manejarLogin = async (email, password) => {
    const usuario = await apiLogin(email, password);
    
    if (usuario) {
        guardarSesionUsuario(usuario);
        // ¡Importante! Forzamos al router a re-evaluar la página
        // (Usamos el #app que ya sabemos que existe)
        navegar(document.getElementById('app')); 
        return true;
    }
    return false; // El login falló
}


export const manejarLogout = () => {
    console.log("paisho");
    limpiarSesionUsuario();
    // Forzamos al router a re-evaluar (esto nos mandará al login)
    navegar(document.getElementById('app'));
}