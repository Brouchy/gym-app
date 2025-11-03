const URL_BASE = import.meta.env.VITE_URL_BASE;

/**
 * Crear un nuevo pago (POST)
 */
export const apiCrearPago = async (datosPago) => {
  const ENDPOINT = 'pagos';

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosPago)
    });

    if (!respuesta.ok) {
      console.error(`Error HTTP: ${respuesta.status}`);
      return null;
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error en apiCrearPago:", error);
    return null;
  }
};


export const apiObtenerPagos = async () => {
  const ENDPOINT = "pagos";

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenerPagos:", error);
    return [];
  }
};
