/**
 * Genera e imprime un ticket de pago
 * @param {Object} datosPago - Datos del pago
 * @param {Object} miembro - Datos del miembro
 * @param {Object} membresia - Datos de la membresía
 * @param {Object} tipoMiembro - Tipo de miembro con descuento
 */
export const imprimirTicket = (datosPago, miembro, membresia, tipoMiembro) => {
  const ventana = window.open('', '_blank', 'width=600,height=700');
  if (!ventana) return;

  const fechaPago = new Date(datosPago.fechaPago).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const descuento = tipoMiembro?.porcentajeDescuento || 0;
  const costoBase = membresia.costoBase || 0;
  const descuentoAplicado = costoBase - datosPago.monto;
  const metodoPago = datosPago.metodoPago || 'N/A';

  ventana.document.write(`
    <html>
      <head>
        <title>Ticket de Pago - ${miembro.nombre}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #f3f4f6;
            display: flex;
            /* Alineamos horizontalmente al centro pero posicionamos
               el contenido hacia el inicio vertical para que la
               parte superior del ticket siempre sea visible en la
               vista previa/impresión. */
            align-items: flex-start;
            justify-content: center;
            min-height: 100vh;
            padding: 30px 20px 20px 20px; /* más espacio arriba */
            font-family: 'Arial', sans-serif;
          }
          .ticket {
            background: white;
            width: 100%;
            max-width: 500px;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            /* Reducir tamaño visual del ticket al 60% (40% más pequeño) */
            transform: scale(0.6);
            transform-origin: top center;
            margin: 0 auto; /* centrar horizontalmente */
          }
          .encabezado {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .encabezado h1 {
            color: #111827;
            font-size: 1.5rem;
            margin-bottom: 5px;
          }
          .encabezado p {
            color: #666;
            font-size: 0.9rem;
          }
          .seccion {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
          }
          .seccion:last-child {
            border-bottom: none;
          }
          .seccion h3 {
            color: #111827;
            font-size: 1rem;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9rem;
          }
          .info-line strong {
            color: #111827;
          }
          .info-line span {
            color: #666;
          }
          .total {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
          }
          .total .info-line {
            font-size: 1.1rem;
            font-weight: bold;
            color: #111827;
          }
          .descuento {
            color: #10b981;
          }
          .metodo-pago {
            background: #e0f2fe;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            font-weight: bold;
            color: #0369a1;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px dashed #e5e7eb;
            color: #666;
            font-size: 0.85rem;
          }
          /* Reducir márgenes de página para evitar recortes en la vista
             previa de impresión y asegurar que la parte superior se vea. */
          @page {
            margin: 10mm;
          }

          @media print {
            body {
              padding: 10mm; /* espacio seguro para la impresión */
              background: white;
              display: block; /* evitar centrado flex en impresión */
            }
            .ticket {
              box-shadow: none;
              border: none;
              /* Al imprimir, evitamos el transform para que la impresora
                 respete dimensiones y márgenes correctamente. */
              transform: none;
              width: 60%;
              max-width: 320px;
              margin: 0 auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="encabezado">
            <h1>Gimnasio Cuerpo Sano</h1>
            <p>Ticket de Pago</p>
          </div>

          <div class="seccion">
            <h3>Datos del Miembro</h3>
            <div class="info-line">
              <strong>Nombre:</strong>
              <span>${miembro.nombre || 'N/A'}</span>
            </div>
            <div class="info-line">
              <strong>DNI:</strong>
              <span>${miembro.dni || 'N/A'}</span>
            </div>
            <div class="info-line">
              <strong>Email:</strong>
              <span>${miembro.email || 'N/A'}</span>
            </div>
          </div>

          <div class="seccion">
            <h3>Detalles de la Membresía</h3>
            <div class="info-line">
              <strong>Plan:</strong>
              <span>${membresia.nombrePlan || 'N/A'}</span>
            </div>
            <div class="info-line">
              <strong>Duración:</strong>
              <span>${membresia.duracionEnDias || 0} días</span>
            </div>
            ${tipoMiembro ? `
            <div class="info-line">
              <strong>Tipo de Miembro:</strong>
              <span>${tipoMiembro.descripcion}</span>
            </div>
            ` : ''}
          </div>

          <div class="seccion">
            <h3>Resumen de Pago</h3>
            <div class="info-line">
              <strong>Costo Base:</strong>
              <span>$${costoBase.toFixed(2)}</span>
            </div>
            ${descuento > 0 ? `
            <div class="info-line descuento">
              <strong>Descuento (${descuento}%):</strong>
              <span>-$${descuentoAplicado.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total">
              <div class="info-line">
                <strong>Total Pagado:</strong>
                <span>$${datosPago.monto.toFixed(2)}</span>
              </div>
            </div>
            <div class="metodo-pago">
              Método de Pago: ${metodoPago}
            </div>
          </div>

          <div class="seccion">
            <h3>Información del Pago</h3>
            <div class="info-line">
              <strong>Fecha:</strong>
              <span>${fechaPago}</span>
            </div>
            <div class="info-line">
              <strong>N° de Transacción:</strong>
              <span>#${datosPago.id || 'N/A'}</span>
            </div>
          </div>

          <div class="footer">
            <p>Gracias por su pago</p>
            <p>Este ticket es válido como comprobante de pago</p>
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

