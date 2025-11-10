import estilos from "./ClasesView.module.css";
// Reutilizamos el CRUD de Admin para que Recepción tenga la misma UI y funcionalidades
import { renderizarVistaClasesCRUD } from "../../admin/ClasesView/ClasesCRUDView.js";

/**
 * Vista principal del módulo Clases
 * Contiene las pestañas:
 *  - Gestión de Clases
 *  - Asignación de Miembros
 */
export const renderizarVistaClases = async (contenedor) => {
  // Limpiar cualquier modal abierto
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());

  // HTML base sin pestañas; se muestra directamente el CRUD reutilizado de Admin
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <h2>Módulo de Gestión de Clases</h2>
      <div id="contenido-clases"></div>
    </div>
  `;

  const contenido = contenedor.querySelector("#contenido-clases");
  await renderizarVistaClasesCRUD(contenido);
};
