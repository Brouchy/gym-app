import { renderizarVistaInicioRecepcion } from '../views/recepcion/InicioView.js';
import { renderizarVistaMiembros } from '../views/recepcion/MiembrosView.js';
import { renderizarVistaAsistencia } from '../views/recepcion/AsistenciaView.js';
import { renderizarVistaClases } from '../views/recepcion/ClasesView/ClasesView.js';
import { renderizarVistaMembresias } from '../views/recepcion/MembresiasView.js';

export const navegarRecepcion = async (modulo, contenedor) => {
  if (!contenedor) return;
  contenedor.innerHTML = 'Cargando...';

  try {
    switch (modulo) {
      case 'inicio':
        await renderizarVistaInicioRecepcion(contenedor);
        break;
      case 'miembros':
        await renderizarVistaMiembros(contenedor);
        break;
      case 'asistencia':
        await renderizarVistaAsistencia(contenedor);
        break;
      case 'clases':
        await renderizarVistaClases(contenedor);
        break;
      case 'membresias':
        await renderizarVistaMembresias(contenedor);
        break;
      default:
        await renderizarVistaInicioRecepcion(contenedor);
        break;
    }
  } catch (error) {
    console.error(`Error al cargar el modulo de recepcion (${modulo}):`, error);
    contenedor.innerHTML = `
      <div style="padding:24px;color:#ef4444;">
        <h3>Ocurrio un problema</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
};
