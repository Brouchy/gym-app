const URL_BASE = import.meta.env.VITE_URL_BASE || "http://localhost:3001";


const ENDPOINT_ASISTENCIAS = "asistencias";
const ENDPOINT_MIEMBROS_X_CLASE = "miembrosXClase";
const ENDPOINT_MIEMBROS = "miembros";
const ENDPOINT_CLASES = "clases";
const ENDPOINT_ENTRENADORES = "entrenadors";
const ENDPOINT_ACTIVIDADES = "actividads";
const ENDPOINT_TIPOS_ASISTENCIA = "tiposDeAsistencia";
const ENDPOINT_MEMBRESIAS_X_MIEMBRO = "membresiaXMiembros";
const ENDPOINT_MEMBRESIAS = "membresias";
const ENDPOINT_TIPOS_MEMBRESIA = "tipoDeMembresias";
const ENDPOINT_ESTADOS_MEMBRESIA = "estadoMembresias";
const ENDPOINT_PAGOS = "pagos";



export const apiObtenerAsistenciasCompletas = async () => {
  try {
    const [
      asistencias,
      miembrosXClase,
      miembros,
      clases,
      entrenadores,
      actividades,
      tiposAsistencia,
      membresiasXMiembro,
      membresias,
      tiposMembresia,
      estadosMembresia,
      pagos
    ] = await Promise.all([
      fetch(`${URL_BASE}/${ENDPOINT_ASISTENCIAS}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_MIEMBROS_X_CLASE}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_MIEMBROS}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_CLASES}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_ENTRENADORES}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_ACTIVIDADES}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_TIPOS_ASISTENCIA}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_MEMBRESIAS_X_MIEMBRO}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_MEMBRESIAS}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_TIPOS_MEMBRESIA}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_ESTADOS_MEMBRESIA}`).then(r => r.json()),
      fetch(`${URL_BASE}/${ENDPOINT_PAGOS}`).then(r => r.json())
    ]);

    const map = (arr, key = "id") => Object.fromEntries(arr.map(i => [i[key], i]));
    const mapMiembros = map(miembros);
    const mapClases = map(clases);
    const mapEntrenadores = map(entrenadores);
    const mapActividades = map(actividades);
    const mapMiembrosXClase = map(miembrosXClase);
    const mapTiposAsistencia = map(tiposAsistencia);
    const mapMembresiasXMiembro = map(membresiasXMiembro);
    const mapMembresias = map(membresias);
    const mapTiposMembresia = map(tiposMembresia);
    const mapEstadosMembresia = map(estadosMembresia);
    const mapPagos = map(pagos);

    const resultado = asistencias.map(a => {
      const miembroXClase = mapMiembrosXClase[a.miembroXClaseId];
      const miembro = miembroXClase ? mapMiembros[miembroXClase.miembroId] : null;
      const clase = miembroXClase ? mapClases[miembroXClase.claseId] : null;
      const entrenador = clase ? mapEntrenadores[clase.entrenadorId] : null;
      const actividad = clase ? mapActividades[clase.actividadId] : null;

      const membresiaXMiembro = mapMembresiasXMiembro[a.membresiaXMiembroId];
      const membresia = membresiaXMiembro ? mapMembresias[membresiaXMiembro.membresiaId] : null;
      const tipoMembresia = membresia ? mapTiposMembresia[membresia.tipoDeMembresiaId] : null;
      const estadoMembresia = membresiaXMiembro ? mapEstadosMembresia[membresiaXMiembro.estadoMembresiaId] : null;
      const pago = membresiaXMiembro ? mapPagos[membresiaXMiembro.pagoId] : null;
      const tipoAsistencia = mapTiposAsistencia[a.tipoDeAsistenciaId];

      return {
        asistenciaId: a.id,
        fecha: a.fecha,
        tipoDeAsistencia: tipoAsistencia
          ? { id: tipoAsistencia.id, descripcion: tipoAsistencia.descripcion }
          : null,
        miembroXClase: miembroXClase
          ? {
              miembroXClaseId: miembroXClase.id,
              fechaInscripcion: miembroXClase.fechaInscripcion,
              miembro: miembro
                ? {
                    id: miembro.id,
                    nombre: miembro.nombre,
                    dni: miembro.dni,
                    email: miembro.email,
                    telefono: miembro.telefono,
                    foto: miembro.foto
                  }
                : null,
              clase: clase
                ? {
                    claseId: clase.id,
                    actividad: actividad ? { nombre: actividad.nombre } : null,
                    entrenador: entrenador ? { nombre: entrenador.nombre } : null,
                    fecha: clase.fecha,
                    horaInicio: clase.horaInicio,
                    horaFin: clase.horaFin,
                    cupo: clase.cupo
                  }
                : null
            }
          : null,
        membresiaXMiembro: membresiaXMiembro
          ? {
              membresiaXMiembroId: membresiaXMiembro.id,
              fechaInicio: membresiaXMiembro.fechaInicio,
              fechaFin: membresiaXMiembro.fechaFin,
              membresia: membresia
                ? {
                    nombrePlan: membresia.nombrePlan,
                    tipoDeMembresia: tipoMembresia
                      ? { descripcion: tipoMembresia.descripcion }
                      : null
                  }
                : null,
              estadoMembresia: estadoMembresia
                ? { descripcion: estadoMembresia.descripcion }
                : null,
              pago: pago
                ? {
                    pagoId: pago.id,
                    monto: pago.monto,
                    metodoPago: pago.metodoPago,
                    fechaPago: pago.fechaPago
                  }
                : null
            }
          : null
      };
    });

    return resultado;
  } catch (error) {
    console.error("❌ Error en apiObtenerAsistenciasCompletas:", error);
    return [];
  }
};


export const apiCrearAsistencia = async (asistencia) => {
  try {
    const nueva = {
      miembroXClaseId: asistencia.miembroXClaseId,
      membresiaXMiembroId: asistencia.membresiaXMiembroId,
      tipoDeAsistenciaId: asistencia.tipoDeAsistenciaId,
      fecha: asistencia.fecha || new Date().toISOString()
    };

    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT_ASISTENCIAS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nueva)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiCrearAsistencia:", error);
    return null;
  }
};

/* ===================================================
   ✏️ 3. ACTUALIZAR ASISTENCIA (PUT)
   =================================================== */
export const apiActualizarAsistencia = async (id, datosActualizados) => {
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT_ASISTENCIAS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosActualizados)
    });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiActualizarAsistencia:", error);
    return null;
  }
};

/* ===================================================
   ❌ 4. ELIMINAR ASISTENCIA (DELETE)
   =================================================== */
export const apiEliminarAsistencia = async (id) => {
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT_ASISTENCIAS}/${id}`, {
      method: "DELETE"
    });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return true;
  } catch (error) {
    console.error("❌ Error en apiEliminarAsistencia:", error);
    return false;
  }
};

/* ===================================================
   🔍 5. OBTENER ASISTENCIA POR ID (GET)
   =================================================== */
export const apiObtenerAsistenciaPorId = async (id) => {
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT_ASISTENCIAS}/${id}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenerAsistenciaPorId:", error);
    return null;
  }
};

/* ===================================================
   📋 6. OBTENER TIPOS DE ASISTENCIA
   =================================================== */
export const apiObtenerTiposDeAsistencia = async () => {
  try {
    const respuesta = await fetch(`${URL_BASE}/${ENDPOINT_TIPOS_ASISTENCIA}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
  } catch (error) {
    console.error("❌ Error en apiObtenerTiposDeAsistencia:", error);
    return [];
  }
};