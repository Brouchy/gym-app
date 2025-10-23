

export const apiLogin=async(email,password)=>{
    const endpoint=`users?email=${email}&password=${password}`;
    try{
        const respuesta= await fetch(`${URL_BASE}/${endpoint}`);

        if(!respuesta.ok){
            console.error(`Error HTTP: ${respuesta.status}`);
            return null;
        }
        const usuarios = await respuesta.json();
        return (usuarios && usuarios.length > 0) ? usuarios[0] : null;
    }catch (error) {
        console.error("Error de red o conexión en apiLogin:", error);
        return null; // Devuelve null si hay un error
    }
}