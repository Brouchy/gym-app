/**
 * Genera e imprime una credencial con datos del miembro
 * y un código de barras simulado con CSS
 * @param {Object} miembro - Datos del miembro
 */
export const imprimirCredencial = (miembro) => {
  const ventana = window.open('', '_blank', 'width=700,height=500');
  if (!ventana) return;

  // Código ficticio del socio, estilo CS-123456
  const codigoFicticio = `CS-${String(Math.floor(100000 + Math.random() * 900000))}`;

  // Datos básicos
  const tipo = miembro.tipoDeMiembro?.descripcion || 'General';
  const nombre = miembro.nombre || 'No especificado';
  const dni = miembro.dni || 'Sin DNI';
  const direccion = miembro.direccion || 'Sin dirección';
  const idSocio = miembro.id || 'N/A';
  const foto = miembro.foto || 'https://via.placeholder.com/100x100?text=Foto';

  ventana.document.write(`
    <html>
      <head>
        <title>Credencial de ${nombre}</title>
        <style>
          body {
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            font-family: 'Poppins', Arial, sans-serif;
          }

          .credencial {
            background: white;
            width: 9.5cm;
            height: 6cm;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid #d1d5db;
          }

          /* Franja superior tipo encabezado institucional */
          .encabezado {
            background: #111827;
            color: white;
            text-align: center;
            padding: 6px 0;
            font-size: 0.9rem;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          /* Zona con foto + datos */
          .cuerpo {
            display: flex;
            flex: 1;
            align-items: center;
            justify-content: flex-start;
            padding: 0.8rem 1rem;
            gap: 1rem;
          }

          .foto {
            width: 100px;
            height: 100px;
            border-radius: 6px;     /* cuadrada con esquinas suaves */
            object-fit: cover;
            border: 1px solid #9ca3af;
            background: #e5e7eb;
          }

          .info {
            flex: 1;
            font-size: 0.8rem;
            color: #1f2937;
            line-height: 1.3;
          }

          .info p {
            margin: 4px 0;
          }

          .info strong {
            color: #000;
            font-weight: 600;
          }

          /* Footer con el código de barras simulado */
          .footer-barcode {
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
            padding: 0.5rem 0.7rem 0.6rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
          }

          /* Contenedor del "código de barras" visual */
          .barcode-box {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            height: 45px;
            margin-bottom: 4px;
            /* ancho fijo para que siempre parezca consistente */
            width: 80%;
            max-width: 220px;
            background: white;
            padding: 4px 6px;
          }

          /* Cada barrita es un div negro vertical.
             Vamos a mezclar anchos diferentes para que parezca real. */
          .bar {
            background: #111827;
            height: 100%;
            margin: 0 1px;
            border-radius: 1px;
          }

          .bar.thin   { width: 2px;  }
          .bar.mid    { width: 3px;  }
          .bar.thick  { width: 4px;  }

          /* Texto debajo del código simulado */
          .codigo-texto {
            font-size: 0.7rem;
            color: #374151;
            letter-spacing: 1px;
            font-family: 'Courier New', monospace;
          }

          @media print {
            body {
              margin: 0;
              background: white;
            }
            .credencial {
              box-shadow: none;
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="credencial">
          <div class="encabezado">Gimnasio Cuerpo Sano</div>

          <div class="cuerpo">
            <img src="${foto}" alt="${nombre}" class="foto" />
            <div class="info">
              <p><strong>${nombre}</strong></p>
              <p>DNI: ${dni}</p>
              <p>Dirección: ${direccion}</p>
              <p>Tipo: ${tipo}</p>
              <p>N° Socio: ${idSocio}</p>
            </div>
          </div>

          <div class="footer-barcode">
            <div class="barcode-box">
              <!-- Secuencia de barras simulada -->
              <div class="bar thick"></div>
              <div class="bar thin"></div>
              <div class="bar mid"></div>
              <div class="bar thin"></div>
              <div class="bar thick"></div>
              <div class="bar thin"></div>
              <div class="bar thin"></div>
              <div class="bar mid"></div>
              <div class="bar thick"></div>
              <div class="bar thin"></div>
              <div class="bar mid"></div>
              <div class="bar thick"></div>
              <div class="bar thin"></div>
              <div class="bar thin"></div>
              <div class="bar mid"></div>
              <div class="bar thick"></div>
              <div class="bar thin"></div>
              <div class="bar mid"></div>
              <div class="bar thick"></div>
              <div class="bar thin"></div>
              <div class="bar thin"></div>
              <div class="bar mid"></div>
              <div class="bar thick"></div>
              <div class="bar thin"></div>
            </div>
            <div class="codigo-texto">${codigoFicticio}</div>
          </div>
        </div>

        <script>
          window.onload = () => {
            // Abrimos diálogo de impresión automáticamente
            window.print();
          };
        </script>
      </body>
    </html>
  `);
};
