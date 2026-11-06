$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosSociosNegocio');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true, verSaldos: false };
    // Importes: 2 decimales y separador de miles al pintar; para ordenar/filtrar se usa el número.
    const formatoDinero = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const renderDinero = (d, tipo) => d == null ? '' : (tipo === 'display' ? formatoDinero(d) : d);
    // Límite de crédito (solo clientes): vacío = sin límite; «Excedido» cuando saldo + comprometido supera el límite.
    const renderLimite = (d, tipo, fila) => {
        if (tipo !== 'display') return d == null ? '' : d;
        if (fila.tipoSn !== 'C') return '';
        if (d == null) return '<span class="text-muted">Sin límite</span>';
        const excedido = fila.exposicion != null && Number(fila.exposicion) > Number(d);
        return formatoDinero(d) + (excedido ? ' <span class="badge text-bg-danger" title="El saldo más lo comprometido en pedidos y entregas abiertos supera el límite.">Excedido</span>' : '');
    };
    const tabla = $('#tblSociosNegocio').DataTable({
        ajax: { url: '/SociosNegocio/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'tipoSn', render: d => d === 'C' ? 'Cliente' : (d === 'P' ? 'Proveedor' : (d ?? '')) },
            { data: 'nit' },
            { data: 'tel1' },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            { data: 'saldo', className: 'text-end', visible: permisos.verSaldos, defaultContent: '', render: renderDinero },
            { data: 'vencido', className: 'text-end', visible: permisos.verSaldos, defaultContent: '', render: renderDinero },
            { data: 'limiteCredito', className: 'text-end', visible: permisos.verSaldos, defaultContent: '', render: renderLimite },
            {
                data: 'codigo', orderable: false, className: 'text-end',
                render: codigo => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${codigo}"${permisos.actualizar ? '' : ' title="Ver"'}><i class="fa-solid ${permisos.actualizar ? 'fa-pen' : 'fa-eye'}"></i></button>
                    ${permisos.eliminar ? `<button class="btn btn-sm btn-outline-danger btn-eliminar" data-codigo="${codigo}"><i class="fa-solid fa-trash"></i></button>` : ''}
                `
            }
        ],
        language: App.datatableEsEs
    });

    // Si el servidor no devolvió saldos (sin permiso o la llamada falló), las columnas no se muestran;
    // lo mismo con el límite si no llegó la posición de crédito de ningún cliente.
    tabla.on('xhr.dt', function (e, settings, json) {
        if (!permisos.verSaldos) return;
        const datos = (json && json.resultado && json.dato) || [];
        tabla.columns([6, 7]).visible(datos.some(s => s.saldo != null), false);
        tabla.columns([8]).visible(datos.some(s => s.exposicion != null), false);
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        new bootstrap.Modal('#modalFormulario').show();
        inicializarDirecciones();
        inicializarGruposSocioNegocio();
        actualizarCamposCredito();
    }

    // --- Límite de crédito y bloqueo por vencido: solo para clientes (TipoSn = 'C') ---

    function actualizarCamposCredito() {
        $('.campo-credito-cliente').toggleClass('d-none', $('#TipoSn').val() !== 'C');
    }

    /** Proveedores (u otros tipos) se envían sin límite y sin bloqueo; el límite vacío ya viaja como null. Devuelve false si es inválido. */
    function aplicarCreditoSegunTipo(datos) {
        if (datos.TipoSn !== 'C') {
            datos.LimiteCredito = null;
            datos.BloquearSiVencido = 'N';
            return true;
        }
        if (!datos.BloquearSiVencido) datos.BloquearSiVencido = 'N';
        if (datos.LimiteCredito != null) {
            const limite = Number(datos.LimiteCredito);
            if (!Number.isFinite(limite) || limite < 0) {
                App.mostrarError('El límite de crédito no puede ser negativo.');
                return false;
            }
        }
        return true;
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
        // Siempre se envían el límite y el bloqueo actuales: la actualización de la API reemplaza todas las columnas.
        if (!aplicarCreditoSegunTipo(datos)) return;

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
        actualizarCamposCredito();
    });

    $(document).on('change', '#selectSerieSocioNegocio', function () {
        actualizarCodigoSegunSerie();
    });

    inicializarSeriesSocioNegocio();
    actualizarCamposCredito();

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
        // En edición las direcciones se guardan en vivo contra la API: editar requiere Actualizar y eliminar requiere Eliminar.
        const puedeEditarDireccion = !esEdicionDirecciones() || permisos.actualizar;
        const puedeEliminarDireccion = !esEdicionDirecciones() || permisos.eliminar;

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
                    ${puedeEditarDireccion ? `<button type="button" class="btn btn-sm btn-outline-primary btn-editar-direccion" data-direccion="${d.direccion ?? d.Direccion}"><i class="fa-solid fa-pen"></i></button>` : ''}
                    ${puedeEliminarDireccion ? `<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-direccion" data-direccion="${d.direccion ?? d.Direccion}"><i class="fa-solid fa-trash"></i></button>` : ''}
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

        // La vista previa del campo Código (deshabilitado cuando la serie no es manual) es solo
        // cosmética -- el código real lo calcula y asigna la API al momento de guardar.

        const datos = App.recolectarFormulario('#formSocioNegocioCrear');
        datos.Serie = serieSeleccionada;
        if (!aplicarCreditoSegunTipo(datos)) return;

        const respuesta = await App.enviarJson('/SociosNegocio/Crear', 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        // El código real lo devuelve la API en la respuesta -- para series no manuales puede no
        // coincidir con la vista previa que se mostraba en el campo deshabilitado.
        const codigoCreado = respuesta.codigo;
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
