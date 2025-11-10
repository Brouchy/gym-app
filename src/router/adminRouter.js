import { renderizarVistaActividades } from "../views/admin/ActividadesView";
import { renderizarVistaAsistencia } from "../views/admin/AsistenciaView";
import { renderizarVistaClases } from "../views/admin/ClasesView/ClasesView.js";
import { renderizarVistaEntrenadores } from "../views/admin/EntrenadoresView";
import { renderizarVistaMembresias } from "../views/admin/MembresiasView";
import { renderizarVistaMiembros } from "../views/admin/MiembrosView.js";
import { renderizarVistaReportes } from "../views/admin/ReportesView";
import { renderizarVistaBienvenida } from "../views/admin/BienvenidaView.js";
import { renderizarVistaUsuarios } from "../views/admin/UsuariosView.js";
import { renderizarVistaConfiguraciones } from "../views/admin/ConfiguracionesView.js";


/**
 * El "Sub-Router" del Admin.
 * Renderiza el módulo solicitado en el contenedor de contenido.
 * @param {string} modulo - El nombre del módulo a cargar (ej. 'miembros')
 * @param {HTMLElement} contenedor - El div (#admin-contenido)
 */



export const navegarAdmin = async (modulo, contenedor) => {
    
    // Limpiamos el contenedor del módulo
    contenedor.innerHTML = 'Cargando...';

    // 2. Usamos un 'switch' para decidir qué vista renderizar
    try {
        switch (modulo) {
            case 'inicio':
                await renderizarVistaBienvenida(contenedor);
                break;
            case 'miembros':
                await renderizarVistaMiembros(contenedor);
                break;
            case 'membresias':
                await renderizarVistaMembresias(contenedor);
                break;
            case 'clases':
                await renderizarVistaClases(contenedor);
                break;
            case 'actividades':
                await renderizarVistaActividades(contenedor);
                break;
            case 'entrenadores':
                await renderizarVistaEntrenadores(contenedor);
                break;
            case 'asistencia':
                await renderizarVistaAsistencia(contenedor);
                break;
            case 'reportes':
                await renderizarVistaReportes(contenedor);
                break;
            case 'usuarios':
                await renderizarVistaUsuarios(contenedor);
                break;
            case 'configuraciones':
                await renderizarVistaConfiguraciones(contenedor);
                break;
            default:
                // Por defecto, mostramos la vista de bienvenida
                await renderizarVistaBienvenida(contenedor);
                break;
        }
    } catch (error) {
        console.error(`Error al renderizar el módulo ${modulo}:`, error);
        contenedor.innerHTML = `<div style="padding: 2rem; color: #e53e3e;">
            <h3>Error al cargar el módulo</h3>
            <p>${error.message}</p>
        </div>`;
    }
}
