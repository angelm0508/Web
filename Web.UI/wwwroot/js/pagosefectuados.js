$(function () {
    // Escapa texto de usuario para interpolarlo en HTML. Solo al pintar; para buscar y ordenar se devuelve el texto plano.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');
    const textoSeguro = (d, t) => t === 'display' ? escapar(d) : (d || '');

    const tabla = $('#tblPagosEfectuados').DataTable({
        ajax: { url: '/PagosEfectuados/ObtenerTodos', dataSrc: App.dataSrcTabla },
        order: [[0, 'desc']],
        columns: [
            { data: 'numDoc' },
            { data: 'fechaDoc', render: (d, t) => d ? (t === 'display' ? new Date(d).toLocaleDateString() : d) : '' },
            { data: 'nombreSn', render: (d, t, row) => textoSeguro(d || row.codigoSn || '', t) },
            { data: 'totalPago', className: 'text-end', render: (d, t) => d != null ? (t === 'display' ? Number(d).toFixed(2) : d) : '' },
            {
                data: 'cancelado',
                render: (d, t) => t === 'display'
                    ? (d === 'S' ? '<span class="badge text-bg-danger">Cancelado</span>' : '<span class="badge text-bg-success">Vigente</span>')
                    : (d === 'S' ? 'Cancelado' : 'Vigente')
            },
            {
                data: 'entry', orderable: false, searchable: false, className: 'text-end',
                render: entry => `<button class="btn btn-sm btn-outline-primary btn-ver" data-entry="${entry}" title="Ver detalle"><i class="fa-solid fa-eye"></i></button>`
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    $('#filtroEstado').on('change', function () {
        const valor = this.value;
        tabla.column(4).search(valor ? `^${valor}$` : '', true, false).draw();
    });

    async function abrirDetalle(entry) {
        try {
            const html = await $.get('/PagosEfectuados/Detalle', { entry });
            $('#contenidoModal').html(html);
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFormulario')).show();
        } catch (e) {
            App.mostrarError('No se pudo cargar el detalle del pago.');
        }
    }

    $('#tblPagosEfectuados').on('click', '.btn-ver', function () {
        abrirDetalle($(this).data('entry'));
    });

    $('#tblPagosEfectuados tbody').on('dblclick', 'tr', function () {
        const fila = tabla.row(this).data();
        if (fila) abrirDetalle(fila.entry);
    });

    $(document).on('click', '#btnCancelarPago', async function () {
        const $boton = $(this);
        const entry = $boton.data('entry');
        const numDoc = $boton.data('numdoc');
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: '¿Cancelar el pago?',
            text: `El pago ${numDoc} se marcará como cancelado y el saldo de los documentos que cubría volverá a estar pendiente. Esta acción no se puede deshacer.`,
            showCancelButton: true,
            confirmButtonText: 'Cancelar pago',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#dc3545'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.eliminar(`/PagosEfectuados/Cancelar?entry=${encodeURIComponent(entry)}`);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito('Pago cancelado correctamente.');
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
    });
});
