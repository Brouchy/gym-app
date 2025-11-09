/**
 * Genera e imprime una credencial con datos del miembro
 * y un código de barras simulado con CSS
 * @param {Object} miembro - Datos del miembro
 */
export const imprimirCredencial = (miembro) => {
  // No abrimos la ventana de impresión de inmediato.
  // Primero mostramos un modal de vista previa en la misma página para que el usuario
  // confirme y luego, al presionar "Imprimir", abrimos la ventana de impresión.

  // Recolectar referencia a una posible modal de credencial existente (para restaurar más tarde)
  const existingCredModal = document.getElementById('credencial-modal');
  const _prevDisplay = existingCredModal ? existingCredModal.style.display : null;

  // Código ficticio ya no se usa en la credencial impresa

  // Datos básicos
  // Tipo ya no se mostrará en la credencial impresa
  const tipo = miembro.tipoDeMiembro?.descripcion || '';
  const nombre = miembro.nombre || 'No especificado';
  const dni = miembro.dni || 'Sin DNI';
  const direccion = miembro.direccion || 'Sin dirección';
  const idSocio = miembro.id || 'N/A';
  const foto = miembro.foto || 'https://via.placeholder.com/100x100?text=Foto';
  // Generaremos primero un PNG del código de barras en la página actual y mostraremos
  // un modal de vista previa que incluye la imagen. Al confirmar, abrimos la ventana
  // de impresión con la misma imagen embebida.

  const raw = String(dni || '');
  const digits = raw.replace(/\D/g, '');
  // Generar una versión "alargada" agregando ceros al final para que el código sea visualmente largo
  const padZeros = (s, minLen = 14) => {
    const onlyDigits = String(s || '').replace(/\D/g, '');
    if (!onlyDigits) return '';
    if (onlyDigits.length >= minLen) return onlyDigits;
    return onlyDigits + '0'.repeat(minLen - onlyDigits.length);
  };
  const paddedValue = padZeros(digits || raw, 14);

  // Cargar JsBarcode si no está disponible
  const ensureJsBarcode = () => {
    return new Promise((resolve) => {
      if (window.JsBarcode) return resolve(window.JsBarcode);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
      s.onload = () => resolve(window.JsBarcode);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  };

  const generatePngDataUrl = async (value) => {
    await ensureJsBarcode();
    try {
  const visualWidth = Math.min(480, document.body.clientWidth - 80);
  const visualHeight = 100;
  const scale = 6; // mayor escala para impresión nítida (resolución alta, tamaño visual reducido)
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(visualWidth * scale));
      canvas.height = Math.max(1, Math.floor(visualHeight * scale));
      canvas.style.width = visualWidth + 'px';
      canvas.style.height = visualHeight + 'px';

      const opts = {
        format: 'CODE39',
        displayValue: true,
        fontOptions: 'bold',
        // fuente y barras ajustadas para tamaño visual menor
        fontSize: 10 * scale,
        height: visualHeight * scale,
        width: Math.max(1, Math.floor(3 * scale)),
        margin: Math.max(6, Math.floor(8 * scale)),
        lineColor: '#000000',
        background: '#ffffff'
      };

      if (window.JsBarcode) {
        try {
          window.JsBarcode(canvas, value || '', opts);
          return canvas.toDataURL('image/png');
        } catch (e) {
          // fallthrough
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Construir modal de vista previa en la página actual
  const abrirModalPreview = async () => {
    // si hay una modal propia, eliminarla primero
    const prev = document.getElementById('credencial-modal-preview');
    if (prev) prev.remove();

  const dataUrl = await generatePngDataUrl(paddedValue);

    const modal = document.createElement('div');
    modal.id = 'credencial-modal-preview';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.zIndex = '9999';

  const caja = document.createElement('div');
  caja.style.width = '560px';
    caja.style.maxWidth = '95%';
    caja.style.background = '#fff';
    caja.style.borderRadius = '8px';
    caja.style.padding = '16px';
    caja.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
    caja.style.fontFamily = "'Poppins', Arial, sans-serif";

    caja.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <strong style="font-size:1rem;">Credencial de ${nombre}</strong>
        <div style="font-size:0.85rem;color:#6b7280">${new Date().toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
        <img src="${foto}" alt="${nombre}" style="width:84px;height:84px;border-radius:6px;object-fit:cover;border:1px solid #d1d5db;" />
        <div style="flex:1">
          <div style="font-weight:600">${nombre}</div>
          <div style="color:#374151">DNI: ${dni}</div>
          <div style="color:#374151">Dirección: ${direccion}</div>
          <div style="color:#374151">N° Socio: ${idSocio}</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0;" />
      <div style="text-align:center;margin-bottom:12px">
  <div style="width:100%;max-width:480px;margin:0 auto;">
          ${dataUrl ? `<img id="cred-png" src="${dataUrl}" alt="codigo" style="width:100%;height:auto;display:block;"/>` : `<div style="padding:28px 0;color:#111827">${paddedValue}</div>`}
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
        <button id="cred-cancel" style="background:#efefef;border:1px solid #ddd;padding:8px 12px;border-radius:6px;cursor:pointer">Cancelar</button>
        <button id="cred-print" style="background:#111827;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer">Imprimir</button>
      </div>
    `;

    modal.appendChild(caja);
    document.body.appendChild(modal);

    // Listeners
    modal.querySelector('#cred-cancel').onclick = () => {
      modal.remove();
    };

    modal.querySelector('#cred-print').onclick = async () => {
      // Remover la modal de preview (por UX) y abrir la ventana de impresión con la misma imagen
      modal.remove();
      // Antes de abrir la ventana, remover otras modales abiertas para evitar overlays
      const removedModals = [];
      const selector = '[class*="modal"], [id^="modal-"]';
      document.querySelectorAll(selector).forEach((node) => {
        if (!node || !node.parentNode) return;
        // no removemos la modal de preview (ya removida)
        if (node.id === 'credencial-modal-preview') return;
        removedModals.push({ node, parent: node.parentNode, nextSibling: node.nextSibling });
        node.parentNode.removeChild(node);
      });

      // Abrir popup de impresión y escribir el HTML con la imagen embebida
      const popup = window.open('', '_blank', 'width=1100,height=900');
      if (!popup) {
        // restaurar modales si no se pudo abrir
        removedModals.forEach((m) => { if (m.parent) m.parent.insertBefore(m.node, m.nextSibling || null); });
        return;
      }

      const printHtml = `
        <html>
          <head>
            <title>Credencial de ${nombre}</title>
            <style>
              body{background:white;color:#111827;margin:8px;font-family:'Poppins',Arial,sans-serif}
              .credencial{width:9.5cm;height:6cm;border:1px solid #d1d5db;padding:8px;box-sizing:border-box}
              .enc{font-weight:600;text-align:center;margin-bottom:6px}
              .cuerpo{display:flex;gap:8px;align-items:center}
              .foto{width:100px;height:100px;object-fit:cover;border-radius:6px;border:1px solid #d1d5db}
              .barcode{margin-top:8px;text-align:center}
              @media print{body{margin:0}.credencial{border:none}}
            </style>
          </head>
          <body>
            <div class="credencial">
              <div class="enc">Gimnasio Cuerpo Sano</div>
              <div class="cuerpo">
                <img class="foto" src="${foto}" alt="${nombre}" />
                <div>
                  <div style="font-weight:600">${nombre}</div>
                  <div>DNI: ${dni}</div>
                  <div>Dirección: ${direccion}</div>
                  <div>N° Socio: ${idSocio}</div>
                </div>
              </div>
              <div class="barcode">
                ${dataUrl ? `<img src="${dataUrl}" style="width:90%;max-width:480px;display:block;margin:8px auto;" alt="codigo"/>` : `<div style="margin-top:16px;text-align:center">${paddedValue}</div>`}
              </div>
            </div>
            <script>
              try{window.onafterprint = function(){ try{ if(window.opener && window.opener.postMessage) window.opener.postMessage({type:'credencial:printed'},'*'); }catch(e){} try{ window.close(); }catch(e){} }; }catch(e){}
            </script>
          </body>
        </html>
      `;

      popup.document.write(printHtml);

      // Escuchar mensaje para restaurar modales
      const restoreRemovedModals = () => {
        try { removedModals.forEach((m) => { if (m.parent) m.parent.insertBefore(m.node, m.nextSibling || null); });
              if (existingCredModal) existingCredModal.style.display = _prevDisplay || 'flex'; } catch(e){}
      };

      const onMsg = (ev) => { try { if (ev?.data?.type === 'credencial:printed') { restoreRemovedModals(); window.removeEventListener('message', onMsg); clearInterval(poll); } } catch(e){} };
      window.addEventListener('message', onMsg);

      const poll = setInterval(() => { try { if (popup.closed) { restoreRemovedModals(); clearInterval(poll); window.removeEventListener('message', onMsg); } } catch(e){} }, 500);

      // Forzar focus y print con retardo para que la imagen termine de cargarse
      setTimeout(() => { try { popup.focus(); popup.print(); } catch(e){ setTimeout(()=>{ try{ popup.print(); }catch(_){} },500); } }, 350);
    };
  };

  // Abrir preview modal (async)
  abrirModalPreview();
};
