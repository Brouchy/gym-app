const URL_BASE = import.meta.env.VITE_URL_BASE;

/**
 * Obtener TODOS los Usuarios
 */
export const apiObtenerUsuarios = async () => {
    const ENDPOINT = 'users';
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return []; 
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error en apiObtenerUsuarios:", error);
        return []; 
    }
}

/**
 * Obtener UN Usuario por ID
 */
export const apiObtenerUsuarioPorId = async (id) => {
    const ENDPOINT = `users/${id}`;
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        return await respuesta.json();
    } catch (error) {
        console.error(`Error en apiObtenerUsuarioPorId (id: ${id}):`, error);
        return null;
    }
}

/**
 * Crear un Usuario (POST)
 */
export const apiCrearUsuario = async (datosUsuario) => {
    const ENDPOINT = 'users';
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error en apiCrearUsuario:", error);
        return null;
    }
}

/**
 * Actualizar un Usuario (PUT)
 */
export const apiActualizarUsuario = async (id, datosUsuario) => {
    const ENDPOINT = `users/${id}`;
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error en apiActualizarUsuario:", error);
        return null;
    }
}

/**
 * Eliminar un Usuario (DELETE)
 */
export const apiEliminarUsuario = async (id) => {
    const ENDPOINT = `users/${id}`;
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
            method: 'DELETE'
        });
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return { exito: false };
        }
        return { exito: true }; 
    } catch (error) {
        console.error("Error en apiEliminarUsuario:", error);
        return { exito: false };
    }
}

/**
 * Obtener roles disponibles (para <select>)
 */
export const apiObtenerRoles = async () => {
    // Por ahora retornamos los roles definidos localmente
    // En el futuro esto podría venir del backend
    return [
        { id: 'admin', nombre: 'Administrador' },
        { id: 'recepcion', nombre: 'Recepcion' }
    ];
}

