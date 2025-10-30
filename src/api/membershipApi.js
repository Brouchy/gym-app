const URL_BASE = import.meta.env.VITE_URL_BASE;

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
