const URL_BASE = import.meta.env.VITE_URL_BASE;

/* ===============================
  CREAR PAGO
================================= */
export const apiCrearPago = async (datosPago) => {
  try {
    const resp = await fetch(`${URL_BASE}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosPago)
    });
    if (!resp.ok) throw new Error(`Error HTTP ${resp.status}`);
    return await resp.json();
  } catch (error) {
    console.error("Error en apiCrearPago:", error);
    return null;
  }
};

/* ===============================
  OBTENER PAGOS
================================= */
export const apiObtenerPagos = async () => {
  try {
    const resp = await fetch(`${URL_BASE}/pagos`);
    const pagos = resp.ok ? await resp.json() : [];

    const miembrosResp = await fetch(`${URL_BASE}/miembros`);
    const miembros = miembrosResp.ok ? await miembrosResp.json() : [];

    const membresiasResp = await fetch(`${URL_BASE}/membresias`);
    const membresias = membresiasResp.ok ? await membresiasResp.json() : [];

    const mxmResp = await fetch(`${URL_BASE}/membresiaXMiembros`);
    const membresiaXMiembros = mxmResp.ok ? await mxmResp.json() : [];

    return pagos.map(p => {
      const rel = membresiaXMiembros.find(mx => Number(mx.pagoId) === Number(p.id));
      const miembro = rel ? miembros.find(m => m.id === rel.miembroId) : { nombre: "-", apellidos: "", dni: "-" };
      const membresia = rel ? membresias.find(m => m.id === rel.membresiaId) : { nombrePlan: "-" };

      return {
        ...p,
        miembroNombre: `${miembro.nombre} ${miembro.apellidos ?? ""}`.trim(),
        miembroDocumento: miembro.dni ?? "-",
        planNombre: membresia.nombrePlan ?? "-",
        metodoDescripcion: p.metodoPago ?? "No definido"
      };
    });
  } catch (error) {
    console.error("Error en apiObtenerPagos:", error);
    return [];
  }
};

/* ===============================
  OBTENER MIEMBROS
================================= */
export const apiObtenerMiembros = async () => {
  const resp = await fetch(`${URL_BASE}/miembros`);
  return resp.ok ? await resp.json() : [];
};

/* ===============================
  OBTENER MEMBRESIAS
================================= */
export const apiObtenerMembresias = async () => {
  const resp = await fetch(`${URL_BASE}/membresias`);
  return resp.ok ? await resp.json() : [];
};

/* ===============================
  OBTENER MEMBRESIAS X MIEMBROS
================================= */
export const apiObtenerMembresiasXMiembros = async () => {
  const resp = await fetch(`${URL_BASE}/membresiaXMiembros`);
  return resp.ok ? await resp.json() : [];
};
