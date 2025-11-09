import { renderizarVistaBienvenida } from "../views/admin/BienvenidaView.js";
import { renderizarVistaMiembros } from "../views/admin/MiembrosView.js";
import { renderizarVistaAsistencia } from "../views/admin/AsistenciaView.js";
import { renderizarVistaClases } from "../views/admin/ClasesView/ClasesView.js";

const opcionesMiembrosRecepcion = { permitirEliminar: false };

export const navegarRecepcion = async (modulo, contenedor) => {
    if (!contenedor) return;
    contenedor.innerHTML = 'Cargando...';

    try {
        switch (modulo) {
            case 'inicio':
                await renderizarVistaBienvenida(contenedor);
                break;
            case 'miembros':
                await renderizarVistaMiembros(contenedor, opcionesMiembrosRecepcion);
                break;
            case 'asistencia':
                await renderizarVistaAsistencia(contenedor);
                break;
            case 'clases':
                await renderizarVistaClases(contenedor);
                break;
            default:
                await renderizarVistaBienvenida(contenedor);
                break;
        }
    } catch (error) {
        console.error(`Error al renderizar el módulo de recepción ${modulo}:`, error);
        contenedor.innerHTML = `
            <div style="padding:2rem;color:#f87171;">
                <h3>Error al cargar el módulo</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
};
