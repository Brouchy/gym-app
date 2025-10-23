// 1. Lee la variable de entorno de Vite
const URL_BASE = import.meta.env.VITE_URL_BASE;

/**
 * Obtiene TODOS los miembros.
 * Usamos _expand para que json-server nos traiga los datos
 * anidados de "entrenador" y "tipoDeMiembro".
 */
export const apiObtenerMiembros = async () => {
    // ¡LA MAGIA DE JSON-SERVER!
    // Esto simula tu backend real al anidar los datos
    const ENDPOINT = 'miembros?_expand=entrenador&_expand=tipoDeMiembro';
    
    try {
        const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
        console.log("respuesta",respuesta);
        if (!respuesta.ok) {
            console.error(`Error HTTP: ${respuesta.status}`);
            return []; // Devolver array vacío en caso de error
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error de red en apiObtenerMiembros:", error);
        return []; 
    }
}