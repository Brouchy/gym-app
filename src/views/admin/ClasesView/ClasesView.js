import estilos from "./ClasesView.module.css";
import { renderizarVistaClasesCRUD } from "./ClasesCRUDView.js";
import { renderizarVistaMiembroXClase } from "./MiembroXClaseView.js";

/**
 * Vista principal del módulo Clases
 * Contiene las pestañas:
 *  - Gestión de Clases
 *  - Asignación de Miembros
 */
export const renderizarVistaClases = async (contenedor) => {
  // Limpiar cualquier modal abierto
  document.querySelectorAll('[class*="modal"]').forEach((m) => m.remove());

  // HTML base con pestañas
  contenedor.innerHTML = `
    <div class="${estilos.contenedor}">
      <div class="${estilos.navTabs}">
        <button id="btn-crud" class="${estilos.tabActiva}">📋 Gestión de Clases</button>
        <button id="btn-asignacion">🧍‍♂️ Asignación de Miembros</button>
      </div>
      <div id="contenido-clases"></div>
    </div>
  `;

  const contenido = contenedor.querySelector("#contenido-clases");

  // Mostrar la vista por defecto (CRUD)
  await renderizarVistaClasesCRUD(contenido);

  const btnCrud = contenedor.querySelector("#btn-crud");
  const btnAsignacion = contenedor.querySelector("#btn-asignacion");

  btnCrud.addEventListener("click", async () => {
    activarTab("crud");
    await renderizarVistaClasesCRUD(contenido);
  });

  btnAsignacion.addEventListener("click", async () => {
    activarTab("asignacion");
    await renderizarVistaMiembroXClase(contenido);
  });

  function activarTab(tab) {
    btnCrud.classList.toggle(estilos.tabActiva, tab === "crud");
    btnAsignacion.classList.toggle(estilos.tabActiva, tab === "asignacion");
  }
};
