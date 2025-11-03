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