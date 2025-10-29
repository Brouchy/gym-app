
const URL_BASE = import.meta.env.VITE_URL_BASE;

export const apiObtenerMiembroPorId = async (id) => {
    const ENDPOINT = `estadoMembresiaIds/${id}`;
    
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
