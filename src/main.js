// 1. Importamos los estilos globales (Vite se encarga de cargarlos)
import './style.css';

// 2. Importamos nuestro "Orquestador"
import { App } from './App.js';

// 3. Buscamos el contenedor en el HTML
const elementoRaiz = document.querySelector("#app");

// 4. Verificamos que exista
if (!elementoRaiz) {
    throw new Error("Error fatal: No se encontró el elemento #app en el HTML.");
}

// 5. ¡Lanzamos la App!
// Le pasamos el contenedor para que sepa dónde renderizarse.
App(elementoRaiz);