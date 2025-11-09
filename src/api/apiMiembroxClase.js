const URL_BASE = import.meta.env.VITE_URL_BASE;

export const apiObtenerMiembrosXClase = async () => {
  const ENDPOINT = "miembrosXClase?_expand=miembro&_expand=clase";

  try {
    // 1️⃣ Traer las relaciones base (miembro y clase)
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    const miembrosXClase = await respuesta.json();

    // 2️⃣ Traer los entrenadores (para expandirlos manualmente)
    const respEntrenadores = await fetch(`${URL_BASE}/entrenadors`);
    const entrenadores = await respEntrenadores.json();

    // 3️⃣ Expandir y normalizar datos
    const resultadoFinal = miembrosXClase.map(mx => {
      // Expandir entrenador de la clase
      if (mx.clase && mx.clase.entrenadorId) {
        mx.clase.entrenador =
          entrenadores.find(e => e.id === mx.clase.entrenadorId) || null;
      }

      // 🧩 Normalizar campos del miembro
      if (mx.miembro) {
        // Unificar nombre del campo de apellido
        if (mx.miembro.apellidos && !mx.miembro.apellido) {
          mx.miembro.apellido = mx.miembro.apellidos;
        }

        // Crear nombre completo (más legible)
        mx.miembro.nombreCompleto = `${mx.miembro.nombre ?? ""} ${mx.miembro.apellido ?? ""}`.trim();
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
    console.error("❌ Error en apiObtenerMiembrosXClasePorId:", error);
    return null;
  }
};

// ✅ Crear una nueva relación Miembro ↔ Clase
export const apiCrearMiembroXClase = async (datos) => {
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
    console.error("❌ Error en apiCrearMiembroXClase:", error);
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
    console.error("❌ Error en apiActualizarMiembrosXClase:", error);
    return null;
  }
};

// ✅ Eliminar una relación Miembro ↔ Clase
export const apiEliminarMiembroXClase = async (id) => {
  const ENDPOINT = `miembrosXClase/${id}`;
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return { exito: true };
  } catch (error) {
    console.error("❌ Error en apiEliminarMiembroXClase:", error);
    return { exito: false };
  }
};
