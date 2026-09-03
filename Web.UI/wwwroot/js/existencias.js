$(function () {
    const num = n => (n == null ? '' : Number(n).toFixed(6).replace(/\.?0+$/, '')) || '0';
    const fec = f => (f ? new Date(f).toLocaleDateString() : '');
    const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let articuloFiltro = '';

    const tabla = $('#tblExistencias').DataTable({
        ajax: {
            url: '/Existencias/ObtenerTodos',
            data: d => { if (articuloFiltro) d.articulo = articuloFiltro; },
            dataSrc: App.dataSrcTabla
        },
        columns: [
            { data: 'codArticulo' },
            { data: 'codAlmacen' },
            { data: 'disponible', className: 'text-end', render: num },
            { data: 'comprometido', className: 'text-end', render: num },
            { data: 'pedido', className: 'text-end', render: num },
            { data: 'fechaActualizacion', render: fec },
            {
                data: 'codArticulo', className: 'text-end', orderable: false,
                render: c => `<button class="btn btn-sm btn-outline-primary btn-kardex" data-articulo="${esc(c)}">Ver</button>`
            }
        ]
    });

    App.autocompletar({
        texto: $('#filtroArticuloTexto'),
        oculto: $('#filtroArticulo'),
        lista: $('#filtroArticuloResultados'),
        error: $('#filtroArticuloError'),         // filtro opcional: requerido:false -> nunca se muestra
        requerido: false,                         // sin trampa de foco: texto sin resolver no bloquea el blur
        endpoint: '/Existencias/BuscarArticulos',
        obtenerCodigo: item => item.codigo,
        obtenerEtiqueta: item => `${item.codigo} - ${item.nombre}`,
        onSeleccion: item => { articuloFiltro = item ? item.codigo : ''; tabla.ajax.reload(); },
        minCaracteres: 2
    });

    $('#btnLimpiarFiltro').on('click', function () {
        $('#filtroArticuloTexto').val('');
        $('#filtroArticulo').val('');
        articuloFiltro = '';
        tabla.ajax.reload();
    });

    $('#tblExistencias').on('click', '.btn-kardex', async function () {
        const articulo = $(this).data('articulo');
        $('#kardexArticulo').text(articulo);
        const respuesta = await $.get('/Existencias/Kardex', { codArticulo: articulo });
        const filas = ((respuesta && respuesta.dato) || []).map(m => `
            <tr>
                <td>${fec(m.fecha)}</td>
                <td>${esc(m.tipoDocNombre ?? m.tipoDoc)}</td>
                <td>${m.docEntry}/${m.docLinea}</td>
                <td>${esc(m.codAlmacen)}</td>
                <td class="text-end">${num(m.cantidadEntra)}</td>
                <td class="text-end">${num(m.cantidadSale)}</td>
                <td class="text-end">${num(m.precioUnitario)}</td>
                <td class="text-end">${num(m.costoUnitario)}</td>
                <td class="text-end">${num(m.valorMovimiento)}</td>
                <td class="text-end">${num(m.saldoCantidad)}</td>
                <td class="text-end">${num(m.saldoCostoPromedio)}</td>
                <td class="text-end">${num(m.saldoValor)}</td>
            </tr>`).join('');
        $('#tblKardex tbody').html(filas || '<tr><td colspan="12" class="text-center text-muted">Sin movimientos</td></tr>');
        new bootstrap.Modal('#modalKardex').show();
    });
});
