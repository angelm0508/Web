// Antigüedad de saldos (por cobrar / por pagar). La página indica su lado con data-* en #antiguedad
// (urls de datos y de detalle); cada lado se autoriza en el servidor con su propio permiso.
$(function () {
    const $pagina = $('#antiguedad');
    const urlDatos = $pagina.data('url-datos');
    const urlDetalle = $pagina.data('url-detalle');

    // Escapa texto de usuario para interpolarlo en HTML. Solo al pintar; para buscar y ordenar se devuelve el texto plano.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');
    const dinero = n => Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const r2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

    // Columnas de importe y su resaltado cuando hay saldo vencido (ámbar: 1-60 días; rojo: más de 60).
    const estiloAmbar = 'background-color: var(--color-warning-soft-bg); color: var(--color-warning-soft-fg);';
    const estiloRojo = 'background-color: var(--color-danger-soft-bg); color: var(--color-danger-soft-fg);';
    const importes = [
        { campo: 'vigente', estilo: null },
        { campo: 'de1a30', estilo: estiloAmbar },
        { campo: 'de31a60', estilo: estiloAmbar },
        { campo: 'de61a90', estilo: estiloRojo },
        { campo: 'mas90', estilo: estiloRojo },
        { campo: 'total', estilo: null }
    ];

    const columnasImporte = importes.map(c => ({
        data: c.campo,
        className: 'text-end',
        render: (d, t) => t === 'display' ? dinero(d) : Number(d ?? 0),
        createdCell: c.estilo
            ? (td, valor) => { if (Number(valor) > 0) td.setAttribute('style', c.estilo); }
            : undefined
    }));

    const tabla = $('#tblAntiguedad').DataTable({
        ajax: { url: urlDatos, dataSrc: App.dataSrcTabla },
        order: [[6, 'desc']],
        pageLength: 25,
        columns: [
            {
                data: null,
                render: (d, t, row) => {
                    const texto = `${row.codigoSn} - ${row.nombreSn || ''}`;
                    return t === 'display' ? escapar(texto) : texto;
                }
            },
            ...columnasImporte
        ],
        // Fila de totales: suma de las filas que cumplen el filtro de búsqueda activo.
        footerCallback: function () {
            const api = this.api();
            const filas = api.rows({ search: 'applied' }).data().toArray();
            importes.forEach((c, i) => {
                const suma = r2(filas.reduce((acc, f) => acc + Number(f[c.campo] ?? 0), 0));
                const $celda = $(api.column(i + 1).footer());
                $celda.text(dinero(suma));
                if (c.estilo && suma > 0) $celda.attr('style', c.estilo); else $celda.removeAttr('style');
            });
        },
        createdRow: row => $(row).css('cursor', 'pointer'),
        language: App.datatableEsEs
    });

    async function abrirDetalle(fila) {
        try {
            const html = await $.get(urlDetalle, { codigoSn: fila.codigoSn, nombreSn: fila.nombreSn });
            $('#contenidoModal').html(html);
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFormulario')).show();
        } catch (e) {
            App.mostrarError((e && e.responseText) || 'No se pudo cargar el detalle del socio.');
        }
    }

    $('#tblAntiguedad tbody').on('click', 'tr', function () {
        const fila = tabla.row(this).data();
        if (fila) abrirDetalle(fila);
    });
});
