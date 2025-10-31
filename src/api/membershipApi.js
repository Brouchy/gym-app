const URL_BASE = import.meta.env.VITE_URL_BASE;

/**
 * Obtener todas las membresías (con su tipo expandido)
 * Ej: GET /membresias?_expand=tipoDeMembresia
 */
export const apiObtenerMembresias = async () => {
  const ENDPOINT = 'membresias?_expand=tipoDeMembresia';
  try {
    const res = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error en apiObtenerMembresias:', err);
    return [];
  }
};


export const apiCrearMembresia = async (datos) => {
  const ENDPOINT = 'membresias';
  try {
    const res = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error en apiCrearMembresia:', err);
    return null;
  }
};


export const apiActualizarMembresia = async (id, datos) => {
  const ENDPOINT = `membresias/${id}`;
  try {
    const res = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error en apiActualizarMembresia:', err);
    return null;
  }
};

/**
 * Eliminar una membresía
 */
export const apiEliminarMembresia = async (id) => {
  const ENDPOINT = `membresias/${id}`;
  try {
    const res = await fetch(`${URL_BASE}/${ENDPOINT}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return { exito: true };
  } catch (err) {
    console.error('Error en apiEliminarMembresia:', err);
    return { exito: false };
  }
};

//TODO: membresias x miembro



export const apiObtenerMembresiasXMiembros = async () => {
  const ENDPOINT = `membresiaXMiembros?_expand=miembro&_expand=membresia&_expand=estadoMembresia&_expand=pago`;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) {
      console.error(`Error HTTP: ${respuesta.status}`);
      return null;
    }

    const membresias = await respuesta.json();

    // Expand manual del tipoDeMembresia (anidado dentro de membresia)
    for (const m of membresias) {
      if (m.membresia?.tipoDeMembresiaId) {
        const tipoRes = await fetch(`${URL_BASE}/tipoDeMembresias/${m.membresia.tipoDeMembresiaId}`);
        if (tipoRes.ok) {
          const tipo = await tipoRes.json();
          m.membresia.tipoDeMembresia = tipo;
        }
      }
    }

    return membresias;
  } catch (error) {
    console.error(`Error en apiObtenerMembresiasXMiembros:`, error);
    return null;
  }
};


/**
 * Crear un nuevo vínculo Miembro ↔ Membresía (POST)
 */
export const apiCrearMembresiaXMiembro = async (nuevoRegistro) => {
  const ENDPOINT = 'membresiaXMiembros';

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoRegistro)
    });

    if (!respuesta.ok) {
      console.error(`Error HTTP: ${respuesta.status}`);
      return null;
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error en apiCrearMembresiaXMiembro:", error);
    return null;
  }
};


export const apiObtenerTiposDeMembresia = async () => {
  try {
    const respuesta = await fetch(`${URL_BASE}/tipoDeMembresias`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("Error en apiObtenerTiposDeMembresia:", error);
    return [];
  }
};