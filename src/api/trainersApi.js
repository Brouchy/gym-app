// src/api/trainersApi.js
const URL_BASE = import.meta.env.VITE_URL_BASE;

export const apiObtenerEntrenadores = async () => {
  const res = await fetch(`${URL_BASE}/entrenadors`);
  return res.json();
};

export const apiCrearEntrenador = async (entrenador) => {
  const res = await fetch(`${URL_BASE}/entrenadors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entrenador),
  });
  return res.json();
};

export const apiActualizarEntrenador = async (id, entrenador) => {
  const res = await fetch(`${URL_BASE}/entrenadors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entrenador),
  });
  return res.json();
};

export const apiEliminarEntrenador = async (id) => {
  await fetch(`${URL_BASE}/entrenadors/${id}`, { method: "DELETE" });
};

// Miembros a cargo de un entrenador
export const apiObtenerMiembrosPorEntrenador = async (id) => {
  const res = await fetch(`${URL_BASE}/miembros?entrenadorId=${id}&membresia=premium`);
  return res.json();
};

// NUEVA FUNCIÓN: Clases de un entrenador con nombre de actividad
export const apiObtenerClasesConNombre = async (entrenadorId) => {
  // Traigo todas las clases del entrenador
  const resClases = await fetch(`${URL_BASE}/clases?entrenadorId=${entrenadorId}`);
  const clases = await resClases.json();

  // Traigo todas las actividades para relacionar el nombre
  const resAct = await fetch(`${URL_BASE}/actividads`);
  const actividades = await resAct.json();

  // Combino nombre de actividad con la clase
  return clases.map(c => {
    const act = actividades.find(a => a.id === c.actividadId);
    return {
      ...c,
      nombre: act ? act.nombre : "Sin nombre"
    };
  });
};
