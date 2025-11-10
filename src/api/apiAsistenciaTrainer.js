const URL_BASE = import.meta.env.VITE_URL_BASE;

// Obtener todas las asistencias de entrenadores
export const apiObtenerAsistenciasEntrenadores = async () => {
    const res = await fetch(`${URL_BASE}/asistenciasEntrenadores`);
    if (!res.ok) throw new Error("Error al obtener asistencias de entrenadores");
    return res.json();
};

// Crear nueva asistencia de entrenador
export const apiCrearAsistenciaEntrenador = async (asistencia) => {
    const res = await fetch(`${URL_BASE}/asistenciasEntrenadores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(asistencia),
    });
    if (!res.ok) throw new Error("Error al crear asistencia del entrenador");
    return res.json();
};

// Eliminar asistencia de entrenador
export const apiEliminarAsistenciaEntrenador = async (id) => {
    try {
    const res = await fetch(`${URL_BASE}/asistenciasEntrenadores/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) throw new Error("Error al eliminar asistencia del entrenador");
    return true;
    } catch (error) {
    console.error("❌ Error al eliminar asistencia:", error);
    return false;
    }
};
