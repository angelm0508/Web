$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosOrdenesServicio');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true, copiarA: {} };
    const destinosCopia = [
        permisos.copiarA && permisos.copiarA.factura && { nombre: 'Factura de venta', url: '/Facturas' }
    ].filter(Boolean);

    // Escapa el HTML del texto de usuario antes de interpolarlo en el render (display) y en atributos data-*.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');

    // Estados de la orden y a cuál avanza cada uno.
    const ESTADOS = {
        R: { nombre: 'Recibida', clase: 'text-bg-secondary', siguiente: 'P' },
        P: { nombre: 'En proceso', clase: 'text-bg-primary', siguiente: 'T' },
        T: { nombre: 'Terminada', clase: 'text-bg-warning', siguiente: 'E' },
        E: { nombre: 'Entregada', clase: 'text-bg-success', siguiente: null }
    };

    function insigniaEstado(row) {
        if (row && row.cancelado === 'S') return '<span class="badge text-bg-danger">Cancelada</span>';
        const e = ESTADOS[row && row.estadoServicio];
        return e ? `<span class="badge ${e.clase}">${e.nombre}</span>` : '';
    }

    const tabla = $('#tblOrdenesServicio').DataTable({
        ajax: { url: '/OrdenesServicio/ObtenerTodos', dataSrc: App.dataSrcTabla, data: d => { d.estado = $('#filtroEstado').val() || ''; } },
        order: [[0, 'desc']],
        columns: [
            { data: 'numDoc' },
            { data: 'fechaDoc', render: d => d ? new Date(d).toLocaleDateString() : '' },
            { data: 'nombreSn', render: (d, t, row) => { const v = d || row.codigoSn || ''; return t === 'display' ? escapar(v) : v; } },
            {
                data: 'placa',
                render: (d, t, row) => {
                    if (!d) return '';
                    if (t !== 'display') return `${d}${row.motoDescripcion ? ' ' + row.motoDescripcion : ''}`;
                    return `${escapar(d)}${row.motoDescripcion ? ` <span class="text-muted small">${escapar(row.motoDescripcion)}</span>` : ''}`;
                }
            },
            { data: 'nombreMecanico', render: (d, t) => t === 'display' ? escapar(d) : (d || '') },
            { data: 'estadoServicio', render: (d, t, row) => insigniaEstado(row) },
            { data: 'totalDoc', render: d => d != null ? Number(d).toFixed(2) : '' },
            {
                data: 'entry', orderable: false, searchable: false, className: 'text-end',
                render: (entry, t, row) => {
                    const cancelada = !row || row.cancelado === 'S';
                    const estado = ESTADOS[row && row.estadoServicio];
                    const facturable = !cancelada && (row.estadoServicio === 'T' || row.estadoServicio === 'E');
                    const siguiente = estado && estado.siguiente ? ESTADOS[estado.siguiente] : null;
                    const puedeAvanzar = permisos.actualizar && !cancelada && siguiente;
                    return `
                        ${facturable ? App.botonCopiarA(70, entry, destinosCopia) : ''}
                        ${puedeAvanzar ? `<button class="btn btn-sm btn-outline-success btn-avanzar" data-entry="${escapar(entry)}" data-estado="${escapar(estado.siguiente)}" title="Pasar a ${siguiente.nombre}"><i class="fa-solid fa-forward-step"></i></button>` : ''}
                        <button class="btn btn-sm btn-outline-primary btn-editar" data-entry="${escapar(entry)}"${permisos.actualizar ? '' : ' title="Ver"'}><i class="fa-solid ${permisos.actualizar ? 'fa-pen' : 'fa-eye'}"></i></button>
                    `;
                }
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    $('#filtroEstado').on('change', recargarTabla);

    $('#tblOrdenesServicio').on('click', '.btn-avanzar', async function () {
        const entry = $(this).data('entry');
        const estado = $(this).data('estado');
        const confirmado = await Swal.fire({
            icon: 'question',
            title: '¿Cambiar el estado de la orden?',
            text: `La orden pasará a "${ESTADOS[estado].nombre}". No se puede volver a un estado anterior.`,
            showCancelButton: true,
            confirmButtonText: 'Cambiar',
            cancelButtonText: 'Cancelar'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        const respuesta = await App.enviarJson(`/OrdenesServicio/CambiarEstado?entry=${entry}&estado=${estado}`, 'POST', {});
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito(`Orden ${ESTADOS[estado].nombre.toLowerCase()}.`);
        recargarTabla();
    });
});
