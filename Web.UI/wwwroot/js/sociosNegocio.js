$(function () {
    const tabla = $('#tblSociosNegocio').DataTable({
        ajax: { url: '/SociosNegocio/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'tipoSn', render: d => d === 'C' ? 'Cliente' : (d === 'P' ? 'Proveedor' : (d ?? '')) },
            { data: 'nit' },
            { data: 'tel1' },
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
        inicializarDirecciones();
        inicializarGruposSocioNegocio();
    }

    $('#tblSociosNegocio').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/SociosNegocio/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblSociosNegocio').on('click', '.btn-eliminar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await App.confirmarEliminar(`Se eliminará el socio de negocio "${codigo}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/SociosNegocio/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Socio de negocio eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarSocioNegocio', async function () {
        const codigo = $(this).data('codigo');
        const datos = App.recolectarFormulario('#formSocioNegocio');

        const respuesta = await App.enviarJson(`/SociosNegocio/Editar?codigo=${encodeURIComponent(codigo)}`, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito('Socio de negocio actualizado correctamente.');
        recargarTabla();
    });

    // --- Serie de numeración para generar el código del socio (solo en la página "Nuevo") ---

    let catalogoSeriesSocioNegocio = null;

    function inicializarSeriesSocioNegocio() {
        const datosEl = document.getElementById('datosSeriesSocioNegocio');
        catalogoSeriesSocioNegocio = datosEl ? JSON.parse(datosEl.textContent) : null;
        poblarSeriesSocioNegocio($('#TipoSn').val());
    }

    function poblarSeriesSocioNegocio(tipoSn) {
        const $sel = $('#selectSerieSocioNegocio');
        if ($sel.length === 0) return;

        if (!catalogoSeriesSocioNegocio || !tipoSn) {
            $sel.html('<option value="">-- Seleccione el tipo primero --</option>');
            actualizarCodigoSegunSerie();
            return;
        }

        $sel.html('');
        let serieManual = null;
        catalogoSeriesSocioNegocio
            .filter(s => (s.subTipoDoc ?? s.SubTipoDoc) === tipoSn)
            .forEach(s => {
                const serie = s.serie ?? s.Serie;
                const nombre = s.nombreSerie ?? s.NombreSerie;
                const manual = s.manual ?? s.Manual;
                if (manual === 'S' && serieManual === null) serieManual = serie;
                $sel.append(`<option value="${serie}" data-manual="${manual}">${nombre}</option>`);
            });

        // Se preselecciona "Manual" por defecto para no obligar a elegir en cada alta.
        if (serieManual !== null) $sel.val(serieManual);

        actualizarCodigoSegunSerie();
    }

    function esSerieManualSocioNegocio() {
        const $sel = $('#selectSerieSocioNegocio');
        if ($sel.length === 0 || !$sel.val()) return true;
        return $sel.find('option:selected').data('manual') === 'S';
    }

    function actualizarCodigoSegunSerie() {
        const $codigo = $('#Codigo');
        if ($codigo.length === 0) return;

        if (esSerieManualSocioNegocio()) {
            $codigo.prop('disabled', false).attr('placeholder', '');
        } else {
            $codigo.val('').prop('disabled', true).attr('placeholder', 'Se generará al guardar');
        }
    }

    $(document).on('change', '#TipoSn', function () {
        poblarSeriesSocioNegocio(this.value);
        poblarGruposSocioNegocio(this.value);
    });

    $(document).on('change', '#selectSerieSocioNegocio', function () {
        actualizarCodigoSegunSerie();
    });

    inicializarSeriesSocioNegocio();

    // --- Grupo del socio: depende del tipo (Cliente/Proveedor) seleccionado ---

    let catalogoGruposSocioNegocio = null;

    function inicializarGruposSocioNegocio() {
        const datosEl = document.getElementById('datosGruposSocioNegocio');
        catalogoGruposSocioNegocio = datosEl ? JSON.parse(datosEl.textContent) : null;
        poblarGruposSocioNegocio($('#TipoSn').val());
    }

    function poblarGruposSocioNegocio(tipoSn) {
        const $sel = $('#GrupoSn');
        if ($sel.length === 0) return;

        const valorPrevio = $sel.val() || $sel.data('grupo-inicial') || '';
        $sel.html('');

        if (!catalogoGruposSocioNegocio || !tipoSn) return;

        catalogoGruposSocioNegocio
            .filter(g => (g.tipoGrupo ?? g.TipoGrupo) === tipoSn)
            .forEach(g => {
                const entry = g.entry ?? g.Entry;
                const nombre = g.nombre ?? g.Nombre;
                $sel.append(`<option value="${entry}">${nombre}</option>`);
            });

        if (valorPrevio && $sel.find(`option[value="${valorPrevio}"]`).length > 0) {
            $sel.val(String(valorPrevio));
        }
    }

    inicializarGruposSocioNegocio();

    // --- Direcciones embebidas en el formulario del socio ---

    let direccionesLocales = [];
    let direccionesRemotas = [];
    let direccionOriginalEnEdicion = null;
    let catalogoUbicacionDireccion = null;

    function inicializarDirecciones() {
        direccionesLocales = [];
        direccionesRemotas = [];
        direccionOriginalEnEdicion = null;

        const datosEl = document.getElementById('datosUbicacionDireccion');
        catalogoUbicacionDireccion = datosEl ? JSON.parse(datosEl.textContent) : null;

        const $tabla = $('#tblDireccionesSocio');
        if ($tabla.length === 0) return;

        const esEdicionDirecciones = $tabla.data('es-edicion') === true || $tabla.data('es-edicion') === 'true';
        if (esEdicionDirecciones) {
            cargarDireccionesRemotas();
        } else {
            pintarDirecciones();
        }
    }

    /** Dropdowns en cascada País -> Departamento -> Municipio dentro del panel de dirección. */
    function poblarDepartamentosDireccion(codigoPais, seleccionar) {
        const $sel = $('#selectDepartamentoDireccion');
        $sel.html('<option value="">-- Seleccione --</option>');
        if (!catalogoUbicacionDireccion || !codigoPais) return;
        catalogoUbicacionDireccion.departamentos
            .filter(d => d.pais === codigoPais)
            .forEach(d => $sel.append(`<option value="${d.codigo}">${d.nombre ?? d.codigo}</option>`));
        if (seleccionar) $sel.val(seleccionar);
    }

    function poblarMunicipiosDireccion(codigoPais, codigoDepartamento, seleccionar) {
        const $sel = $('#selectMunicipioDireccion');
        $sel.html('<option value="">-- Seleccione --</option>');
        if (!catalogoUbicacionDireccion || !codigoPais || !codigoDepartamento) return;
        catalogoUbicacionDireccion.municipios
            .filter(m => m.pais === codigoPais && m.departamento === codigoDepartamento)
            .forEach(m => $sel.append(`<option value="${m.codigo}">${m.nombre ?? m.codigo}</option>`));
        if (seleccionar) $sel.val(seleccionar);
    }

    $(document).on('change', '#selectPaisDireccion', function () {
        poblarDepartamentosDireccion(this.value, null);
        $('#selectMunicipioDireccion').html('<option value="">-- Seleccione un departamento primero --</option>');
    });

    $(document).on('change', '#selectDepartamentoDireccion', function () {
        poblarMunicipiosDireccion($('#selectPaisDireccion').val(), this.value, null);
    });

    inicializarDirecciones();

    async function cargarDireccionesRemotas() {
        const codigoSn = $('#tblDireccionesSocio').data('codigo-sn');
        const respuesta = await $.get('/Direcciones/ObtenerPorSocio', { codigoSn });
        direccionesRemotas = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        pintarDirecciones();
    }

    function esEdicionDirecciones() {
        return $('#tblDireccionesSocio').data('es-edicion') === true || $('#tblDireccionesSocio').data('es-edicion') === 'true';
    }

    function pintarDirecciones() {
        const $tbody = $('#tblDireccionesSocio tbody');
        if ($tbody.length === 0) return;

        const lista = esEdicionDirecciones() ? direccionesRemotas : direccionesLocales;

        actualizarChecklistSocio();

        if (lista.length === 0) {
            $tbody.html('<tr><td colspan="6" class="text-center text-muted">Sin direcciones registradas</td></tr>');
            return;
        }

        $tbody.html(lista.map(d => `
            <tr>
                <td>${d.direccion ?? d.Direccion ?? ''}</td>
                <td>${d.calle ?? d.Calle ?? ''}</td>
                <td>${d.municipio ?? d.Municipio ?? ''}</td>
                <td>${d.departamento ?? d.Departamento ?? ''}</td>
                <td>${d.tipoDireccion ?? d.TipoDireccion ?? ''}</td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-primary btn-editar-direccion" data-direccion="${d.direccion ?? d.Direccion}"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-direccion" data-direccion="${d.direccion ?? d.Direccion}"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join(''));
    }

    function limpiarPanelDireccion() {
        $('#dirDireccionOriginal').val('');
        $('#dirCodigo').val('').prop('readonly', false);
        $('#dirCalle').val('');
        $('#dirBloque').val('');
        $('#dirCodigoPostal').val('');
        $('#selectPaisDireccion').val('');
        $('#selectDepartamentoDireccion').html('<option value="">-- Seleccione un país primero --</option>');
        $('#selectMunicipioDireccion').html('<option value="">-- Seleccione un departamento primero --</option>');
        $('#dirTipoDireccion').val('ENV');
        $('#dirNumLinea').val('');
        direccionOriginalEnEdicion = null;
    }

    $(document).on('click', '#btnNuevaDireccion', function () {
        limpiarPanelDireccion();
        $('#panelDireccion').removeClass('d-none');
    });

    $(document).on('click', '#btnCancelarDireccion', function () {
        $('#panelDireccion').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-direccion', function () {
        const codigoDireccion = $(this).data('direccion');
        const lista = esEdicionDirecciones() ? direccionesRemotas : direccionesLocales;
        const direccion = lista.find(d => (d.direccion ?? d.Direccion) === codigoDireccion);
        if (!direccion) return;

        limpiarPanelDireccion();
        direccionOriginalEnEdicion = codigoDireccion;

        $('#dirDireccionOriginal').val(codigoDireccion);
        $('#dirCodigo').val(direccion.direccion ?? direccion.Direccion).prop('readonly', esEdicionDirecciones());
        $('#dirCalle').val(direccion.calle ?? direccion.Calle ?? '');
        $('#dirBloque').val(direccion.bloque ?? direccion.Bloque ?? '');
        $('#dirCodigoPostal').val(direccion.codigoPostal ?? direccion.CodigoPostal ?? '');

        const paisActual = direccion.pais ?? direccion.Pais ?? '';
        const departamentoActual = direccion.departamento ?? direccion.Departamento ?? '';
        const municipioActual = direccion.municipio ?? direccion.Municipio ?? '';
        $('#selectPaisDireccion').val(paisActual);
        poblarDepartamentosDireccion(paisActual, departamentoActual);
        poblarMunicipiosDireccion(paisActual, departamentoActual, municipioActual);

        $('#dirTipoDireccion').val(direccion.tipoDireccion ?? direccion.TipoDireccion ?? '');
        $('#dirNumLinea').val(direccion.numLinea ?? direccion.NumLinea ?? '');

        $('#panelDireccion').removeClass('d-none');
    });

    $(document).on('click', '.btn-eliminar-direccion', async function () {
        const codigoDireccion = $(this).data('direccion');

        const confirmado = await App.confirmarEliminar(`Se eliminará la dirección "${codigoDireccion}".`);
        if (!confirmado) return;

        if (esEdicionDirecciones()) {
            const respuesta = await App.eliminar(`/SociosNegocio/EliminarDireccion?direccion=${encodeURIComponent(codigoDireccion)}`);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            App.mostrarExito('Dirección eliminada correctamente.');
            cargarDireccionesRemotas();
        } else {
            direccionesLocales = direccionesLocales.filter(d => d.Direccion !== codigoDireccion);
            pintarDirecciones();
        }
    });

    $(document).on('click', '#btnGuardarDireccionLinea', async function () {
        const datos = App.recolectarFormulario('#formDireccionSocio');

        if (!datos.Direccion) {
            App.mostrarError('El código de la dirección es requerido.');
            return;
        }

        if (esEdicionDirecciones()) {
            const codigoSn = $('#tblDireccionesSocio').data('codigo-sn');

            if (direccionOriginalEnEdicion) {
                const respuesta = await App.enviarJson(
                    `/SociosNegocio/EditarDireccion?direccion=${encodeURIComponent(direccionOriginalEnEdicion)}`,
                    'POST',
                    datos
                );
                if (!respuesta.resultado) {
                    App.mostrarError(respuesta.mensaje);
                    return;
                }
                App.mostrarExito('Dirección actualizada correctamente.');
            } else {
                const respuesta = await App.enviarJson('/SociosNegocio/CrearDireccion', 'POST', {
                    ...datos,
                    CodigoSn: codigoSn
                });
                if (!respuesta.resultado) {
                    App.mostrarError(respuesta.mensaje);
                    return;
                }
                App.mostrarExito('Dirección agregada correctamente.');
            }

            $('#panelDireccion').addClass('d-none');
            cargarDireccionesRemotas();
        } else {
            const yaExiste = direccionesLocales.some(d => d.Direccion === datos.Direccion && d.Direccion !== direccionOriginalEnEdicion);
            if (yaExiste) {
                App.mostrarError('Ya existe una dirección local con ese código.');
                return;
            }

            if (direccionOriginalEnEdicion) {
                direccionesLocales = direccionesLocales.filter(d => d.Direccion !== direccionOriginalEnEdicion);
            }
            direccionesLocales.push(datos);

            $('#panelDireccion').addClass('d-none');
            pintarDirecciones();
        }
    });

    // --- Checklist "Recomendado completar" de la página de creación ---

    function actualizarChecklistSocio() {
        const $lista = $('#listaChecklistSocio');
        if ($lista.length === 0) return;

        $lista.find('[data-check]').each(function () {
            const campo = $(this).data('check');
            const tieneValor = !!$(`#${campo}`).val();
            $(this).find('i')
                .toggleClass('fa-regular fa-circle text-muted', !tieneValor)
                .toggleClass('fa-solid fa-circle-check text-success', tieneValor);
        });

        $lista.find('[data-check-direccion]').each(function () {
            const tieneDireccion = direccionesLocales.length > 0;
            $(this).find('i')
                .toggleClass('fa-regular fa-circle text-muted', !tieneDireccion)
                .toggleClass('fa-solid fa-circle-check text-success', tieneDireccion);
        });
    }

    $(document).on('input change', '#Nombre, #TipoSn, #GrupoSn, #Email', actualizarChecklistSocio);
    actualizarChecklistSocio();

    // --- Guardar desde la página completa "Nuevo socio de negocio" ---

    $(document).on('click', '#btnGuardarSocioNegocioPagina', async function () {
        const serieSeleccionada = $('#selectSerieSocioNegocio').val();
        if (!serieSeleccionada) {
            App.mostrarError('Debes seleccionar una serie.');
            return;
        }

        let codigoGenerado = null;
        if (!esSerieManualSocioNegocio()) {
            const respuestaSerie = await App.enviarJson(`/SociosNegocio/GenerarCodigoSerie?serie=${serieSeleccionada}`, 'POST', {});
            if (!respuestaSerie.resultado) {
                App.mostrarError(respuestaSerie.mensaje);
                return;
            }
            codigoGenerado = respuestaSerie.dato;
        }

        const datos = App.recolectarFormulario('#formSocioNegocioCrear');
        // El campo Código queda deshabilitado cuando el código se genera automáticamente, así que
        // no viaja en el serializeArray del formulario -- hay que agregarlo a mano.
        if (codigoGenerado !== null) {
            datos.Codigo = codigoGenerado;
        }
        datos.Serie = serieSeleccionada;

        const respuesta = await App.enviarJson('/SociosNegocio/Crear', 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        const codigoCreado = datos.Codigo;
        let exitosas = 0;
        let fallidas = 0;

        for (const direccionLocal of direccionesLocales) {
            const respuestaDireccion = await App.enviarJson('/SociosNegocio/CrearDireccion', 'POST', {
                ...direccionLocal,
                CodigoSn: codigoCreado
            });

            if (respuestaDireccion.resultado) {
                exitosas++;
            } else {
                fallidas++;
                App.mostrarError(respuestaDireccion.mensaje);
            }
        }

        if (fallidas > 0) {
            await App.mostrarExito(`Socio de negocio creado correctamente. Direcciones guardadas: ${exitosas} de ${exitosas + fallidas}.`);
        } else {
            await App.mostrarExito('Socio de negocio creado correctamente.');
        }
        window.location.href = '/SociosNegocio';
    });
});
