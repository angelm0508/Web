$(function () {
    const tabla = $('#tblGruposUnidadMedida').DataTable({
        ajax: { url: '/GruposUnidadMedida/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'bloqueado', render: d => d === 'S' ? '<span class="badge text-bg-danger">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'entry', orderable: false, className: 'text-end',
                render: (id, type, row) => {
                    const bloqueado = row.bloqueado === 'S';
                    const atributos = bloqueado ? 'disabled title="Registro bloqueado"' : '';
                    return `
                        <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${id}" ${atributos}><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${id}" ${atributos}><i class="fa-solid fa-trash"></i></button>
                    `;
                }
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

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/GruposUnidadMedida/FormularioCrear');
        abrirModal(html);
    });

    $('#tblGruposUnidadMedida').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/GruposUnidadMedida/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblGruposUnidadMedida').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará el grupo seleccionado.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/GruposUnidadMedida/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Grupo eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarGrupoUnidadMedida', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formGrupoUnidadMedida');

        if (!esEdicion) {
            const respuestaGrupo = await App.enviarJson('/GruposUnidadMedida/Crear', 'POST', datos);
            if (!respuestaGrupo.resultado) {
                App.mostrarError(respuestaGrupo.mensaje);
                return;
            }

            const nuevoEntry = respuestaGrupo.dato;
            let exitosas = 0;
            let fallidas = 0;

            for (const linea of lineasLocales) {
                const respuestaLinea = await App.enviarJson('/GruposUnidadMedida/CrearLinea', 'POST', {
                    MedidaEntry: linea.MedidaEntry,
                    CantAlternativa: linea.CantAlternativa,
                    CantBase: linea.CantBase,
                    GrpMedidaEntry: nuevoEntry
                });

                if (respuestaLinea.resultado) {
                    exitosas++;
                } else {
                    fallidas++;
                    App.mostrarError(respuestaLinea.mensaje);
                }
            }

            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            if (fallidas > 0) {
                App.mostrarExito(`Grupo creado correctamente. Líneas guardadas: ${exitosas} de ${exitosas + fallidas}.`);
            } else {
                App.mostrarExito('Grupo creado correctamente.');
            }
            recargarTabla();
            return;
        }

        const respuesta = await App.enviarJson(`/GruposUnidadMedida/Editar?id=${encodeURIComponent(id)}`, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito('Grupo actualizado correctamente.');
        recargarTabla();
    });

    // --- Detalle (grid anidado): en creación se administra localmente, en edición en vivo contra la API ---

    let lineasLocales = [];
    let lineasRemotas = [];
    let proximoIdLocal = 1;
    let numLineaOriginalEnEdicion = null;

    function esEdicionDetalle() {
        const v = $('#tblDetalleGrupoUnidadMedida').data('es-edicion');
        return v === true || v === 'true';
    }

    function inicializarDetalle() {
        lineasLocales = [];
        lineasRemotas = [];
        proximoIdLocal = 1;
        numLineaOriginalEnEdicion = null;

        const $tabla = $('#tblDetalleGrupoUnidadMedida');
        if ($tabla.length === 0) return;

        if (esEdicionDetalle()) {
            cargarDetalleRemoto();
        } else {
            pintarDetalle();
        }
    }

    async function cargarDetalleRemoto() {
        const grpMedidaEntry = $('#tblDetalleGrupoUnidadMedida').data('grupo');
        const respuesta = await $.get('/GruposUnidadMedida/ObtenerDetalle', { grpMedidaEntry });
        lineasRemotas = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        pintarDetalle();
    }

    function nombreUnidad(entry) {
        const texto = $(`#detMedidaEntry option[value="${entry}"]`).text();
        return texto || entry;
    }

    function pintarDetalle() {
        const $tbody = $('#tblDetalleGrupoUnidadMedida tbody');
        if ($tbody.length === 0) return;

        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;
        const opcionesUnidades = $('#detMedidaEntry').html();
        const baseMedidaActual = $('#selectBaseMedida').val();

        if (lista.length === 0) {
            $tbody.html('<tr><td colspan="5" class="text-center text-muted">Sin líneas de detalle</td></tr>');
            return;
        }

        $tbody.html(lista.map(linea => {
            const medidaEntry = linea.medidaEntry ?? linea.MedidaEntry;
            const cantAlternativa = linea.cantAlternativa ?? linea.CantAlternativa;
            const cantBase = linea.cantBase ?? linea.CantBase;
            const clave = esEdicionDetalle() ? linea.numLinea : linea._id;
            return `
                <tr>
                    <td>${nombreUnidad(medidaEntry)}</td>
                    <td>${cantAlternativa ?? ''}</td>
                    <td>${cantBase ?? ''}</td>
                    <td>
                        <select class="form-select form-select-sm select-base-medida-linea" disabled>
                            ${opcionesUnidades}
                        </select>
                    </td>
                    <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-primary btn-editar-linea" data-clave="${clave}"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-linea" data-clave="${clave}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join(''));

        $('.select-base-medida-linea').val(baseMedidaActual);
    }

    $(document).on('change', '#selectBaseMedida', pintarDetalle);

    function limpiarPanelLinea() {
        $('#detNumLineaOriginal').val('');
        $('#detMedidaEntry').val('');
        $('#detCantAlternativa').val('');
        $('#detCantBase').val('');
        numLineaOriginalEnEdicion = null;
    }

    $(document).on('click', '#btnNuevaLinea', function () {
        limpiarPanelLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '#btnCancelarLinea', function () {
        $('#panelLineaDetalle').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-linea', function () {
        const clave = $(this).data('clave');
        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;
        const linea = esEdicionDetalle()
            ? lista.find(l => l.numLinea === clave)
            : lista.find(l => l._id === clave);
        if (!linea) return;

        limpiarPanelLinea();
        numLineaOriginalEnEdicion = clave;

        $('#detNumLineaOriginal').val(clave);
        $('#detMedidaEntry').val(linea.medidaEntry ?? linea.MedidaEntry);
        $('#detCantAlternativa').val(linea.cantAlternativa ?? linea.CantAlternativa ?? '');
        $('#detCantBase').val(linea.cantBase ?? linea.CantBase ?? '');

        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '.btn-eliminar-linea', async function () {
        const clave = $(this).data('clave');

        const confirmado = await App.confirmarEliminar('Se eliminará la línea de detalle seleccionada.');
        if (!confirmado) return;

        if (esEdicionDetalle()) {
            const grpMedidaEntry = $('#tblDetalleGrupoUnidadMedida').data('grupo');
            const respuesta = await App.eliminar(`/GruposUnidadMedida/EliminarLinea?grpMedidaEntry=${grpMedidaEntry}&numLinea=${clave}`);
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

        if (!datosForm.MedidaEntry) {
            App.mostrarError('La unidad de medida es requerida.');
            return;
        }

        if (esEdicionDetalle()) {
            const grpMedidaEntry = $('#tblDetalleGrupoUnidadMedida').data('grupo');
            const esEdicionLinea = numLineaOriginalEnEdicion !== null;
            const url = esEdicionLinea
                ? `/GruposUnidadMedida/EditarLinea?grpMedidaEntry=${grpMedidaEntry}&numLinea=${numLineaOriginalEnEdicion}`
                : '/GruposUnidadMedida/CrearLinea';
            const datos = esEdicionLinea ? datosForm : { ...datosForm, GrpMedidaEntry: grpMedidaEntry };

            const respuesta = await App.enviarJson(url, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }

            App.mostrarExito(esEdicionLinea ? 'Línea actualizada correctamente.' : 'Línea agregada correctamente.');
            $('#panelLineaDetalle').addClass('d-none');
            cargarDetalleRemoto();
        } else {
            if (numLineaOriginalEnEdicion !== null) {
                lineasLocales = lineasLocales.map(l => l._id === numLineaOriginalEnEdicion ? { ...datosForm, _id: l._id } : l);
            } else {
                lineasLocales.push({ ...datosForm, _id: proximoIdLocal++ });
            }

            $('#panelLineaDetalle').addClass('d-none');
            pintarDetalle();
        }
    });
});
