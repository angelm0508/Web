$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosArticulos');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true };
    const tabla = $('#tblArticulos').DataTable({
        ajax: { url: '/Articulos/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'articuloInventario', render: d => d === 'N' ? '<span class="badge text-bg-info">Servicio</span>' : 'Artículo' },
            { data: 'precioUnitario', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'cantDisponible', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'codigo', orderable: false, className: 'text-end',
                render: codigo => `
                    ${permisos.actualizar ? `<button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${codigo}"><i class="fa-solid fa-pen"></i></button>` : ''}
                    ${permisos.eliminar ? `<button class="btn btn-sm btn-outline-danger btn-eliminar" data-codigo="${codigo}"><i class="fa-solid fa-trash"></i></button>` : ''}
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    let buscadorAlmacenDefecto = null;

    function abrirModal(html, codigo) {
        $('#contenidoModal').html(html);
        $('#modalFormulario').off('.autocompletar'); // limpia los listeners de la apertura anterior antes de que el buscador registre los suyos
        new bootstrap.Modal('#modalFormulario').show();
        inicializarBuscadorAlmacenDefecto();
        ArticuloAlmacenes.cargar('#inventarioAlmacenes', codigo); // sección "Datos de inventario"
    }

    $('#tblArticulos').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/Articulos/FormularioEditar', { codigo });
        abrirModal(html, codigo);
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

        // Primero se validan las filas de inventario por almacén: si hay errores no se guarda nada.
        if (!ArticuloAlmacenes.validar()) {
            App.mostrarError('Revisa los datos de inventario por almacén: hay filas con errores.');
            return;
        }

        const $boton = $(this).prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(`/Articulos/Editar?codigo=${encodeURIComponent(codigo)}`, 'POST', datos);

            console.log(`Respuesta: ${respuesta.mensaje}`);

            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }

            // El artículo ya quedó guardado; ahora la configuración por almacén (se omite si no hay nada que guardar).
            const respuestaAlmacenes = await ArticuloAlmacenes.guardar(codigo);
            if (!respuestaAlmacenes.resultado) {
                // No se cierra el modal ni se deshace el artículo: el usuario corrige y vuelve a guardar.
                recargarTabla();
                App.mostrarError(`El artículo se guardó, pero no se pudo guardar el inventario por almacén: ${respuestaAlmacenes.mensaje}`);
                return;
            }

            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito('Artículo actualizado correctamente.');
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
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

    // --- Buscador con autocompletado para "Almacén por defecto" (modal de edición y página "Nuevo") ---

    function inicializarBuscadorAlmacenDefecto() {
        if ($('#almacenDefectoTexto').length === 0) return;
        buscadorAlmacenDefecto = App.autocompletar({
            texto: $('#almacenDefectoTexto'),
            oculto: $('#AlmacenDefecto'),
            lista: $('#almacenDefectoResultados'),
            error: $('#almacenDefectoError'),
            endpoint: '/Articulos/BuscarAlmacenes',
            obtenerCodigo: a => a.codigo ?? a.Codigo,
            obtenerEtiqueta: a => `${a.codigo ?? a.Codigo} - ${a.nombre ?? a.Nombre}`,
            minCaracteres: 0, // al enfocar el campo vacío se sugieren los almacenes sin tener que escribir
            requerido: false
        });
        // En edición, el hidden ya trae el código: resolverlo para mostrar "código - nombre".
        const codActual = $('#AlmacenDefecto').val();
        if (codActual) {
            $.get('/Articulos/ObtenerAlmacenPorCodigo', { codigo: codActual }).then(r => {
                buscadorAlmacenDefecto.establecer(r.resultado && r.dato ? r.dato : { codigo: codActual, nombre: codActual });
            });
        }
    }

    inicializarSerieArticulo();
    inicializarBuscadorAlmacenDefecto();

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

        // Primero se validan las filas de inventario por almacén (la sección solo existe con permiso de Actualizar).
        if (!ArticuloAlmacenes.validar()) {
            // La sección vive en la pestaña Inventario: se muestra para que se vean los errores por fila.
            const pestanaInventario = document.querySelector('[data-bs-target="#tabInventario"]');
            if (pestanaInventario) bootstrap.Tab.getOrCreateInstance(pestanaInventario).show();
            App.mostrarError('Revisa los datos de inventario por almacén: hay filas con errores.');
            return;
        }

        const $boton = $(this).prop('disabled', true);
        let redirigir = false;
        try {
            const respuesta = await App.enviarJson('/Articulos/Crear', 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }

            // Con el código real devuelto por la API se guarda la configuración por almacén (se omite si no se configuró nada).
            const respuestaAlmacenes = await ArticuloAlmacenes.guardar(respuesta.codigo);
            if (!respuestaAlmacenes.resultado) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Artículo creado',
                    text: `El artículo "${respuesta.codigo}" se creó, pero no se pudo guardar el inventario por almacén (${respuestaAlmacenes.mensaje}). Vuelve a configurarlo desde «Editar».`
                });
            } else {
                await App.mostrarExito(`Artículo "${respuesta.codigo}" creado correctamente.`);
            }
            redirigir = true; // el artículo ya existe: se sale de la página para no duplicarlo con un segundo guardado
            window.location.href = '/Articulos';
        } finally {
            if (!redirigir) $boton.prop('disabled', false);
        }
    });

    // Sección "Datos de inventario" de la página "Nuevo": filas de los almacenes activos, sin existencias aún.
    if ($('#inventarioAlmacenes').length > 0 && $('#formArticuloCrear').length > 0) {
        ArticuloAlmacenes.cargar('#inventarioAlmacenes', '/Articulos/AlmacenesNuevo');
    }
});
