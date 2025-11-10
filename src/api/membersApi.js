const URL_BASE = import.meta.env.VITE_URL_BASE;

/**
 * Endpoint 2: Obtener TODOS los Miembros (con datos anidados)
 */
export const apiObtenerMiembros = async () => {
    const ENDPOINT = 'miembros?_expand=entrenador&_expand=tipoDeMiembro';
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return []; 
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error en apiObtenerMiembros:", error);
        return []; 
    }
}

/**
 * Endpoint 3: Obtener UN Miembro por ID
 */
export const apiObtenerMiembroPorId = async (id) => {
    const ENDPOINT = `miembros/${id}?_expand=entrenador&_expand=tipoDeMiembro`;
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        return await respuesta.json();
    } catch (error) {
        console.error(`Error en apiObtenerMiembroPorId (id: ${id}):`, error);
        return null;
    }
}

/**
 * Endpoint 4: Crear un Miembro (POST)
 * (Usa la estructura de datos que necesita tu backend real)
 */
export const apiCrearMiembro = async (datosMiembro) => {
    const ENDPOINT = 'miembros';
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosMiembro)
        });
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error en apiCrearMiembro:", error);
        return null;
    }
}

/**
 * Endpoint 5: Actualizar un Miembro (PUT)
 */
export const apiActualizarMiembro = async (id, datosMiembro) => {
    const ENDPOINT = `miembros/${id}`;
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosMiembro)
        });
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error en apiActualizarMiembro:", error);
        return null;
    }
}

/**
 * Endpoint 6: Eliminar un Miembro (DELETE)
 */
export const apiEliminarMiembro = async (id) => {
    console.log("elimar miembro",id);
    const ENDPOINT = `miembros/${id}`;
    
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
        console.error("Error en apiEliminarMiembro:", error);
        return { exito: false };
    }
}



/**
 * Endpoint 8: Obtener Tipos de Miembro (para <select>)
 */
export const apiObtenerTiposDeMiembro = async () => {
    try {
        const respuesta = await fetch(`${URL_BASE}/tipoDeMiembros`); 
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        return await respuesta.json();
    } catch (error) { 
        console.error("Error en apiObtenerTiposDeMiembro:", error);
        return []; 
    }
}

// Crear un Tipo de Miembro
export const apiCrearTipoDeMiembro = async (nuevo) => {
    try {
        const res = await fetch(`${URL_BASE}/tipoDeMiembros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevo)
        });
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error en apiCrearTipoDeMiembro:', error);
        return null;
    }
};

// Actualizar un Tipo de Miembro
export const apiActualizarTipoDeMiembro = async (id, cambios) => {
    try {
        const res = await fetch(`${URL_BASE}/tipoDeMiembros/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cambios)
        });
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error en apiActualizarTipoDeMiembro:', error);
        return null;
    }
};

// Eliminar un Tipo de Miembro
export const apiEliminarTipoDeMiembro = async (id) => {
    try {
        const res = await fetch(`${URL_BASE}/tipoDeMiembros/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        return { exito: true };
    } catch (error) {
        console.error('Error en apiEliminarTipoDeMiembro:', error);
        return { exito: false };
    }
};