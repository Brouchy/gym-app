/**
 * Genera e imprime una credencial con datos del miembro
 * y un código de barras simulado con CSS
 * @param {Object} miembro - Datos del miembro
 */
export const imprimirCredencial = (miembro) => {
  // Datos del miembro
  const nombre = miembro.nombre || 'No especificado';
  const dniRaw = String(miembro.dni || '');
  const direccion = miembro.direccion || 'Sin dirección';
  const idSocio = miembro.id || 'N/A';
  const foto = miembro.foto || 'https://via.placeholder.com/100x100?text=Foto';

  // Extender DNI añadiendo ceros al final hasta longitud mínima 12
  let digits = dniRaw.replace(/\D/g, '');
  while (digits.length < 12) digits = digits + '0';

  // Eliminar modal previo si existe
  const prev = document.getElementById('credencial-modal');
  if (prev) prev.remove();

  const modal = document.createElement('div');
  modal.id = 'credencial-modal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.background = 'rgba(0,0,0,0.6)';
  modal.style.zIndex = '2000';

  modal.innerHTML = `
    <div style="background:white; width:520px; border-radius:10px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,0.4);">
      <div style="padding:10px 14px; text-align:center; background:#ffffff; border-bottom:1px solid #e5e7eb;">
        <strong style="font-size:1.05rem; color:#111827;">Gimnasio Cuerpo Sano</strong>
      </div>
      <div style="display:flex; gap:12px; padding:14px; align-items:center;">
        <img src="${foto}" style="width:100px;height:100px;border-radius:6px;object-fit:cover;border:1px solid #9ca3af;background:#e5e7eb;" />
        <div style="flex:1;color:#111827;font-family:Poppins,Arial,sans-serif;">
          <div style="font-weight:700;font-size:1rem;margin-bottom:6px;">${nombre}</div>
          <div style="font-size:0.92rem;">DNI: ${dniRaw}</div>
          <div style="font-size:0.92rem;">Dirección: ${direccion}</div>
          <div style="font-size:0.92rem;">N° Socio: ${idSocio}</div>
        </div>
      </div>
      <div style="padding:12px 14px; border-top:1px solid #e5e7eb; text-align:center;">
        <div class="barcode-box" style="display:flex;align-items:center;justify-content:center;padding:6px;">
          <svg id="cred-barcode-svg" aria-label="Código de barras" style="width:80%;height:56px;display:block"></svg>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px; justify-content:center;">
          <button id="cred-print" style="background:#FF6B35;color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Imprimir</button>
          <button id="cred-cerrar" style="background:#efefef;color:#111;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Añadir estilos inline específicos para la modal que fuerzan colores del SVG
  // y evitan que el tema oscuro del app sobrescriba los fills/strokes.
  try {
    if (!document.getElementById('cred-barcode-override')) {
      const css = document.createElement('style');
      css.id = 'cred-barcode-override';
      css.innerHTML = `#credencial-modal svg#cred-barcode-svg, #credencial-modal svg#cred-barcode-svg * { fill: #111827 !important; stroke: #111827 !important; color:#111827 !important; opacity:1 !important; filter:none !important; mix-blend-mode:normal !important; }`;
      document.head.appendChild(css);
    }
  } catch (e) {}

  // Renderizar JsBarcode en el modal: usar window.JsBarcode (si existe) o inyectar CDN.
  const renderBarcode = () => {
    try {
      const svg = modal.querySelector('#cred-barcode-svg');
      if (window.JsBarcode) {
        try {
          window.JsBarcode(svg, digits, {
            format: 'CODE39',
            displayValue: true,
            fontOptions: 'bold',
            fontSize: 12,
            height: 48,
            width: 3,
            margin: 6,
            lineColor: '#111827',
            background: '#ffffff'
          });

          // Force inline styles/attributes so dark theme CSS from the app
          // doesn't override the SVG when shown or printed.
          try {
            if (svg) {
              svg.style.background = '#ffffff';
              svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
              const children = svg.querySelectorAll('*');
              children.forEach((el) => {
                try {
                  if (el.tagName.toLowerCase() === 'text') {
                    el.setAttribute('fill', '#111827');
                    el.style.fill = '#111827';
                  } else {
                    el.setAttribute('fill', '#111827');
                    el.setAttribute('stroke', '#111827');
                    el.style.fill = '#111827';
                    el.style.stroke = '#111827';
                  }
                } catch (_) {}
              });
            }
          } catch (_) {}
        } catch (e) {
          const box = modal.querySelector('.barcode-box');
          if (box) box.textContent = digits;
        }
      } else {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
        s.onload = () => { try { renderBarcode(); } catch(e){} };
        s.onerror = () => {
          const box = modal.querySelector('.barcode-box');
          if (box) box.textContent = digits;
        };
        document.head.appendChild(s);
      }
    } catch (err) {
      console.error('Error rendering barcode in modal', err);
      const box = modal.querySelector('.barcode-box');
      if (box) box.textContent = digits;
    }
  };
  renderBarcode();

  // Handlers
  modal.querySelector('#cred-cerrar').addEventListener('click', () => modal.remove());
  modal.querySelector('#cred-print').addEventListener('click', () => {
    const printWin = window.open('', '_blank', 'width=700,height=500');
    if (!printWin) { alert('No se pudo abrir la ventana de impresión. Revisa tu bloqueador de popups.'); return; }

    // Embed SVG markup into print window to preserve sharp barcode
    const svg = modal.querySelector('#cred-barcode-svg');
    const svgHtml = svg ? svg.outerHTML : `<div style="text-align:center;padding:12px">${digits}</div>`;

    const card = modal.querySelector(':scope > div');
    let cardHtml = card ? card.outerHTML : modal.innerHTML;
    cardHtml = cardHtml.replace(/<div[^>]*class=["']?barcode-box["']?[^>]*>[\s\S]*?<\/div>/i, `<div style="text-align:center;padding:6px">${svgHtml}</div>`);

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Credencial de ${nombre}</title><style>body{margin:0;padding:8px;font-family:Poppins,Arial,sans-serif;} .cred{background:white;width:9.5cm;height:6cm;border-radius:10px;padding:0;} svg{max-width:100%;height:auto;}</style></head><body>` + cardHtml + `</body></html>`;
    printWin.document.write(html);
    setTimeout(() => { try { printWin.print(); printWin.close(); } catch(e){} }, 500);
  });
};
