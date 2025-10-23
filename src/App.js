import { navegar } from "./router/router";


export const App=(elementoRaiz)=>{

   // Verificamos que el contenedor llegó bien
    if (!elementoRaiz) {
        console.error("La App no recibió un elemento raíz.");
        return;
    }
    
    console.log("App iniciada llamando al router...");
    navegar(elementoRaiz);    
}