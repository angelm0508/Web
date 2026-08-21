// Alternar sidebar
$(function () {
    const $sidebar = $('#sidebar');
    const esMovil = () => window.innerWidth < 768;

    $('#btnToggleSidebar').on('click', function () {
        if (esMovil()) {
            $sidebar.toggleClass('show');
        } else {
            $sidebar.toggleClass('collapsed');
            localStorage.setItem('sidebarCollapsed', $sidebar.hasClass('collapsed'));
        }
    });

    if (!esMovil() && localStorage.getItem('sidebarCollapsed') === 'true') {
        $sidebar.addClass('collapsed');
    }
});

/**
 * Helpers compartidos por los módulos CRUD (Artículos, Fabricantes, etc.):
 * envío de formularios como JSON con el antiforgery token, y notificaciones con SweetAlert2.
 */
const App = {
    /** Idioma español para DataTables, embebido (sin depender de un CDN externo). */
    datatableEsEs: {
        processing: 'Procesando...',
        lengthMenu: 'Mostrar _MENU_ registros',
        zeroRecords: 'No se encontraron resultados',
        emptyTable: 'Ningún dato disponible en esta tabla',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
        infoEmpty: 'Mostrando registros del 0 al 0 de un total de 0 registros',
        infoFiltered: '(filtrado de un total de _MAX_ registros)',
        search: 'Buscar:',
        loadingRecords: 'Cargando...',
        paginate: { first: 'Primero', last: 'Último', next: 'Siguiente', previous: 'Anterior' },
        aria: {
            sortAscending: ': Activar para ordenar la columna de manera ascendente',
            sortDescending: ': Activar para ordenar la columna de manera descendente'
        }
    },

    csrfToken: function () {
        return document.querySelector('meta[name="csrf-token"]').content;
    },

    mostrarError: function (mensaje) {
        Swal.fire({ icon: 'error', title: 'Error', text: mensaje || 'Ocurrió un error inesperado.' });
    },

    mostrarExito: function (mensaje) {
        return Swal.fire({ icon: 'success', title: 'Listo', text: mensaje, timer: 1500, showConfirmButton: false });
    },

    confirmarEliminar: async function (texto) {
        const resultado = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar registro?',
            text: texto || 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        });
        return resultado.isConfirmed;
    },

    /**
     * Recolecta los campos de un formulario como objeto plano, listo para enviar como JSON.
     * Los campos vacíos se envían como null (no como "") para que los tipos numéricos/nullable
     * del lado del servidor (int?, decimal?, etc.) deserialicen correctamente; también descarta
     * campos internos inyectados por la validación no intrusiva de jQuery (p. ej. "__Invariant").
     */
    recolectarFormulario: function (selectorForm) {
        const datos = {};
        $(selectorForm).serializeArray().forEach(campo => {
            if (campo.name.startsWith('__')) return;
            datos[campo.name] = campo.value === '' ? null : campo.value;
        });
        return datos;
    },

    /** POST/PUT con body JSON, devuelve el objeto Respuesta<T> deserializado. */
    enviarJson: async function (url, metodo, datos) {
        try {
            const respuesta = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': App.csrfToken()
                },
                body: JSON.stringify(datos || {})
            });
            return await respuesta.json();
        } catch (e) {
            return { resultado: false, mensaje: 'No se pudo conectar con el servidor.' };
        }
    },

    eliminar: async function (url) {
        try {
            const respuesta = await fetch(url, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': App.csrfToken() }
            });
            return await respuesta.json();
        } catch (e) {
            return { resultado: false, mensaje: 'No se pudo conectar con el servidor.' };
        }
    }
};
