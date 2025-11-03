const URL_BASE = import.meta.env.VITE_URL_BASE;

export const apiObtenerMiembrosXClase = async () => {
  const ENDPOINT = "miembrosXClase?_expand=miembro&_expand=clase";
  try {
    // 1️⃣ Primero traemos las relaciones base
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    const miembrosXClase = await respuesta.json();

    // 2️⃣ Traemos todos los entrenadores para resolverlos localmente
    const respEntrenadores = await fetch(`${URL_BASE}/entrenadors`);
    const entrenadores = await respEntrenadores.json();

    // 3️⃣ Hacemos el “expand” manual
    const resultadoFinal = miembrosXClase.map(mx => {
      if (mx.clase && mx.clase.entrenadorId) {
        mx.clase.entrenador = entrenadores.find(
          e => e.id === mx.clase.entrenadorId
        ) || null;
      }
      return mx;
    });

    return resultadoFinal;
  } catch (error) {
    console.error("❌ Error en apiObtenerMiembrosXClase:", error);
    return [];
  }
};

// ✅ Obtener una relación por ID
export const apiObtenerMiembrosXClasePorId = async (id) => {
  const ENDPOINT = `miembrosXClase/${id}`;
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenermiembrosXClasePorId:", error);
    return null;
  }
};


// ✅ Crear una nueva relación Miembro ↔ Clase
export const apiCrearMiembroXClase = async (datos) => {
    console.log(datos);
  const ENDPOINT = "miembrosXClase";
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiCrearmiembrosXClase:", error);
    return null;
  }
};


// ✅ Actualizar una relación existente
export const apiActualizarMiembrosXClase = async (id, datos) => {
  const ENDPOINT = `miembrosXClase/${id}`;
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiActualizarmiembrosXClase:", error);
    return null;
  }
};

export const apiEliminarMiembroXClase = async (id) => {
  console.log("borrar",id);
  const ENDPOINT = `miembrosXClase/${id}`;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, {
      method: "DELETE"
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return { exito: true };
  } catch (error) {
    console.error("❌ Error en apiEliminarMiembroXClase:", error);
    return { exito: false };
  }
};