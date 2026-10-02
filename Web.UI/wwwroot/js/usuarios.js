$(function () {
    $('#tblUsuarios').DataTable({
        ajax: { url: '/Usuarios/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo' },
            { data: 'nombre', render: d => d || '' },
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
                render: id => `<a class="btn btn-sm btn-outline-primary" href="/Usuarios/Permisos?usuarioId=${id}"><i class="fa-solid fa-key"></i> Permisos</a>`
            }
        ],
        language: App.datatableEsEs
    });
});
