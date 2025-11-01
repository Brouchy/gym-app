const URL_BASE = import.meta.env.VITE_URL_BASE;

const URL_BASE_MOCK = import.meta.env.VITE_URL_BASE_MOCK;


/**
 * Endpoint 2: Obtener TODOS los Miembros (con datos anidados)
 */
export const apiObtenerMiembros = async () => {
    const ENDPOINT = 'Miembros';
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return []; 
        }
        
        const data = await respuesta.json();
        const miembrosActivos = data.filter(miembro => miembro.eliminado === false);

        return miembrosActivos; 
    } catch (error) {
        console.error("Error en apiObtenerMiembros:", error);
        return []; 
    }
}

/**
 * Endpoint 3: Obtener UN Miembro por ID
 */
export const apiObtenerMiembroPorId = async (id) => {
    const ENDPOINT = `Miembros/${id}`;
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
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
    console.log("crear miembro",datosMiembro);
    const ENDPOINT = 'Miembros';
    
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
    console.log("actualizar miembro",id,datosMiembro);
    const ENDPOINT = `Miembros/${id}`;
    
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
    const ENDPOINT = `Miembros/${id}`;
    
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

//TODO: JSON-SERVER

/**
 * Endpoint 8: Obtener Tipos de Miembro (para <select>)
 */
export const apiObtenerTiposDeMiembro = async () => {
    try {
        const respuesta = await fetch(`${URL_BASE_MOCK}/tipoDeMiembros`); 
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        return await respuesta.json();
    } catch (error) { 
        console.error("Error en apiObtenerTiposDeMiembro:", error);
        return []; 
    }
}