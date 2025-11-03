// src/utils/subirImagen.js
const API_KEY = "1c60684fe3ba1dcae6665019fc2e200e"; // TODO: mover a .env en producción

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const [, base64] = result.split(",");
        resolve(base64);
      } else {
        reject(new Error("No se pudo leer el archivo como base64"));
      }
    };
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.readAsDataURL(file);
  });

export const subirImagenAImgbb = async (file) => {
  if (!file) return null;

  try {
    const base64 = await fileToBase64(file);
    const formData = new FormData();
    formData.append("image", base64);
    formData.append("name", file.name);

    const respuesta = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: formData,
    });

    if (!respuesta.ok) {
      const errorBody = await respuesta.text();
      throw new Error(`ImgBB respondió ${respuesta.status}: ${errorBody}`);
    }

    const data = await respuesta.json();
    const urlSubida = data?.data?.url || data?.data?.display_url;

    if (!urlSubida) {
      throw new Error("ImgBB no devolvió una URL válida");
    }

    return urlSubida;
  } catch (error) {
    console.error("Error subiendo imagen a ImgBB:", error);
    return null;
  }
};
