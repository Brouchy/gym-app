import { apiObtenerClases } from "../../api/apiClases";


export const renderizarVistaClases = (contenedor) => {
    contenedor.innerHTML = '<h2>Módulo de Gestión de Clases</h2>';
    apiObtenerClases().then(console.log);
}