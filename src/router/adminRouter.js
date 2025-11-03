import { renderizarVistaActividades } from "../views/admin/ActividadesView";
import { renderizarVistaAsistencia } from "../views/admin/AsistenciaView";
import { renderizarVistaClases } from "../views/admin/ClasesView/ClasesView.js";
import { renderizarVistaEntrenadores } from "../views/admin/EntrenadoresView";
import { renderizarVistaMembresias } from "../views/admin/MembresiasView";
import { renderizarVistaMiembros } from "../views/admin/MiembrosView.js";
import { renderizarVistaReportes } from "../views/admin/ReportesView";


/**
 * El "Sub-Router" del Admin.
 * Renderiza el módulo solicitado en el contenedor de contenido.
 * @param {string} modulo - El nombre del módulo a cargar (ej. 'miembros')
 * @param {HTMLElement} contenedor - El div (#admin-contenido)
 */



export const navegarAdmin = (modulo, contenedor) => {
    
    // Limpiamos el contenedor del módulo
    contenedor.innerHTML = 'Cargando...';

    // 2. Usamos un 'switch' para decidir qué vista renderizar
    switch (modulo) {
        case 'miembros':
            renderizarVistaMiembros(contenedor);
            break;
        case 'membresias':
            renderizarVistaMembresias(contenedor);
            break;
        case 'clases':
            renderizarVistaClases(contenedor);
            break;
        case 'actividades':
            renderizarVistaActividades(contenedor);
            break;
        case 'entrenadores':
            renderizarVistaEntrenadores(contenedor);
            break;
        case 'asistencia':
            renderizarVistaAsistencia(contenedor);
            break;
        case 'reportes':
            renderizarVistaReportes(contenedor);
            break;
        default:
            // Por defecto, mostramos el módulo de miembros
            renderizarVistaMiembros(contenedor);
            break;
    }
}
