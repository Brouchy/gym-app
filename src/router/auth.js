// src/router/auth.js

const CLAVE_SESION = 'gymUser';

/**
 * Obtiene el usuario guardado desde sessionStorage.
 * Por ahora, lo "falseamos" para probar.
 */
export function obtenerSesionUsuario() {
    // ----------------------------------------------------
    // --- ¡MODIFICA ESTA LÍNEA PARA PROBAR! ---
    // ----------------------------------------------------
    
    // Prueba 1: Devuelve 'null' para ver la vista de Login
    // return null; 
    
    // Prueba 2: Descomenta esto para simular ser Admin
    //return { role: 'admin', nombre: 'Admin' };
    
    // Prueba 3: Descomenta esto para simular ser Trainer
    // return { role: 'trainer', nombre: 'Juan' };

    // ----------------------------------------------------

    // El código real (que usaremos después) sería:
    // const usuario = sessionStorage.getItem(CLAVE_SESION);
    // return usuario ? JSON.parse(usuario) : null;
}