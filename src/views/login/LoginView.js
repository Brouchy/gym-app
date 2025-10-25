import estilos from './LoginView.module.css';
import { manejarLogin } from '../../router/auth';


export const renderizarVistaLogin = (contenedorApp) => {
    
    // ¡LA CORRECCIÓN ESTÁ AQUÍ!
    // 1. Creamos un 'div' propio para esta vista
    const divLogin = document.createElement('div');
    // 2. Aplicamos los estilos al 'div' interno, no al contenedorApp
    divLogin.className = estilos.contenedorLogin; 

    divLogin.innerHTML = `
        <form id="loginForm" class="${estilos.formulario}">
            <h2>Iniciar Sesión</h2>
            
            <div id="loginError" class="${estilos.errorLogin}">
                Email o contraseña incorrectos.
            </div>

            <div class="${estilos.grupoInput}">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required value="admin@gym.com">
            </div>

            <div class="${estilos.grupoInput}">
                <label for="password">Contraseña:</label>
                <input type="password" id="password" name="password" required value="123">
            </div>
            
            <button type="submit" class="${estilos.botonLogin}">Entrar</button>
        </form>
    `;
    
    // 3. Añadimos nuestro 'div' al contenedor
    contenedorApp.appendChild(divLogin); 

    // 4. El resto del código (listeners) queda igual
    const formulario = document.getElementById('loginForm');
    
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault(); 
        const email = evento.target.email.value;
        const password = evento.target.password.value;
        const errorDiv = document.getElementById('loginError');
        
        errorDiv.style.display = 'none'; 
        const exito = await manejarLogin(email, password);
        
        if (!exito) {
            errorDiv.style.display = 'block';
        }
    });
}