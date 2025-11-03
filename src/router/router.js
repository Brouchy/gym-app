
import { obtenerSesionUsuario } from "./auth";
import { renderizarBarraNavegacion } from "../components/Navbar/Navbar";
import { renderizarVistaLogin } from "../views/login/LoginView";
import { renderizarPanelEntrenador } from "../views/trainer/TrainerDashboard";
import { renderizarPanelAdmin } from "../views/admin/AdminDashboard";

//TODO:adminddashboard 

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