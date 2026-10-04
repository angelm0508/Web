$(function () {
    const escapar = v => $('<div>').text(v ?? '').html();

    const tabla = $('#tblUsuarios').DataTable({
        ajax: { url: '/Usuarios/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo', render: d => escapar(d) },
            { data: 'nombre', render: d => escapar(d) },
            {
                data: 'superUsuario',
                render: d => d === 'S' ? '<span class="badge text-bg-primary">Sí</span>' : ''
            },
            {
                data: 'bloqueado',
                render: d => d === 'S' ? '<span class="badge text-bg-danger">Bloqueado</span>' : '<span class="badge text-bg-success">Activo</span>'
            },
            {
                data: 'id', orderable: false, className: 'text-end',
                render: (id, tipo, fila) => {
                    // SAP-style: las autorizaciones de un superusuario no se pueden restringir.
                    const permisos = fila.superUsuario === 'S'
                        ? ''
                        : `<a class="btn btn-sm btn-outline-primary" href="/Usuarios/Permisos?usuarioId=${id}"><i class="fa-solid fa-key"></i> Permisos</a>`;
                    return `
                        ${permisos}
                        <button class="btn btn-sm btn-outline-secondary btn-editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar"><i class="fa-solid fa-trash"></i></button>
                    `;
                }
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal() {
        $('#Password, #ConfirmarPassword').val('');
        new bootstrap.Modal('#modalFormulario').show();
    }

    $('#btnNuevo').on('click', function () {
        $('#tituloModal').text('Nuevo usuario');
        $('#usuarioIdActual').val('');
        $('#formUsuario')[0].reset();
        $('#Codigo').prop('readonly', false);
        $('#ayudaPasswordEdicion').addClass('d-none');
        abrirModal();
    });

    $('#tblUsuarios').on('click', '.btn-editar', function () {
        const usuario = tabla.row($(this).closest('tr')).data();
        if (!usuario) return;
        $('#tituloModal').text('Editar usuario');
        $('#usuarioIdActual').val(usuario.id);
        $('#Codigo').val(usuario.codigo ?? '').prop('readonly', true);
        $('#Nombre').val(usuario.nombre ?? '');
        $('#Email').val(usuario.email ?? '');
        $('#SuperUsuario').prop('checked', usuario.superUsuario === 'S');
        $('#Bloqueado').prop('checked', usuario.bloqueado === 'S');
        $('#ayudaPasswordEdicion').removeClass('d-none');
        abrirModal();
    });

    $('#tblUsuarios').on('click', '.btn-eliminar', async function () {
        const usuario = tabla.row($(this).closest('tr')).data();
        if (!usuario) return;
        const confirmado = await App.confirmarEliminar(`Se eliminará el usuario ${usuario.codigo}. No podrá iniciar sesión.`);
        if (!confirmado) return;

        const respuesta = await App.enviarJson(`/Usuarios/Eliminar?id=${usuario.id}`, 'POST', {});
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Usuario eliminado correctamente.');
        recargarTabla();
    });

    $('#btnGuardar').on('click', async function () {
        const id = $('#usuarioIdActual').val();
        const codigo = ($('#Codigo').val() || '').trim();
        const nombre = ($('#Nombre').val() || '').trim();
        const email = ($('#Email').val() || '').trim();
        const password = $('#Password').val() || '';
        const confirmacion = $('#ConfirmarPassword').val() || '';

        if (!codigo) { App.mostrarError('El código es obligatorio.'); return; }
        if (!nombre) { App.mostrarError('El nombre es obligatorio.'); return; }
        if (!id && !password) { App.mostrarError('La contraseña es obligatoria para un usuario nuevo.'); return; }
        if (password) {
            if (password.length < 8) { App.mostrarError('La contraseña debe tener al menos 8 caracteres.'); return; }
            if (password.toLowerCase() === codigo.toLowerCase()) { App.mostrarError('La contraseña no puede ser igual al código de usuario.'); return; }
            if (password !== confirmacion) { App.mostrarError('La contraseña y su confirmación no coinciden.'); return; }
        }

        const datos = {
            Codigo: codigo,
            Nombre: nombre,
            Email: email || null,
            SuperUsuario: $('#SuperUsuario').is(':checked') ? 'S' : 'N',
            Bloqueado: $('#Bloqueado').is(':checked') ? 'S' : 'N'
        };
        if (password) datos.Password = password;

        const url = id ? `/Usuarios/Editar?id=${id}` : '/Usuarios/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(id ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        recargarTabla();
    });
});
