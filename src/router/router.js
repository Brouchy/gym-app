import { obtenerSesionUsuario } from "./auth";
import { renderizarBarraNavegacion } from "../components/Navbar/Navbar";
import { renderizarVistaLogin } from "../views/login/LoginView";
import { renderizarPanelRecepcion } from "../views/recepcion/RecepcionDashboard";
import { renderizarPanelAdmin } from "../views/admin/AdminDashboard";

export const navegar = (contenedor) => {
    if (!contenedor) {
        console.error("el router no recibio un contenedor");
        return;
    }

    const usuario = obtenerSesionUsuario();
    contenedor.innerHTML = ``;

    renderizarBarraNavegacion(contenedor);

    if (!usuario) {
        renderizarVistaLogin(contenedor);
        return;
    }

    if (usuario.role === 'admin') {
        renderizarPanelAdmin(contenedor);
    } else if (usuario.role === 'recepcion' || usuario.role === 'trainer') {
        renderizarPanelRecepcion(contenedor, usuario);
    }
};
