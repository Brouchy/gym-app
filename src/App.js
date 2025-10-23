



export const App=(elementoRaiz)=>{

   // Verificamos que el contenedor llegó bien
    if (!elementoRaiz) {
        console.error("La App no recibió un elemento raíz.");
        return;
    }
    
    console.log("App iniciada y montada en:", elementoRaiz);

    // Por ahora, solo escribiremos un mensaje para probar
    // que la conexión (main.js -> App.js) funciona.
    elementoRaiz.innerHTML = `
        <h1>¡Hola Mundo!</h1>
        <p>Nuestra App.js está funcionando y controlando este HTML.</p>
    `;
    
    // En el siguiente paso, reemplazaremos este innerHTML
    // por la llamada al router: navegar(elementoRaiz)
    
}