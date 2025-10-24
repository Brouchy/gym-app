const URL_BASE = import.meta.env.VITE_URL_BASE;


// --- Endpoints Auxiliares (para los <select> del formulario) ---

/**
 * Endpoint 7: Obtener Entrenadores (para <select>)
 */
export const apiObtenerEntrenadores = async () => {
    try {
        const respuesta = await fetch(`${URL_BASE}/entrenadors`);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        return await respuesta.json();
    } catch (error) { 
        console.error("Error en apiObtenerEntrenadores:", error);
        return []; 
    }
}