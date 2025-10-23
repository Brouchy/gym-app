
import { obtenerSesionUsuario } from "./auth";
import { renderizarBarraNavegacion } from "../components/Navbar/Navbar";
import { renderizarPanelAdmin } from "../views/admin/adminDashboard";
import { renderizarVistaLogin } from "../views/login/LoginView";
import { renderizarPanelEntrenador } from "../views/trainer/TrainerDashboard";


export const navegar=(contenedor)=>{
    if(!contenedor){
        console.error("el router no recibió un contenedor");
        return;
    }
    const usuario=obtenerSesionUsuario();

    contenedor.innerHTML=``;

    renderizarBarraNavegacion(contenedor);
    
    if(!usuario){
        renderizarVistaLogin(contenedor);
    } else if(usuario.role==='admin'){
        renderizarPanelAdmin(contenedor);
    } else if(usuario.role==='trainer'){
        renderizarPanelEntrenador(contenedor,usuario);
    }

    }