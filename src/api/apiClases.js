const URL_BASE = import.meta.env.VITE_URL_BASE;

/** Obtener todas las clases (con expand) */
export const apiObtenerClases = async () => {
  const ENDPOINT = 'clases?_expand=actividad&_expand=entrenador'; // para backend real

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

    return await respuesta.json();
  } catch (error) {
    console.error('Error en apiObtenerClases:', error);
    return [];
  }
};

export const apiCrearClase = async (datosClase) => {
  const ENDPOINT = 'clases';

  // 🔍 Aseguramos que se envíen solo los IDs
  const payload = {
    claseId: Date.now(), // JSON Server necesita un id único
    actividadId: datosClase.actividadId,
    entrenadorId: datosClase.entrenadorId,
    fecha: datosClase.fecha,
    horaInicio: datosClase.horaInicio,
    horaFin: datosClase.horaFin,
    cupo: datosClase.cupo
  };

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error('❌ Error en apiCrearClase:', error);
    return null;
  }
};

/** Actualizar clase */
export const apiActualizarClase = async (id, datosClase) => {
  const ENDPOINT = `clases/${id}`;
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosClase)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error('Error en apiActualizarClase:', error);
    return null;
  }
};

/** Eliminar clase */
export const apiEliminarClase = async (id) => {
  const ENDPOINT = `clases/${id}`;
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, { method: 'DELETE' });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return { exito: true };
  } catch (error) {
    console.error('Error en apiEliminarClase:', error);
    return { exito: false };
  }
};