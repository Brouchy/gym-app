import { apiObtenerMiembros } from "../../api/membersApi";

/**
 * Función de prueba para llamar a la API
 */
const probarApi = async (contenedor) => {
    try {
        console.log('Llamando a apiObtenerMiembros...');
        
        // 2. Llamamos a la API
        const miembros = await apiObtenerMiembros();

        // 3. Mostramos el resultado en la consola
        console.log('Respuesta de la API:', miembros);

        // 4. Mostramos un mensaje en la página
        if (miembros && miembros.length > 0) {
            contenedor.innerHTML = `
                <h2>Módulo de Miembros</h2>
                <p>¡Éxito! Se cargaron ${miembros.length} miembros desde la API.</p>
                <p>Revisa la consola (F12) para ver los datos completos.</p>
            `;
        } else {
            contenedor.innerHTML = '<h2>Error</h2><p>No se pudieron cargar los miembros. Revisa la consola.</p>';
        }

    } catch (error) {
        console.error("Falló la prueba de la API:", error);
        contenedor.innerHTML = '<h2>Error</h2><p>Falló la llamada a la API. Revisa la consola.</p>';
    }
}

/**
 * Renderiza la vista de Miembros
 * (Esta es la función que llama tu adminRouter)
 */
export const renderizarVistaMiembros = (contenedor) => {
    contenedor.innerHTML = '<h2>Módulo de Miembros</h2><p>Cargando datos desde la API...</p>';
    
    // Llamamos a nuestra función de prueba
    probarApi(contenedor);
}