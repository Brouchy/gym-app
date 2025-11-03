const URL_BASE = import.meta.env.VITE_URL_BASE || "http://localhost:3001";

/**
 * 🟢 Obtener todas las clases (con actividad y entrenador)
 */
export const apiObtenerClases = async () => {
  const ENDPOINT = "clases?_expand=actividad&_expand=entrenador";

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenerClases:", error);
    return [];
  }
};

/**
 * 🟢 Obtener una clase por ID
 */
export const apiObtenerClasePorId = async (id) => {
  const ENDPOINT = `clases/${id}?_expand=actividad&_expand=entrenador`;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenerClasePorId:", error);
    return null;
  }
};

/**
 * 🟡 Crear una nueva clase
 */
export const apiCrearClase = async (nuevaClase) => {
  console.log(nuevaClase);
  const ENDPOINT = "clases";

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaClase)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiCrearClase:", error);
    return null;
  }
};

/**
 * 🟠 Actualizar clase existente
 */
export const apiActualizarClase = async (id, claseActualizada) => {
  const ENDPOINT = `clases/${id}`;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claseActualizada)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiActualizarClase:", error);
    return null;
  }
};

/**
 * 🔴 Eliminar clase
 */
export const apiEliminarClase = async (id) => {
  console.log(id);
  const ENDPOINT = `clases/${id}`;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: "DELETE"
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return { exito: true };
  } catch (error) {
    console.error("❌ Error en apiEliminarClase:", error);
    return { exito: false };
  }
};