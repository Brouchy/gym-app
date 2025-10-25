

export const renderizarPanelEntrenador=(contenedor,usuario)=>{
   const divPanelEntrenador = document.createElement('div');
    divPanelEntrenador.innerHTML=`<h2>Panel de Entrenador ${usuario.nombre}</h2>`

    contenedor.appendChild(divPanelEntrenador);
}

