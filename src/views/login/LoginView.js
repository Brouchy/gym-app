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
                <div class="${estilos.passwordWrapper}">
                    <input type="password" id="password" name="password" required value="123">
                    <button type="button" id="togglePassword" class="${estilos.togglePassword}" aria-label="Mostrar u ocultar contraseña" aria-pressed="false">
                        <svg id="iconEye" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <button type="submit" class="${estilos.botonLogin}">Entrar</button>
        </form>
    `;
    
    // 3. Añadimos nuestro 'div' al contenedor
    contenedorApp.appendChild(divLogin); 

    // 4. El resto del código (listeners) queda igual
    const formulario = document.getElementById('loginForm');
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
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

    toggleBtn?.addEventListener('click', () => {
        const esTexto = passwordInput.type === 'text';
        passwordInput.type = esTexto ? 'password' : 'text';
        toggleBtn.setAttribute('aria-pressed', (!esTexto).toString());
        const icon = toggleBtn.querySelector('#iconEye');
        if (icon) {
            icon.innerHTML = esTexto
                ? '<path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/>'
                : '<path d="M2 5.27L3.28 4l16.97 16.97-1.27 1.27-2.4-2.4C14.99 20.21 13.55 20.5 12 20.5 5 20.5 2 13.5 2 13.5c.73-1.61 1.73-3.06 2.92-4.28L2 5.27zM12 7.5c-1.2 0-2.3.37-3.2 1l1.5 1.5c.51-.32 1.11-.5 1.7-.5 1.93 0 3.5 1.57 3.5 3.5 0 .6-.18 1.19-.5 1.7l1.5 1.5c.63-.9 1-2 .99-3.2 0-2.76-2.24-5-4.99-5zM7.12 9.62C5.96 10.65 5.03 12 4.5 13.5c0 0 2.5 5.5 7.5 5.5 1.02 0 1.98-.2 2.86-.56l-1.79-1.79c-.63.22-1.31.35-2.02.35-2.76 0-5-2.24-5-5 0-.71.13-1.39.35-2.02l-1.28-1.28z"/>';
        }
    });
}