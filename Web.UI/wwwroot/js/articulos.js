$(function () {
    const tabla = $('#tblArticulos').DataTable({
        ajax: { url: '/Articulos/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'precioUnitario', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'cantDisponible', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'codigo', orderable: false, className: 'text-end',
                render: codigo => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${codigo}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-codigo="${codigo}"><i class="fa-solid fa-trash"></i></button>
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        new bootstrap.Modal('#modalFormulario').show();
    }

    $('#tblArticulos').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/Articulos/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblArticulos').on('click', '.btn-eliminar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await App.confirmarEliminar(`Se eliminará el artículo "${codigo}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Articulos/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Artículo eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarArticulo', async function () {
        const codigo = $(this).data('codigo');
        const datos = App.recolectarFormulario('#formArticulo');

        const respuesta = await App.enviarJson(`/Articulos/Editar?codigo=${encodeURIComponent(codigo)}`, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito('Artículo actualizado correctamente.');
        recargarTabla();
    });

    // --- Serie de numeración para generar el código del artículo (solo en la página "Nuevo") ---

    function inicializarSerieArticulo() {
        const $sel = $('#selectSerieArticulo');
        if ($sel.length === 0) return;

        const datosEl = document.getElementById('datosSeriesArticulo');
        const series = datosEl ? (JSON.parse(datosEl.textContent) || []) : [];

        $sel.html('');
        let serieManual = null;
        series.forEach(s => {
            const serie = s.serie ?? s.Serie;
            const nombre = s.nombreSerie ?? s.NombreSerie;
            const manual = s.manual ?? s.Manual;
            if (manual === 'S' && serieManual === null) serieManual = serie;
            $sel.append(`<option value="${serie}" data-manual="${manual}">${nombre}</option>`);
        });

        // Se preselecciona "Manual" por defecto para no obligar a elegir en cada alta.
        if (serieManual !== null) $sel.val(serieManual);

        actualizarCodigoSegunSerieArticulo();
    }

    function esSerieManualArticulo() {
        const $sel = $('#selectSerieArticulo');
        if ($sel.length === 0 || !$sel.val()) return true;
        return $sel.find('option:selected').data('manual') === 'S';
    }

    function actualizarCodigoSegunSerieArticulo() {
        const $codigo = $('#Codigo');
        if ($codigo.length === 0) return;

        if (esSerieManualArticulo()) {
            $codigo.prop('disabled', false).attr('placeholder', '');
        } else {
            $codigo.val('').prop('disabled', true).attr('placeholder', 'Se generará al guardar');
        }
    }

    $(document).on('change', '#selectSerieArticulo', actualizarCodigoSegunSerieArticulo);

    inicializarSerieArticulo();

    // --- Checklist "Recomendado completar" de la página de creación ---

    function actualizarChecklistArticulo() {
        const $lista = $('#listaChecklistArticulo');
        if ($lista.length === 0) return;

        $lista.find('[data-check]').each(function () {
            const campo = $(this).data('check');
            const tieneValor = !!$(`#${campo}`).val();
            $(this).find('i')
                .toggleClass('fa-regular fa-circle text-muted', !tieneValor)
                .toggleClass('fa-solid fa-circle-check text-success', tieneValor);
        });
    }

    $(document).on('input change', '#Nombre, #CodigoGrupo, #PrecioUnitario, #AlmacenDefecto', actualizarChecklistArticulo);
    actualizarChecklistArticulo();

    // --- Guardar desde la página completa "Nuevo artículo" ---

    $(document).on('click', '#btnGuardarArticuloPagina', async function () {
        const serieSeleccionada = $('#selectSerieArticulo').val();
        if (!serieSeleccionada) {
            App.mostrarError('Debes seleccionar una serie.');
            return;
        }

        // La vista previa del campo Código (deshabilitado cuando la serie no es manual) es solo
        // cosmética -- el código real lo calcula y asigna la API al momento de guardar, así que ya
        // no se envía nada calculado aquí para series no manuales.
        const datos = App.recolectarFormulario('#formArticuloCrear');
        datos.Serie = serieSeleccionada;

        const respuesta = await App.enviarJson('/Articulos/Crear', 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        await App.mostrarExito(`Artículo "${respuesta.codigo}" creado correctamente.`);
        window.location.href = '/Articulos';
    });
});
