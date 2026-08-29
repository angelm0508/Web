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

    // En modo riel (colapsado), los submenús quedan ocultos -- un clic en cualquier ítem
    // expande el sidebar completo primero para poder ver/navegar sus opciones.
    $sidebar.on('click', '.nav-link', function () {
        if ($sidebar.hasClass('collapsed')) {
            $sidebar.removeClass('collapsed');
            localStorage.setItem('sidebarCollapsed', 'false');
        }
    });
});

// Alternar modo claro/oscuro (el atributo data-theme ya se aplica en el <head> antes de
// pintar la página, para evitar el parpadeo; aquí solo se sincroniza el ícono y el toggle).
$(function () {
    const $icono = $('#iconoTema');

    function actualizarIcono() {
        const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
        $icono.toggleClass('fa-moon', !esOscuro).toggleClass('fa-sun', esOscuro);
    }

    actualizarIcono();

    $('#btnToggleTema').on('click', function () {
        const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
        if (esOscuro) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('tema', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('tema', 'dark');
        }
        actualizarIcono();
    });
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

    /**
     * dataSrc seguro para DataTables: la API responde HTTP 200 incluso cuando "resultado" es
     * false (sesión expirada, error de negocio, etc.), con "dato" en null. Sin este manejo,
     * DataTables intenta iterar ese null y la tabla se queda trabada en "Cargando..." para
     * siempre, sin mostrar ningún mensaje. Usar como `ajax: { url, dataSrc: App.dataSrcTabla }`.
     */
    dataSrcTabla: function (json) {
        if (!json || !json.resultado) {
            App.mostrarError((json && json.mensaje) || 'No se pudo cargar la información.');
            return [];
        }
        return json.dato || [];
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
     * Recolecta los campos de un formulario (o de cualquier contenedor con campos con "name")
     * como objeto plano, listo para enviar como JSON. Si el selector es un <form> real se usa
     * serializeArray() normalmente; si es un simple contenedor (p. ej. un <div> usado solo para
     * delimitar un grupo de campos sin poder anidar un <form> real dentro de otro), se recolectan
     * sus descendientes con "name" directamente -- jQuery.serializeArray() acepta igual una
     * colección de campos sueltos que un formulario. Los campos vacíos se envían como null (no
     * como "") para que los tipos numéricos/nullable del lado del servidor (int?, decimal?, etc.)
     * deserialicen correctamente; también descarta campos internos inyectados por la validación
     * no intrusiva de jQuery (p. ej. "__Invariant").
     */
    recolectarFormulario: function (selectorForm) {
        const datos = {};
        const $contenedor = $(selectorForm);
        const campos = $contenedor.is('form') ? $contenedor.serializeArray() : $contenedor.find(':input[name]').serializeArray();
        campos.forEach(campo => {
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
