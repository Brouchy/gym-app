const URL_BASE = import.meta.env.VITE_URL_BASE || "http://localhost:3001";

/**
 * 🟢 Obtener TODAS las actividades
 */
export const apiObtenerActividades = async () => {
  const ENDPOINT = 'actividades'; // Ajustado según Swagger

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenerActividades:", error);
    return [];
  }
};

/**
 * 🟡 Crear NUEVA actividad
 */
export const apiCrearActividad = async (actividad) => {
  const ENDPOINT = 'actividades';

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actividad)
    });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiCrearActividad:", error);
    return null;
  }
};

/**
 * 🟠 Actualizar actividad EXISTENTE
 */
export const apiActualizarActividad = async (id, actividad) => {
  const ENDPOINT = `actividades/${id}`;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actividad)
    });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiActualizarActividad:", error);
    return null;
  }
};

/**
 * 🔴 Eliminar actividad por ID
 */
export const apiEliminarActividad = async (id) => {
  const ENDPOINT = `actividades/${id}`;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'DELETE'
    });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return true;
  } catch (error) {
    console.error("❌ Error en apiEliminarActividad:", error);
    return false;
  }
};