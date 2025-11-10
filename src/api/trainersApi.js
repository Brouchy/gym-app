// src/api/trainersApi.js
const URL_BASE = import.meta.env.VITE_URL_BASE;

export const apiObtenerEntrenadores = async () => {
  const res = await fetch(`${URL_BASE}/entrenadors`); // coincide con db.json
  if (!res.ok) throw new Error("Error al obtener entrenadores");
  return res.json();
};

export const apiCrearEntrenador = async (entrenador) => {
  const res = await fetch(`${URL_BASE}/entrenadors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entrenador),
  });
  if (!res.ok) throw new Error("Error al crear entrenador");
  return res.json();
};

export const apiActualizarEntrenador = async (id, entrenador) => {
  const res = await fetch(`${URL_BASE}/entrenadors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entrenador),
  });
  if (!res.ok) throw new Error("Error al actualizar entrenador");
  return res.json();
};

export const apiEliminarEntrenador = async (id) => {
  const res = await fetch(`${URL_BASE}/entrenadors/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar entrenador");
};

export const apiObtenerMiembrosPorEntrenador = async (id) => {
  const res = await fetch(`${URL_BASE}/miembros?entrenadorId=${id}`);
  if (!res.ok) throw new Error("Error al obtener miembros por entrenador");
  return res.json();
};
// src/api/trainersApi.js
export const apiObtenerClasesConNombre = async () => {
  const res = await fetch(`${URL_BASE}/clases`);
  if (!res.ok) throw new Error("Error al obtener clases");
  const clases = await res.json();

  // si querés agregar el nombre de la actividad y del entrenador en cada clase:
  return clases.map(c => ({
    ...c,
    actividadNombre: c.actividad?.nombre ?? `Actividad ${c.actividadId ?? "?"}`,
    entrenadorNombre: c.entrenador?.nombre ?? `Entrenador ${c.entrenadorId ?? "?"}`,
  }));
};