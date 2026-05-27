document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('compras-container');
    const btnNuevaCompra = document.getElementById('btn-nueva-compra');
    const inputCotizacion = document.getElementById('cotizacion');

    let contadorCompras = 0;

    const formatoUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const formatoARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    function crearCompra() {
        contadorCompras++;
        const id = contadorCompras;

        const cartDiv = document.createElement('div');
        cartDiv.className = 'cart-card';
        cartDiv.innerHTML = `
            <div class="cart-header">
                <div class="cart-header-left">
                    <span class="cart-icon">📦</span>
                    <h2>Lista de Compra #${id}</h2>
                </div>
                <button class="btn-delete-cart" onclick="eliminarCompra(this)">🗑 Eliminar</button>
            </div>

            <div class="productos-section">
                <table class="productos-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="col-num">Precio (USD)</th>
                            <th class="col-peso">Peso (g)</th>
                            <th class="col-accion"></th>
                        </tr>
                    </thead>
                    <tbody id="tbody-${id}"></tbody>
                </table>
                <button class="btn-add-product" onclick="agregarProducto(${id})">+ Agregar Producto</button>
            </div>

            <div class="config-section">
                <h3 class="section-title">⚙️ Gastos del Pedido</h3>
                <div class="input-grid">
                    <div class="input-group">
                        <label>Envío Internacional (USD)</label>
                        <div class="input-hint">Cotizado para 5 kg</div>
                        <input type="number" class="val-envio" value="53" step="1" oninput="calcularTotal(${id})">
                    </div>
                    <div class="input-group">
                        <label>Impuestos Aduana (ARS)</label>
                        <input type="number" class="val-impuestos" value="40000" step="100" oninput="calcularTotal(${id})">
                    </div>
                    <div class="input-group">
                        <label>Tasa Correo (ARS)</label>
                        <input type="number" class="val-tasa" value="7000" step="100" oninput="calcularTotal(${id})">
                    </div>
                </div>
            </div>

            <div class="desglose-section">
                <h3 class="section-title">📊 Desglose por Producto</h3>
                <p class="desglose-nota">El envío e impuestos se distribuyen proporcionalmente según el peso de cada producto.</p>
                <div class="desglose-scroll">
                    <table class="desglose-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio base</th>
                                <th>Peso</th>
                                <th>% envío</th>
                                <th>Envío asignado</th>
                                <th>Impuestos asignados</th>
                                <th>Total (USD)</th>
                                <th>Total (ARS)</th>
                            </tr>
                        </thead>
                        <tbody class="tbody-desglose"></tbody>
                    </table>
                </div>
            </div>

            <div class="results-section">
                <div class="chips-row">
                    <div class="chip chip-blue">
                        <div class="chip-label">🛒 Productos</div>
                        <div class="chip-value res-prod-usd">USD 0.00</div>
                    </div>
                    <div class="chip chip-purple">
                        <div class="chip-label">✈️ Envío</div>
                        <div class="chip-value res-env-usd">USD 0.00</div>
                    </div>
                    <div class="chip chip-orange">
                        <div class="chip-label">🏛 Gastos locales</div>
                        <div class="chip-value res-loc-ars">ARS 0.00</div>
                    </div>
                </div>
                <div class="gran-total">
                    <div class="gran-total-label">💰 Costo Final Total</div>
                    <div class="final-prices">
                        <span class="total-ars">ARS 0,00</span>
                        <span class="total-sep">·</span>
                        <span class="total-usd">USD 0.00</span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(cartDiv);
        agregarProducto(id);
    }

    window.agregarProducto = function(cartId, nombre = '', precio = '', peso = '') {
        const tbody = document.getElementById(`tbody-${cartId}`);
        const tr = document.createElement('tr');
        tr.className = 'product-row';
        tr.innerHTML = `
            <td><input type="text" class="val-nombre" placeholder="Ej: Remera negra" value="${nombre}" oninput="calcularTotal(${cartId})"></td>
            <td><input type="number" class="val-precio" placeholder="0.00" value="${precio}" step="0.01" oninput="calcularTotal(${cartId})"></td>
            <td class="td-peso"><input type="number" class="val-peso" placeholder="0" value="${peso}" step="1" min="0" oninput="calcularTotal(${cartId})"><span class="peso-unit">g</span></td>
            <td><button class="btn-delete-prod" onclick="eliminarProducto(this, ${cartId})" title="Quitar">✕</button></td>
        `;
        tbody.appendChild(tr);
        calcularTotal(cartId);
    };

    window.eliminarProducto = function(btn, cartId) {
        btn.closest('tr').remove();
        calcularTotal(cartId);
    };

    window.eliminarCompra = function(btn) {
        btn.closest('.cart-card').remove();
    };

    window.calcularTotal = function(cartId) {
        const cartDiv = document.getElementById(`tbody-${cartId}`).closest('.cart-card');
        const cotizacion = parseFloat(inputCotizacion.value) || 1440;

        // Recolectar datos de cada producto
        const rows = cartDiv.querySelectorAll('.product-row');
        const productos = [];
        rows.forEach(row => {
            const nombre = row.querySelector('.val-nombre').value || 'Producto';
            const precio = parseFloat(row.querySelector('.val-precio').value) || 0;
            const peso   = parseFloat(row.querySelector('.val-peso').value)  || 0;
            productos.push({ nombre, precio, peso });
        });

        const subtotalUSD = productos.reduce((s, p) => s + p.precio, 0);
        const pesoTotal   = productos.reduce((s, p) => s + p.peso, 0);
        const n = productos.length;

        const envioUSD      = parseFloat(cartDiv.querySelector('.val-envio').value)      || 0;
        const impuestosARS  = parseFloat(cartDiv.querySelector('.val-impuestos').value)  || 0;
        const tasaARS       = parseFloat(cartDiv.querySelector('.val-tasa').value)       || 0;
        const totalLocalARS = impuestosARS + tasaARS;

        // Calcular desglose por producto
        const desglose = productos.map(p => {
            // Si hay pesos cargados usamos %, sino distribuimos equitativamente
            const pct = pesoTotal > 0 ? p.peso / pesoTotal : (n > 0 ? 1 / n : 0);
            const envioShare     = envioUSD * pct;
            const impuestosShare = totalLocalARS * pct;
            const totalUSD       = p.precio + envioShare + (impuestosShare / cotizacion);
            const totalARS       = (p.precio + envioShare) * cotizacion + impuestosShare;
            return { ...p, pct, envioShare, impuestosShare, totalUSD, totalARS };
        });

        // Totales generales
        const granTotalARS = (subtotalUSD + envioUSD) * cotizacion + totalLocalARS;
        const granTotalUSD = subtotalUSD + envioUSD + (totalLocalARS / cotizacion);

        // Actualizar chips de resumen
        cartDiv.querySelector('.res-prod-usd').textContent = formatoUSD.format(subtotalUSD);
        cartDiv.querySelector('.res-env-usd').textContent  = formatoUSD.format(envioUSD);
        cartDiv.querySelector('.res-loc-ars').textContent  = formatoARS.format(totalLocalARS);
        cartDiv.querySelector('.total-ars').textContent    = formatoARS.format(granTotalARS);
        cartDiv.querySelector('.total-usd').textContent    = formatoUSD.format(granTotalUSD);

        // Poblar tabla de desglose
        const tbodyDesglose = cartDiv.querySelector('.tbody-desglose');
        tbodyDesglose.innerHTML = '';
        desglose.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.className = i % 2 === 0 ? 'row-even' : 'row-odd';
            tr.innerHTML = `
                <td class="td-nombre">${p.nombre}</td>
                <td>${formatoUSD.format(p.precio)}</td>
                <td>${p.peso > 0 ? p.peso + ' g' : '<span class="sin-peso">sin peso</span>'}</td>
                <td><span class="badge-pct">${(p.pct * 100).toFixed(1)}%</span></td>
                <td>${formatoUSD.format(p.envioShare)}</td>
                <td>${formatoARS.format(p.impuestosShare)}</td>
                <td class="td-total-usd">${formatoUSD.format(p.totalUSD)}</td>
                <td class="td-total-ars">${formatoARS.format(p.totalARS)}</td>
            `;
            tbodyDesglose.appendChild(tr);
        });
    };

    inputCotizacion.addEventListener('input', () => {
        document.querySelectorAll('.cart-card').forEach(cart => {
            const tbody = cart.querySelector('tbody[id^="tbody-"]');
            if (tbody) calcularTotal(tbody.id.split('-')[1]);
        });
    });

    crearCompra();
    btnNuevaCompra.addEventListener('click', crearCompra);
});