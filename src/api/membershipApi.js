const URL_BASE = import.meta.env.VITE_URL_BASE;

export const apiObtenerMembresias = async () => {
  const ENDPOINT = 'membresias?_expand=tipoDeMembresia';

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) {
      console.error(`Error HTTP: ${respuesta.status}`);
      return [];
    }
    return await respuesta.json();
  } catch (error) {
    console.error('Error en apiObtenerMembresias:', error);
    return [];
  }
};

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
