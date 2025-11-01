// 1. Lee la variable de entorno de Vite
// (Recuerda que debe llamarse VITE_URL_BASE en tu .env)
const URL_BASE = import.meta.env.VITE_URL_BASE_MOCK;

/**
 * Llama a la API para verificar el email y la contraseña.
 * Es autosuficiente y maneja su propio fetch.
 *
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object|null>} El objeto de usuario o null
 */
export const apiLogin = async (email, password) => {
    
    // 2. Construye el endpoint específico para esta petición
    const endpoint = `users?email=${email}&password=${password}`;
    
    // 3. Maneja su propio bloque try/catch
    try {
        // 4. Ejecuta su propio fetch
        const respuesta = await fetch(`${URL_BASE}/${endpoint}`);
        
        if (!respuesta.ok) {
            // 5. Maneja sus propios errores
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        
        const usuarios = await respuesta.json();
        
        // 6. Devuelve la lógica de negocio específica
        return (usuarios && usuarios.length > 0) ? usuarios[0] : null;

    } catch (error) {
        // 7. Maneja errores de red
        console.error("Error de red o conexión en apiLogin:", error);
        return null; 
    }
}