const URL_BASE = import.meta.env.VITE_URL_BASE || "http://localhost:3001";


export const apiObtenerActividades = async () => {
  const ENDPOINT = "actividades";

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenerActividades:", error);
    return [];
  }
};