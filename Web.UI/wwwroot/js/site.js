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
     * Resuelve el precio de un artículo según una lista de precio.
     * Devuelve Number(precioLista) o null (sin lista, artículo inexistente, o error de la API);
     * el llamador cae entonces al PrecioUnitario del artículo.
     */
    resolverPrecioLista: async function (codigo, listaPrecio) {
        if (!codigo || listaPrecio == null || listaPrecio === '') return null;
        try {
            const r = await $.get('/Precios/Articulo', { codigo, listaPrecio });
            if (r && r.resultado && r.dato && r.dato.precioLista != null) {
                return Number(r.dato.precioLista);
            }
        } catch (e) { /* cae a null */ }
        return null;
    },

    /** Devuelve el NumLstPrecio de un socio (o null). Para precargar la lista en edición. */
    obtenerListaDeSocio: async function (codigoSn) {
        if (!codigoSn) return null;
        try {
            const r = await $.get('/Precios/ListaDeSocio', { codigo: codigoSn });
            const n = r && r.resultado && r.dato ? (r.dato.numLstPrecio ?? null) : null;
            return n != null ? Number(n) : null;
        } catch (e) { return null; }
    },

    /**
     * Consulta las unidades de medida activas del grupo de un artículo (la base primero).
     * Devuelve un arreglo [{ uomEntry, codigo, nombre, factor, esBase }]; vacío si no tiene grupo.
     */
    obtenerUnidadesArticulo: async function (codigo) {
        if (!codigo) return [];
        try {
            const r = await $.get('/Precios/Unidades', { codigo });
            if (r && r.resultado && r.dato && Array.isArray(r.dato.unidades)) {
                return r.dato.unidades.map(u => ({
                    uomEntry: Number(u.uomEntry ?? u.UomEntry),
                    codigo: String(u.codigo ?? u.Codigo ?? ''),
                    nombre: u.nombre ?? u.Nombre ?? '',
                    factor: Number(u.factor ?? u.Factor ?? 1),
                    esBase: Boolean(u.esBase ?? u.EsBase)
                }));
            }
        } catch (e) { /* cae a vacío */ }
        return [];
    },

    /** Celda HTML de la columna «UM» en la tabla de líneas de un documento (escapa texto dinámico). */
    celdaUnidadLinea: function (linea) {
        const cod = linea.uomCodigo ?? linea.UomCodigo ?? linea._uomCodigo ?? '';
        const factor = Number(linea.factorUom ?? linea.FactorUom ?? linea._factorUom ?? 1);
        const cant = Number(linea.cantidad ?? linea.Cantidad ?? 0);
        const base = linea.cantidadBase ?? linea.CantidadBase ?? linea._cantidadBase ?? Number((cant * factor).toFixed(6));
        const esc = v => $('<div>').text(v ?? '').html();
        if (!cod) return '<span class="text-muted">—</span>';
        if (factor !== 1 && factor > 0) {
            return `${esc(cod)}<div class="small text-muted">Base: ${base} (×${factor})</div>`;
        }
        return esc(cod);
    },

    /**
     * Conecta el <select> de unidad de medida de un panel de línea con la cantidad y el precio:
     * al elegir artículo carga sus unidades (base por defecto); al cambiar de unidad recalcula
     * precio = precioBase × factor (editable por el usuario) y muestra la cantidad en unidad base.
     */
    unidadesLinea: function (opciones) {
        const $select = opciones.select;
        const $textoBase = opciones.textoBase;
        const $inputCantidad = opciones.inputCantidad;
        const $inputPrecio = opciones.inputPrecio;
        const onCambio = opciones.onCambio || function () {};
        const esc = v => $('<div>').text(v ?? '').html();

        let unidades = [];
        let codigoBase = '';
        let precioBase = null;
        let idCarga = 0;

        function factorActual() {
            const f = Number($select.find('option:selected').data('factor'));
            return f > 0 ? f : 1;
        }

        function codigoActual() {
            return String($select.find('option:selected').data('codigo') ?? '');
        }

        function actualizarTextoBase() {
            if (!$textoBase || $textoBase.length === 0) return;
            const factor = factorActual();
            const cant = Number($inputCantidad ? $inputCantidad.val() : 0) || 0;
            if (unidades.length > 0 && factor !== 1) {
                const totalBase = Number((cant * factor).toFixed(6));
                $textoBase.text(`Cant. base: ${totalBase} ${codigoBase} (×${factor})`);
            } else {
                $textoBase.text('');
            }
        }

        $select.on('change', function () {
            const factor = factorActual();
            if (precioBase != null && $inputPrecio && $inputPrecio.length) {
                $inputPrecio.val(Number((precioBase * factor).toFixed(2)));
            }
            actualizarTextoBase();
            onCambio();
        });

        if ($inputPrecio && $inputPrecio.length) {
            $inputPrecio.on('input', function () {
                const p = Number($inputPrecio.val());
                if (!Number.isNaN(p) && $inputPrecio.val() !== '') {
                    precioBase = p / factorActual();
                }
            });
        }

        if ($inputCantidad && $inputCantidad.length) {
            $inputCantidad.on('input change', actualizarTextoBase);
        }

        function limpiar() {
            idCarga++;
            unidades = [];
            codigoBase = '';
            precioBase = null;
            $select.html('<option value="" data-factor="1" data-codigo="">—</option>').prop('disabled', true);
            if ($textoBase && $textoBase.length) $textoBase.text('');
        }

        limpiar();

        return {
            limpiar,
            factorActual,
            fijarPrecioBase: function (nuevoPrecioBase, actualizarInput = true) {
                precioBase = nuevoPrecioBase != null && nuevoPrecioBase !== '' ? Number(nuevoPrecioBase) : null;
                if (actualizarInput && precioBase != null && $inputPrecio && $inputPrecio.length) {
                    $inputPrecio.val(Number((precioBase * factorActual()).toFixed(2)));
                }
                actualizarTextoBase();
            },
            cargarParaArticulo: async function (codArticulo, cfg = {}) {
                const esteId = ++idCarga;
                if (!codArticulo) {
                    limpiar();
                    return;
                }
                const lista = await App.obtenerUnidadesArticulo(codArticulo);
                if (esteId !== idCarga) return;
                unidades = lista;
                const base = lista.find(u => u.esBase) || lista[0];
                codigoBase = base ? base.codigo : '';

                if (lista.length === 0) {
                    $select.html('<option value="" data-factor="1" data-codigo="">Sin unidad</option>').prop('disabled', true);
                } else {
                    $select.html(lista.map(u => {
                        const sufijo = u.factor !== 1 ? ` (×${u.factor})` : '';
                        const nom = u.nombre && u.nombre !== u.codigo ? ` - ${esc(u.nombre)}` : '';
                        return `<option value="${u.uomEntry}" data-factor="${u.factor}" data-codigo="${esc(u.codigo)}">${esc(u.codigo)}${nom}${sufijo}</option>`;
                    }).join(''));
                    const inicial = cfg.uomEntryInicial != null ? String(cfg.uomEntryInicial) : (base ? String(base.uomEntry) : '');
                    if (inicial && $select.find(`option[value="${inicial}"]`).length > 0) {
                        $select.val(inicial);
                    } else if (base) {
                        $select.val(String(base.uomEntry));
                    }
                    $select.prop('disabled', Boolean(cfg.bloqueado));
                }

                if (cfg.precioUnitarioBase !== undefined) {
                    precioBase = cfg.precioUnitarioBase != null ? Number(cfg.precioUnitarioBase) : null;
                    if (cfg.recalcularPrecio !== false && precioBase != null && $inputPrecio && $inputPrecio.length) {
                        $inputPrecio.val(Number((precioBase * factorActual()).toFixed(2)));
                    }
                }
                actualizarTextoBase();
                onCambio();
            },
            leer: function () {
                const val = $select.val();
                const factor = factorActual();
                const cant = Number($inputCantidad ? $inputCantidad.val() : 0) || 0;
                return {
                    UomEntry: val ? Number(val) : null,
                    _uomCodigo: codigoActual(),
                    _factorUom: factor,
                    _cantidadBase: Number((cant * factor).toFixed(6))
                };
            }
        };
    },

    // ---- "Copiar a": líneas con documento base (compartido por pedidos.js, entregas.js y facturas.js) ----

    /** Borrador del documento base que el servidor embebe en #datosBorrador; null si el formulario no viene de "Copiar a". */
    leerBorrador: function () {
        const el = document.getElementById('datosBorrador');
        if (!el) return null;
        try { return JSON.parse(el.textContent); } catch (e) { return null; }
    },

    /** Etiqueta del documento origen de un borrador, p. ej. "Cotización 12" (para el mensaje de éxito de "Copiar a"). */
    etiquetaOrigen: function (borrador) {
        const nombres = { 3: 'Cotización', 4: 'Pedido', 5: 'Entrega', 70: 'Orden de servicio' };
        return `${nombres[borrador.origenTipo] ?? 'Documento'} ${borrador.origenNumDoc}`;
    },

    /**
     * Convierte las líneas abiertas del borrador en líneas locales del formulario (mismas propiedades que arma el panel
     * de línea). Los campos con prefijo "_" son solo de la interfaz y se quitan antes de enviar (sinCamposInternos).
     */
    lineasDesdeBorrador: function (borrador, idInicial) {
        const nombres = { 3: 'Cotización', 4: 'Pedido', 5: 'Entrega', 6: 'Factura', 70: 'Orden de servicio' };
        let id = idInicial;
        const lineas = (borrador.lineas || []).map(l => {
            const cantidad = Number(l.cantidadAbierta);
            const origen = Number(l.cantidadOrigen);
            const proporcion = origen > 0 ? cantidad / origen : 1;
            const impuesto = l.impuesto != null ? Number((Number(l.impuesto) * proporcion).toFixed(2)) : 0;
            const precio = Number(l.precio ?? 0);
            const prctjeDesc = Number(l.prctjeDesc ?? 0);
            const bruto = cantidad * precio;
            const total = Number((bruto - bruto * (prctjeDesc / 100) + impuesto).toFixed(2));
            const factorUom = Number(l.factorUom ?? 1) || 1;
            return {
                _id: id++,
                _abierta: cantidad,
                _baseTexto: `${nombres[l.baseTipo] ?? 'Documento'} ${borrador.origenNumDoc} · abierto: ${cantidad}`,
                _uomCodigo: l.uomCodigo ?? '',
                _factorUom: factorUom,
                _cantidadBase: Number((cantidad * factorUom).toFixed(6)),
                BaseTipo: l.baseTipo, BaseEntry: l.baseEntry, BaseLinea: l.baseLinea,
                CodArticulo: l.codArticulo, Descripcion: l.descripcion,
                UomEntry: l.uomEntry ?? null,
                Cantidad: cantidad, Precio: l.precio, PrecioBruto: l.precioBruto, PrctjeDesc: l.prctjeDesc,
                CodigoImpuesto: l.codigoImpuesto, CodAlmacen: l.codAlmacen,
                Impuesto: impuesto, TotalLinea: total
            };
        });
        return { lineas, proximoId: id };
    },
    /** Quita los campos internos (prefijo "_") antes de enviar una línea a la API. */
    sinCamposInternos: function (linea) {
        return Object.fromEntries(Object.entries(linea).filter(([clave]) => !clave.startsWith('_')));
    },

    /** Si la URL trae ?baseTipo=&baseEntry= (viene de "Copiar a"), limpia la URL y llama a abrir(baseTipo, baseEntry). */
    abrirCopiaSiCorresponde: function (abrir) {
        const q = new URLSearchParams(window.location.search);
        const baseTipo = q.get('baseTipo');
        const baseEntry = q.get('baseEntry');
        if (!baseTipo || !baseEntry) return;
        history.replaceState(null, '', window.location.pathname);
        abrir(baseTipo, baseEntry);
    },

    /** Botón desplegable "Copiar a" de una fila de un listado. destinos: [{ nombre, url }]; '' si no hay destinos. */
    botonCopiarA: function (tipoOrigen, entry, destinos) {
        if (!destinos || destinos.length === 0) return '';
        const items = destinos.map(d =>
            `<li><a class="dropdown-item btn-copiar-a" href="#" data-url="${d.url}" data-tipo="${tipoOrigen}" data-entry="${entry}">${d.nombre}</a></li>`).join('');
        return `<div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Copiar a"><i class="fa-solid fa-copy"></i></button>
            <ul class="dropdown-menu dropdown-menu-end">${items}</ul>
        </div>`;
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
     * @param {() => object} [opciones.parametros] - parámetros extra que se envían en cada búsqueda además de `texto`
     *        (p. ej. { tipo: 'I' }); se evalúa en cada petición, así que puede depender del estado del formulario.
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
        // requerido=true (por defecto): en el blur con texto no resuelto se marca is-invalid y se
        // devuelve el foco al input (correcto para campos obligatorios de un modal). requerido=false:
        // filtro opcional (p. ej. Existencias) -- se deja pasar el blur sin error ni trampa de foco.
        const requerido = opciones.requerido ?? true;
        const parametros = opciones.parametros || (() => ({}));

        let resultados = [];
        let resuelto = true;
        let indiceActivo = -1;
        let temporizador = null;
        let cerrandoModal = false;
        let ultimaBusqueda = 0;

        const $modal = $texto.closest('.modal');
        $modal.on('mousedown.autocompletar', '[data-bs-dismiss="modal"]', () => { cerrandoModal = true; });
        $modal.on('hide.bs.modal.autocompletar', () => { cerrandoModal = true; });
        $modal.on('hidden.bs.modal.autocompletar', () => { cerrandoModal = false; });

        function marcarResuelto(valor) {
            resuelto = valor;
            if (valor) {
                $texto.removeClass('is-invalid');
                $error.addClass('d-none');
            }
        }

        function mostrarError() {
            $texto.addClass('is-invalid');
            $error.removeClass('d-none');
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
            try {
                const respuesta = await $.get(endpoint, { texto, ...parametros() });
                if (idBusqueda !== ultimaBusqueda) return; // ya hay una búsqueda más reciente en curso
                resultados = (respuesta.resultado && respuesta.dato) ? respuesta.dato.slice(0, maxResultados) : [];
            } catch (e) {
                if (idBusqueda !== ultimaBusqueda) return;
                resultados = [];
            }
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
            if (!resuelto && requerido) {
                mostrarError();
                if (!cerrandoModal) {
                    setTimeout(() => $texto.trigger('focus'), 0);
                }
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

// "Copiar a": navega al listado del destino, que abre su formulario precargado (App.abrirCopiaSiCorresponde).
$(document).on('click', '.btn-copiar-a', function (e) {
    e.preventDefault();
    window.location.href = `${$(this).data('url')}?baseTipo=${$(this).data('tipo')}&baseEntry=${$(this).data('entry')}`;
});
