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
    },

    /**
     * Convierte un <input type="text"> en un buscador con autocompletado contra un endpoint de
     * la API. No depende de ninguna librería externa. Los elementos (texto visible, oculto con
     * el código real, lista de sugerencias, mensaje de error) ya deben existir en el markup --
     * este helper solo los conecta, no crea nada nuevo en el DOM.
     *
     * @param {object} opciones
     * @param {jQuery} opciones.texto - <input type="text"> visible donde se escribe.
     * @param {jQuery} opciones.oculto - <input type="hidden"> donde queda el código real elegido.
     * @param {jQuery} opciones.lista - <ul> donde se pintan las sugerencias.
     * @param {jQuery} opciones.error - elemento con el mensaje de error (se muestra/oculta).
     * @param {string} opciones.endpoint - URL a la que se pide `?texto=...`, responde Respuesta<T[]>.
     * @param {(item: object) => string} opciones.obtenerCodigo
     * @param {(item: object) => string} opciones.obtenerEtiqueta
     * @param {(item: object|null) => void} [opciones.onSeleccion] - recibe el objeto completo
     *        elegido, o null si el campo quedó vacío.
     * @param {number} [opciones.minCaracteres=2]
     * @param {number} [opciones.debounceMs=300]
     * @param {number} [opciones.maxResultados=10]
     * @returns {{ establecer: (item: object|null) => void }} para precargar el campo (ej. al editar).
     */
    autocompletar: function (opciones) {
        const $texto = opciones.texto;
        const $oculto = opciones.oculto;
        const $lista = opciones.lista;
        const $error = opciones.error;
        const endpoint = opciones.endpoint;
        const obtenerCodigo = opciones.obtenerCodigo;
        const obtenerEtiqueta = opciones.obtenerEtiqueta;
        const onSeleccion = opciones.onSeleccion || function () {};
        const minCaracteres = opciones.minCaracteres ?? 2;
        const debounceMs = opciones.debounceMs ?? 300;
        const maxResultados = opciones.maxResultados ?? 10;

        let resultados = [];
        let resuelto = true;
        let indiceActivo = -1;
        let temporizador = null;
        let cerrandoModal = false;
        let ultimaBusqueda = 0;

        const $modal = $texto.closest('.modal');
        $modal.on('mousedown.autocompletar', '[data-bs-dismiss="modal"]', () => { cerrandoModal = true; });
        $modal.on('hidden.bs.modal.autocompletar', () => { cerrandoModal = false; });

        function marcarResuelto(valor) {
            resuelto = valor;
            $texto.toggleClass('is-invalid', !valor);
            $error.toggleClass('d-none', valor);
        }

        function ocultarLista() {
            $lista.addClass('d-none').empty();
            indiceActivo = -1;
        }

        function escaparHtml(texto) {
            return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        function pintarLista() {
            if (resultados.length === 0) {
                ocultarLista();
                return;
            }
            $lista.html(resultados.map((item, i) => `
                <li class="list-group-item list-group-item-action${i === indiceActivo ? ' active' : ''}" data-indice="${i}" style="cursor: pointer;">
                    ${escaparHtml(obtenerEtiqueta(item))}
                </li>
            `).join('')).removeClass('d-none');
        }

        function elegir(item) {
            $texto.val(obtenerEtiqueta(item));
            $oculto.val(obtenerCodigo(item)).trigger('change');
            marcarResuelto(true);
            ocultarLista();
            onSeleccion(item);
        }

        function limpiar() {
            $texto.val('');
            $oculto.val('').trigger('change');
            marcarResuelto(true);
            ocultarLista();
            onSeleccion(null);
        }

        async function buscar(texto) {
            const idBusqueda = ++ultimaBusqueda;
            const respuesta = await $.get(endpoint, { texto });
            if (idBusqueda !== ultimaBusqueda) return; // ya hay una búsqueda más reciente en curso
            resultados = (respuesta.resultado && respuesta.dato) ? respuesta.dato.slice(0, maxResultados) : [];
            indiceActivo = -1;
            pintarLista();
        }

        $texto.on('input', function () {
            const valor = $texto.val();
            marcarResuelto(valor === '');
            $oculto.val('').trigger('change');
            clearTimeout(temporizador);
            if (valor.length < minCaracteres) {
                ocultarLista();
                return;
            }
            temporizador = setTimeout(() => buscar(valor), debounceMs);
        });

        if (minCaracteres === 0) {
            $texto.on('focus', function () {
                if ($texto.val() === '') buscar('');
            });
        }

        $texto.on('keydown', function (e) {
            if ($lista.hasClass('d-none') || resultados.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                indiceActivo = Math.min(indiceActivo + 1, resultados.length - 1);
                pintarLista();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                indiceActivo = Math.max(indiceActivo - 1, 0);
                pintarLista();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (indiceActivo >= 0) elegir(resultados[indiceActivo]);
            } else if (e.key === 'Escape') {
                ocultarLista();
            }
        });

        // mousedown (no click) para elegir: evita que el blur del input se dispare antes de poder
        // leer en qué sugerencia se hizo clic (el orden normal de eventos es mousedown -> blur -> click).
        $lista.on('mousedown', 'li', function (e) {
            e.preventDefault();
            const indice = Number($(this).data('indice'));
            elegir(resultados[indice]);
        });

        $texto.on('blur', function () {
            if ($texto.val() === '') {
                limpiar();
                return;
            }
            if (!resuelto && !cerrandoModal) {
                setTimeout(() => $texto.trigger('focus'), 0);
            }
        });

        return {
            establecer: function (item) {
                if (item) {
                    elegir(item);
                } else {
                    limpiar();
                }
            }
        };
    }
};
