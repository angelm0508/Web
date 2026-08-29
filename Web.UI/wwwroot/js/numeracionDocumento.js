$(function () {
    const tabla = $('#tblNumeracionDocumento').DataTable({
        ajax: { url: '/NumeracionDocumento/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'docAlias', render: d => d ?? '' },
            { data: 'nombreSerieDefecto', render: d => d ?? '' },
            { data: 'iniNumero', render: d => d ?? '' },
            { data: 'sigNumero', render: d => d ?? '' },
            { data: 'finNumero', render: d => d ?? '' },
            {
                data: 'codigoObj', orderable: false, className: 'text-end',
                render: codigo => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${codigo}"><i class="fa-solid fa-pen"></i></button>
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        new bootstrap.Modal('#modalFormulario').show();
        inicializarDetalle();
    }

    $('#tblNumeracionDocumento').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/NumeracionDocumento/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $(document).on('click', '#btnGuardarNumeracionDocumento', async function () {
        const $boton = $(this);
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formNumeracionDocumento');

        const respuesta = await App.enviarJson(`/NumeracionDocumento/Editar?codigo=${encodeURIComponent(codigo)}`, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito('Numeración actualizada correctamente.');
        recargarTabla();
    });

    // --- Detalle (grid anidado): en creación se administra localmente, en edición en vivo contra la API ---

    let lineasLocales = [];
    let lineasRemotas = [];
    let proximoIdLocal = 1;
    let serieOriginalEnEdicion = null;

    function esEdicionDetalle() {
        const v = $('#tblDetalleNumeracion').data('es-edicion');
        return v === true || v === 'true';
    }

    function inicializarDetalle() {
        lineasLocales = [];
        lineasRemotas = [];
        proximoIdLocal = 1;
        serieOriginalEnEdicion = null;

        const $tabla = $('#tblDetalleNumeracion');
        if ($tabla.length === 0) return;

        if (esEdicionDetalle()) {
            cargarDetalleRemoto();
        } else {
            pintarDetalle();
        }
    }

    async function cargarDetalleRemoto() {
        const codigoObj = $('#tblDetalleNumeracion').data('codigo-obj');
        const respuesta = await $.get('/NumeracionDocumento/ObtenerDetalle', { codigoObj });
        lineasRemotas = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        pintarDetalle();
    }

    function pintarDetalle() {
        const $tbody = $('#tblDetalleNumeracion tbody');
        if ($tbody.length === 0) return;

        // El detalle solo muestra las líneas cuyo subtipo coincide con el del encabezado
        // (el subtipo de la línea no se edita, siempre sigue al del encabezado).
        const subTipoActual = $('#SubTipoDoc').val();
        const listaCompleta = esEdicionDetalle() ? lineasRemotas : lineasLocales;
        const lista = listaCompleta.filter(l => (l.subTipoDoc ?? l.SubTipoDoc) === subTipoActual);

        actualizarComboSerieDfct(lista);

        if (lista.length === 0) {
            $tbody.html('<tr><td colspan="8" class="text-center text-muted">Sin líneas de detalle para este subtipo</td></tr>');
            return;
        }

        $tbody.html(lista.map(linea => {
            const serie = linea.serie ?? linea.Serie;
            const nombreSerie = linea.nombreSerie ?? linea.NombreSerie;
            const subTipoDoc = linea.subTipoDoc ?? linea.SubTipoDoc;
            const tipoSerie = linea.tipoSerie ?? linea.TipoSerie;
            const iniNumero = linea.iniNumero ?? linea.IniNumero;
            const finNumero = linea.finNumero ?? linea.FinNumero;
            const bloqueado = linea.bloqueado ?? linea.Bloqueado;
            const estaBloqueada = bloqueado === 'S';
            const clave = esEdicionDetalle() ? serie : linea._id;
            return `
                <tr>
                    <td>${serie}</td>
                    <td>${nombreSerie ?? ''}</td>
                    <td>${subTipoDoc ?? ''}</td>
                    <td>${tipoSerie ?? ''}</td>
                    <td>${iniNumero ?? ''}</td>
                    <td>${finNumero ?? ''}</td>
                    <td>${estaBloqueada ? 'Sí' : 'No'}</td>
                    <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-primary btn-editar-linea" data-clave="${clave}" ${estaBloqueada ? 'disabled title="Línea bloqueada"' : ''}><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-linea" data-clave="${clave}" ${estaBloqueada ? 'disabled title="Línea bloqueada"' : ''}><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join(''));
    }

    /**
     * Reconstruye el combo "Serie por defecto" del encabezado a partir de las líneas visibles.
     * Siempre existe una serie "Manual" para cada subtipo de documento, así que el combo nunca
     * queda vacío -- no ofrece una opción "-- Ninguna --" y, si no hay un valor previo válido,
     * selecciona la serie Manual por defecto.
     */
    function actualizarComboSerieDfct(lista) {
        const $combo = $('#SerieDfct');
        if ($combo.length === 0) return;

        const valorPrevio = $combo.val() || $combo.data('serie-dfct-inicial') || '';
        $combo.html('');

        let serieManual = null;
        lista.forEach(linea => {
            const nombreSerie = linea.nombreSerie ?? linea.NombreSerie ?? '';
            const manual = linea.manual ?? linea.Manual;
            if (esEdicionDetalle()) {
                const serie = linea.serie ?? linea.Serie;
                if (manual === 'S' && serieManual === null) serieManual = serie;
                $combo.append(`<option value="${serie}">${nombreSerie}</option>`);
            } else {
                if (manual === 'S' && serieManual === null) serieManual = `local:${linea._id}`;
                $combo.append(`<option value="local:${linea._id}">${nombreSerie} (pendiente)</option>`);
            }
        });

        if (valorPrevio && $combo.find(`option[value="${valorPrevio}"]`).length > 0) {
            $combo.val(String(valorPrevio));
        } else if (serieManual !== null) {
            $combo.val(String(serieManual));
        }
    }

    function limpiarPanelLinea() {
        $('#detSerieOriginal').val('');
        $('#grupoDetSerie').addClass('d-none');
        $('#detSerie').val('');
        $('#detNombreSerie').val('');
        $('#detSubTipoDoc').val($('#SubTipoDoc').val());
        $('#detTipoSerie').val('');
        $('#detIniNumero').val('');
        $('#detSigNumero').val('');
        $('#detFinNumero').val('');
        $('#detCantDigitos').val('');
        $('#detManual').val('N');
        $('#detIniCadena').val('');
        $('#detFinCadena').val('');
        $('#detComentario').val('');
        serieOriginalEnEdicion = null;
    }

    $(document).on('click', '#btnNuevaLinea', function () {
        limpiarPanelLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    // El subtipo de documento del detalle siempre sigue al del encabezado y no se edita aquí;
    // además, la lista solo muestra las líneas de ese mismo subtipo.
    $(document).on('change', '#SubTipoDoc', function () {
        $('#detSubTipoDoc').val(this.value);
        pintarDetalle();
    });

    $(document).on('click', '#btnCancelarLinea', function () {
        $('#panelLineaDetalle').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-linea', function () {
        const clave = $(this).data('clave');
        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;
        const linea = esEdicionDetalle()
            ? lista.find(l => (l.serie ?? l.Serie) === clave)
            : lista.find(l => l._id === clave);
        if (!linea) return;

        limpiarPanelLinea();
        serieOriginalEnEdicion = clave;

        $('#detSerieOriginal').val(clave);
        $('#grupoDetSerie').removeClass('d-none');
        $('#detSerie').val(linea.serie ?? linea.Serie ?? clave);
        $('#detNombreSerie').val(linea.nombreSerie ?? linea.NombreSerie ?? '');
        $('#detSubTipoDoc').val($('#SubTipoDoc').val());
        $('#detTipoSerie').val(linea.tipoSerie ?? linea.TipoSerie ?? '');
        $('#detIniNumero').val(linea.iniNumero ?? linea.IniNumero ?? '');
        $('#detSigNumero').val(linea.sigNumero ?? linea.SigNumero ?? '');
        $('#detFinNumero').val(linea.finNumero ?? linea.FinNumero ?? '');
        $('#detCantDigitos').val(linea.cantDigitos ?? linea.CantDigitos ?? '');
        $('#detManual').val(linea.manual ?? linea.Manual ?? 'N');
        $('#detIniCadena').val(linea.iniCadena ?? linea.IniCadena ?? '');
        $('#detFinCadena').val(linea.finCadena ?? linea.FinCadena ?? '');
        $('#detComentario').val(linea.comentario ?? linea.Comentario ?? '');

        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '.btn-eliminar-linea', async function () {
        const clave = $(this).data('clave');

        const confirmado = await App.confirmarEliminar('Se eliminará la línea de detalle seleccionada.');
        if (!confirmado) return;

        if (esEdicionDetalle()) {
            const respuesta = await App.eliminar(`/NumeracionDocumento/EliminarLinea?serie=${clave}`);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            App.mostrarExito('Línea eliminada correctamente.');
            cargarDetalleRemoto();
        } else {
            lineasLocales = lineasLocales.filter(l => l._id !== clave);
            pintarDetalle();
        }
    });

    $(document).on('click', '#btnGuardarLinea', async function () {
        const datosForm = App.recolectarFormulario('#formLineaDetalle');
        // El select está deshabilitado (solo espejo del encabezado), así que no viaja en el
        // serializeArray del formulario -- hay que agregarlo a mano.
        datosForm.SubTipoDoc = $('#SubTipoDoc').val();

        if (!datosForm.SubTipoDoc) {
            App.mostrarError('Selecciona primero el subtipo de documento del encabezado.');
            return;
        }
        if (!datosForm.NombreSerie) {
            App.mostrarError('El nombre de la serie es requerido.');
            return;
        }

        if (esEdicionDetalle()) {
            const codigoObj = $('#tblDetalleNumeracion').data('codigo-obj');
            const esEdicionLinea = serieOriginalEnEdicion !== null;
            const url = esEdicionLinea
                ? `/NumeracionDocumento/EditarLinea?serie=${serieOriginalEnEdicion}`
                : '/NumeracionDocumento/CrearLinea';
            const datos = { ...datosForm, CodigoObj: codigoObj };

            const respuesta = await App.enviarJson(url, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }

            App.mostrarExito(esEdicionLinea ? 'Línea actualizada correctamente.' : 'Línea agregada correctamente.');
            $('#panelLineaDetalle').addClass('d-none');
            cargarDetalleRemoto();
        } else {
            if (serieOriginalEnEdicion !== null) {
                lineasLocales = lineasLocales.map(l => l._id === serieOriginalEnEdicion ? { ...datosForm, _id: l._id } : l);
            } else {
                lineasLocales.push({ ...datosForm, _id: proximoIdLocal++ });
            }

            $('#panelLineaDetalle').addClass('d-none');
            pintarDetalle();
        }
    });
});
