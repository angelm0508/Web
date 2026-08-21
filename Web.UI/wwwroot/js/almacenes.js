$(function () {
    const tabla = $('#tblAlmacenes').DataTable({
        ajax: { url: '/Almacenes/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'pais' },
            { data: 'municipio' },
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
        inicializarSelectsUbicacion();
    }

    /** Dropdowns en cascada País -> Departamento -> Municipio, filtrados en el navegador. */
    function inicializarSelectsUbicacion() {
        const datosEl = document.getElementById('datosUbicacion');
        if (!datosEl) return;

        const { departamentos, municipios, departamentoActual, municipioActual } = JSON.parse(datosEl.textContent);
        const $selectPais = $('#selectPais');
        const $selectDepartamento = $('#selectDepartamento');
        const $selectMunicipio = $('#selectMunicipio');

        function poblarDepartamentos(codigoPais, seleccionar) {
            $selectDepartamento.html('<option value="">-- Seleccione --</option>');
            departamentos
                .filter(d => d.pais === codigoPais)
                .forEach(d => $selectDepartamento.append(`<option value="${d.codigo}">${d.nombre ?? d.codigo}</option>`));
            if (seleccionar) $selectDepartamento.val(seleccionar);
        }

        function poblarMunicipios(codigoPais, codigoDepartamento, seleccionar) {
            $selectMunicipio.html('<option value="">-- Seleccione --</option>');
            municipios
                .filter(m => m.pais === codigoPais && m.departamento === codigoDepartamento)
                .forEach(m => $selectMunicipio.append(`<option value="${m.codigo}">${m.nombre ?? m.codigo}</option>`));
            if (seleccionar) $selectMunicipio.val(seleccionar);
        }

        $selectPais.off('change').on('change', function () {
            poblarDepartamentos(this.value, null);
            $selectMunicipio.html('<option value="">-- Seleccione un departamento primero --</option>');
        });

        $selectDepartamento.off('change').on('change', function () {
            poblarMunicipios($selectPais.val(), this.value, null);
        });

        // Modo edición: reconstruir la cascada con los valores ya guardados.
        if ($selectPais.val()) {
            poblarDepartamentos($selectPais.val(), departamentoActual);
            if (departamentoActual) {
                poblarMunicipios($selectPais.val(), departamentoActual, municipioActual);
            }
        }
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/Almacenes/FormularioCrear');
        abrirModal(html);
    });

    $('#tblAlmacenes').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/Almacenes/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblAlmacenes').on('click', '.btn-eliminar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await App.confirmarEliminar(`Se eliminará el almacén "${codigo}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Almacenes/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Almacén eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarAlmacen', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formAlmacen');

        const url = esEdicion ? `/Almacenes/Editar?codigo=${encodeURIComponent(codigo)}` : '/Almacenes/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Almacén actualizado correctamente.' : 'Almacén creado correctamente.');
        recargarTabla();
    });
});
