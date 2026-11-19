/*
 * Punto de venta (Views/Pos/Index.cshtml). Un solo IIFE con módulos internos: Puro (cálculos y HTML sin DOM, se pueden
 * probar con node), Buscador, Lista, Cliente, Cobro, Ticket, VentasDelDia y Atajos.
 *
 * El navegador NO fija importes: el total que se muestra es una ESTIMACIÓN con los precios de la búsqueda y la tasa del
 * impuesto de la configuración, redondeada como la API (línea: bruto = cantidad × precio a 2 decimales, medio hacia
 * arriba; impuesto = bruto sin redondear × tasa / 100 a 2 decimales). Lo que vale es el ticket que devuelve la API.
 */
(function (global) {
    'use strict';

    // =====================================================================================================
    // Puro: sin DOM ni jQuery.
    // =====================================================================================================
    const Puro = (function () {
        const MAXIMA_CANTIDAD = 99999;

        /** Redondeo a 2 decimales, medio alejándose de cero (MidpointRounding.AwayFromZero), sin el ruido binario de JS. */
        function redondear2(valor) {
            const n = Number(valor);
            if (!Number.isFinite(n) || n === 0) return 0;
            // toFixed(10) usa el valor binario exacto: 3.3449999999999998 -> "3.3450000000".
            const partes = Math.abs(n).toFixed(10).split('.');
            let centavos = Number(partes[0]) * 100 + Number(partes[1].slice(0, 2));
            if (Number(partes[1][2]) >= 5) centavos += 1;
            const r = centavos / 100;
            return n < 0 && r !== 0 ? -r : r;
        }

        /** Importe escrito por el usuario: número >= 0 con 2 decimales; vacío, inválido o negativo = 0. */
        function normalizarImporte(valor) {
            if (valor === null || valor === undefined) return 0;
            const texto = String(valor).trim().replace(',', '.');
            if (texto === '') return 0;
            const n = Number(texto);
            if (!Number.isFinite(n) || n < 0) return 0;
            return redondear2(n);
        }

        /** Cantidad de una línea: entero entre 1 y MAXIMA_CANTIDAD (v1 sin decimales). */
        function normalizarCantidad(valor) {
            const n = Math.floor(Number(valor));
            if (!Number.isFinite(n) || n < 1) return 1;
            return Math.min(n, MAXIMA_CANTIDAD);
        }

        function calcularLinea(cantidad, precio, tasa) {
            const brutoSinRedondear = Number(cantidad) * Number(precio);
            const bruto = redondear2(brutoSinRedondear);
            const impuesto = redondear2(brutoSinRedondear * Number(tasa || 0) / 100);
            return { bruto, impuesto, total: redondear2(bruto + impuesto) };
        }

        function calcularTotales(lineas, tasa) {
            let subtotal = 0;
            let impuesto = 0;
            let total = 0;
            let unidades = 0;
            (lineas || []).forEach(l => {
                const c = calcularLinea(l.cantidad, l.precio, tasa);
                subtotal += c.bruto;
                impuesto += c.impuesto;
                total += c.total;
                unidades += Number(l.cantidad);
            });
            return { subtotal: redondear2(subtotal), impuesto: redondear2(impuesto), total: redondear2(total), unidades };
        }

        function mismoCodigo(a, b) {
            return String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();
        }

        /** Agrega 1 unidad del artículo (si ya está suma 1). Devuelve una lista nueva. */
        function agregarArticulo(lineas, articulo) {
            const copia = (lineas || []).map(l => Object.assign({}, l));
            const existente = copia.find(l => l.codigo === articulo.codigo);
            if (existente) {
                existente.cantidad = normalizarCantidad(existente.cantidad + 1);
                existente.precio = Number(articulo.precio);
                existente.existencias = Number(articulo.existencias);
                existente.noDisponible = false;
            } else {
                copia.push({
                    codigo: articulo.codigo,
                    nombre: articulo.nombre || articulo.codigo,
                    precio: Number(articulo.precio),
                    existencias: Number(articulo.existencias ?? 0),
                    inventariable: Boolean(articulo.inventariable),
                    cantidad: 1,
                    noDisponible: false
                });
            }
            return copia;
        }

        function cambiarCantidad(lineas, codigo, cantidad) {
            return (lineas || []).map(l => l.codigo === codigo ? Object.assign({}, l, { cantidad: normalizarCantidad(cantidad) }) : Object.assign({}, l));
        }

        function quitarLinea(lineas, codigo) {
            return (lineas || []).filter(l => l.codigo !== codigo).map(l => Object.assign({}, l));
        }

        /** Aviso informativo de existencias (no bloquea: la API valida el stock al cobrar). */
        function avisoExistencias(linea) {
            if (!linea.inventariable) return null;
            if (Number(linea.cantidad) > Number(linea.existencias)) {
                return `Existencias insuficientes (disponible: ${formatoCantidad(linea.existencias)})`;
            }
            return null;
        }

        /**
         * Estado del cobro. pagos: [{ codigo, tipo, nombre, monto, referencia, banco, fechaCheque }]. Igual que la API: el
         * cambio solo puede salir del efectivo y cada forma con importe pide sus datos según su TipoDato (C, T, J).
         */
        function evaluarCobro(total, pagos, formaEfectivo) {
            const totalR = redondear2(total);
            let pagado = 0;
            let efectivo = 0;
            let problema = null;
            const conImporte = [];
            (pagos || []).forEach(p => {
                const monto = normalizarImporte(p.monto);
                if (monto <= 0) return;
                conImporte.push(p);
                pagado += monto;
                if (mismoCodigo(p.codigo, formaEfectivo)) efectivo += monto;
            });
            pagado = redondear2(pagado);
            efectivo = redondear2(efectivo);
            const falta = Math.max(0, redondear2(totalR - pagado));
            const cambio = Math.max(0, redondear2(pagado - totalR));

            if (totalR <= 0) {
                problema = 'La venta no tiene importe.';
            } else if (conImporte.length === 0) {
                problema = 'Indica al menos una forma de pago.';
            } else if (falta > 0) {
                problema = `Falta cobrar ${formatoDinero(falta)}.`;
            } else if (cambio > efectivo) {
                problema = 'El cambio solo puede darse con efectivo.';
            } else {
                for (const p of conImporte) {
                    const ref = String(p.referencia ?? '').trim();
                    const banco = String(p.banco ?? '').trim();
                    if (p.tipo === 'C' && !ref) { problema = `${p.nombre}: indica el número de cheque.`; break; }
                    if (p.tipo === 'C' && !banco) { problema = `${p.nombre}: indica el banco.`; break; }
                    if (p.tipo === 'T' && !ref) { problema = `${p.nombre}: indica la referencia de la transferencia.`; break; }
                    if (p.tipo === 'J' && !ref) { problema = `${p.nombre}: indica la autorización o los últimos 4 dígitos.`; break; }
                }
            }
            return { total: totalR, pagado, efectivo, falta, cambio, problema, puedeConfirmar: problema === null };
        }

        /** Pagos para la API: solo los que tienen importe, y los datos extra solo si su forma los usa. */
        function componerPagos(pagos) {
            const limpio = v => {
                const t = String(v ?? '').trim();
                return t === '' ? null : t;
            };
            return (pagos || [])
                .map(p => ({ p, monto: normalizarImporte(p.monto) }))
                .filter(x => x.monto > 0)
                .map(({ p, monto }) => ({
                    codFormaPago: p.codigo,
                    monto,
                    referencia: ['C', 'T', 'J'].includes(p.tipo) ? limpio(p.referencia) : null,
                    banco: ['C', 'T'].includes(p.tipo) ? limpio(p.banco) : null,
                    fechaCheque: p.tipo === 'C' ? limpio(p.fechaCheque) : null
                }));
        }

        /** Cuerpo de POST /Pos/Vender. Sin precios ni cajero: los fija la API. */
        function componerSolicitud(codigoCliente, nit, lineas, pagos) {
            const nitLimpio = String(nit ?? '').trim();
            return {
                codigoCliente: codigoCliente || null,
                nit: nitLimpio === '' ? null : nitLimpio,
                lineas: (lineas || []).map(l => ({ codArticulo: l.codigo, cantidad: normalizarCantidad(l.cantidad) })),
                pagos: componerPagos(pagos)
            };
        }

        /** Billete rápido: suma al efectivo; si el efectivo todavía es el total precargado, el primer billete lo reemplaza. */
        function sumarBillete(efectivoActual, billete, esPrecarga) {
            return esPrecarga ? redondear2(billete) : redondear2(normalizarImporte(efectivoActual) + Number(billete));
        }

        /** Efectivo exacto: lo que falta después de las otras formas (>= 0). */
        function efectivoExacto(total, otrosPagos) {
            return Math.max(0, redondear2(Number(total) - normalizarImporte(otrosPagos)));
        }

        function escaparHtml(texto) {
            return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        function formatoDinero(n) {
            return redondear2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function formatoCantidad(n) {
            return Number(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
        }

        /** Hora HH:mm de una fecha JSON sin zona ("2026-11-19T10:15:00"): se toma del texto para no correrla de zona. */
        function horaDe(fecha) {
            const m = /T(\d{2}:\d{2})/.exec(String(fecha ?? ''));
            return m ? m[1] : '';
        }

        function htmlLinea(linea, tasa) {
            const c = calcularLinea(linea.cantidad, linea.precio, tasa);
            const aviso = avisoExistencias(linea);
            const cod = escaparHtml(linea.codigo);
            return `<tr data-codigo="${cod}">
                <td>
                    <div class="fw-semibold">${escaparHtml(linea.nombre)}</div>
                    <div class="small text-muted font-monospace">${cod}</div>
                    ${aviso ? `<span class="pos-aviso-existencias"><i class="fa-solid fa-triangle-exclamation me-1"></i>${escaparHtml(aviso)}</span>` : ''}
                    ${linea.noDisponible ? '<span class="pos-aviso-existencias"><i class="fa-solid fa-triangle-exclamation me-1"></i>No disponible para este cliente</span>' : ''}
                </td>
                <td class="text-end font-monospace">${formatoDinero(linea.precio)}</td>
                <td class="text-center">
                    <div class="pos-cantidad">
                        <button type="button" class="btn btn-outline-secondary pos-btn-cantidad pos-menos" aria-label="Restar uno">&minus;</button>
                        <input type="number" class="form-control pos-input-cantidad" min="1" max="${MAXIMA_CANTIDAD}" step="1" value="${normalizarCantidad(linea.cantidad)}" aria-label="Cantidad">
                        <button type="button" class="btn btn-outline-secondary pos-btn-cantidad pos-mas" aria-label="Sumar uno">+</button>
                    </div>
                </td>
                <td class="text-end font-monospace">${formatoDinero(c.bruto)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-outline-danger pos-btn-cantidad pos-quitar" aria-label="Quitar artículo"><i class="fa-solid fa-xmark"></i></button>
                </td>
            </tr>`;
        }

        function htmlSugerencia(articulo, indice, activo) {
            const sinExistencias = articulo.inventariable && Number(articulo.existencias) <= 0;
            const barras = articulo.codigoBarras ? ` · ${escaparHtml(articulo.codigoBarras)}` : '';
            return `<li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center${activo ? ' active' : ''}"
                        id="posSugerencia${indice}" role="option" aria-selected="${activo ? 'true' : 'false'}" data-indice="${indice}">
                <div>
                    <div class="fw-semibold">${escaparHtml(articulo.nombre)}</div>
                    <div class="small font-monospace${activo ? '' : ' text-muted'}">${escaparHtml(articulo.codigo)}${barras}</div>
                </div>
                <div class="text-end">
                    <div class="font-monospace">${formatoDinero(articulo.precio)}</div>
                    <div class="small${sinExistencias ? ' text-danger' : (activo ? '' : ' text-muted')}">Exist.: ${formatoCantidad(articulo.existencias)}</div>
                </div>
            </li>`;
        }

        function htmlRapido(articulo, indice) {
            return `<button type="button" class="btn btn-outline-primary pos-rapido" data-indice="${indice}" title="${escaparHtml(articulo.nombre)}">
                <span>${escaparHtml(articulo.nombre)}</span>
                <span class="pos-rapido-precio">${formatoDinero(articulo.precio)}</span>
            </button>`;
        }

        function htmlVentaDelDia(venta) {
            const cancelada = venta.cancelada ? ' <span class="badge text-bg-danger">Cancelada</span>' : '';
            return `<tr${venta.cancelada ? ' class="text-muted"' : ''}>
                <td class="font-monospace">${escaparHtml(horaDe(venta.fecha))}</td>
                <td class="font-monospace">${escaparHtml(venta.serie)}-${escaparHtml(venta.numDoc)}</td>
                <td>${escaparHtml(venta.nombreCliente || venta.codigoCliente)}${cancelada}</td>
                <td class="text-end font-monospace">${formatoDinero(venta.total)}</td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-primary pos-reimprimir" data-factura="${Number(venta.facturaEntry)}">
                        <i class="fa-solid fa-print me-1"></i>Reimprimir
                    </button>
                </td>
            </tr>`;
        }

        return {
            MAXIMA_CANTIDAD,
            redondear2, normalizarImporte, normalizarCantidad, calcularLinea, calcularTotales,
            agregarArticulo, cambiarCantidad, quitarLinea, avisoExistencias,
            evaluarCobro, componerPagos, componerSolicitud, sumarBillete, efectivoExacto,
            escaparHtml, formatoDinero, formatoCantidad, horaDe, mismoCodigo,
            htmlLinea, htmlSugerencia, htmlRapido, htmlVentaDelDia
        };
    })();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Puro;
    }

    const $ = global.jQuery;
    if (!$ || !global.document) return;

    $(function () {
        const raiz = document.getElementById('posApp');
        if (!raiz) return;   // sin configuración completa la vista muestra solo el aviso

        const config = {
            clienteDefecto: {
                codigo: raiz.dataset.clienteCodigo || '',
                nombre: raiz.dataset.clienteNombre || raiz.dataset.clienteCodigo || '',
                nit: raiz.dataset.clienteNit || ''
            },
            tasa: Number(raiz.dataset.tasa) || 0,
            formaEfectivo: raiz.dataset.formaEfectivo || '',
            puedeCobrar: raiz.dataset.puedeCobrar === 'true'
        };

        // ---- Utilidades de pantalla ----------------------------------------------------------------------
        let modalesAbiertos = 0;
        $(raiz).on('show.bs.modal', '.modal', () => { modalesAbiertos++; });
        $(raiz).on('hidden.bs.modal', '.modal', () => {
            modalesAbiertos = Math.max(0, modalesAbiertos - 1);
            enfocarBuscador();
        });

        function hayDialogoAbierto() {
            return modalesAbiertos > 0 || (global.Swal && Swal.isVisible());
        }

        function enfocarBuscador(seleccionar) {
            setTimeout(() => {
                if (hayDialogoAbierto()) return;
                const el = document.getElementById('posBuscador');
                el.focus();
                if (seleccionar) el.select();
            }, 0);
        }

        function modal(id) {
            return bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
        }

        /** Cierra un modal (si está abierto) y luego llama a despues: evita abrir otro mientras el primero se oculta. */
        function cerrarModalY(id, despues) {
            const el = document.getElementById(id);
            if (!el.classList.contains('show')) {
                despues();
                return;
            }
            $(el).one('hidden.bs.modal', () => despues());
            modal(id).hide();
        }

        /** SweetAlert de error (diferido: que la tecla que lo provocó no lo cierre) y foco de vuelta al buscador. */
        function avisarError(mensaje) {
            setTimeout(() => {
                Swal.fire({ icon: 'error', title: 'Error', text: mensaje || 'Ocurrió un error inesperado.' })
                    .then(() => enfocarBuscador());
            }, 0);
        }

        let temporizadorMensaje = null;
        function mostrarMensaje(texto) {
            const $m = $('#posMensajeBuscador');
            clearTimeout(temporizadorMensaje);
            $m.text(texto).removeClass('d-none');
            temporizadorMensaje = setTimeout(() => $m.addClass('d-none').text(''), 5000);
        }

        function ocultarMensaje() {
            clearTimeout(temporizadorMensaje);
            $('#posMensajeBuscador').addClass('d-none').text('');
        }

        // Un clic fuera de un campo devuelve el foco al buscador (los botones hacen su acción y luego vuelve).
        $('#posPantalla').on('click', function (e) {
            if ($(e.target).closest('input, select, textarea, a').length) return;
            enfocarBuscador();
        });

        // =================================================================================================
        // Cliente
        // =================================================================================================
        const Cliente = (function () {
            let actual = Object.assign({}, config.clienteDefecto);
            let buscador = null;

            function pintar() {
                $('#posClienteNombre').text(actual.nombre || actual.codigo);
                $('#posClienteCodigo').text(actual.codigo);
            }

            function fijar(cliente, refrescar) {
                const cambio = !Puro.mismoCodigo(cliente.codigo, actual.codigo);
                actual = { codigo: cliente.codigo, nombre: cliente.nombre || cliente.codigo, nit: cliente.nit || '' };
                $('#posNit').val(actual.nit || 'CF');
                pintar();
                if (cambio && refrescar) Lista.refrescarPrecios();
            }

            function esDefecto() {
                return Puro.mismoCodigo(actual.codigo, config.clienteDefecto.codigo);
            }

            function abrir() {
                buscador.establecer(null);
                modal('posModalCliente').show();
            }

            function iniciar() {
                buscador = App.autocompletar({
                    texto: $('#posClienteBuscar'),
                    oculto: $('#posClienteBuscarCodigo'),
                    lista: $('#posClienteSugerencias'),
                    error: $('#posClienteBuscarError'),
                    endpoint: '/Pos/Clientes',
                    obtenerCodigo: c => c.codigo,
                    obtenerEtiqueta: c => `${c.codigo} - ${c.nombre}${c.nit ? ' (NIT ' + c.nit + ')' : ''}`,
                    onSeleccion: c => {
                        if (!c) return;
                        fijar(c, true);
                        modal('posModalCliente').hide();
                    },
                    minCaracteres: 2,
                    debounceMs: 250,
                    maxResultados: 20,
                    requerido: false
                });
                $('#posModalCliente').on('shown.bs.modal', () => $('#posClienteBuscar').trigger('focus'));
                $('#posBtnCambiarCliente').on('click', abrir);
                $('#posBtnClienteDefecto').on('click', () => {
                    fijar(config.clienteDefecto, true);
                    modal('posModalCliente').hide();
                });
                $('#posNit').on('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        $(this).trigger('blur');
                        enfocarBuscador();
                    }
                });
                fijar(config.clienteDefecto, false);
            }

            return {
                iniciar, abrir, esDefecto,
                codigo: () => actual.codigo,
                nit: () => $('#posNit').val(),
                restablecer: () => fijar(config.clienteDefecto, false)
            };
        })();

        // =================================================================================================
        // Lista (venta en curso)
        // =================================================================================================
        const Lista = (function () {
            let lineas = [];
            let versionPrecios = 0;

            function pintar() {
                $('#posLineas').html(lineas.map(l => Puro.htmlLinea(l, config.tasa)).join(''));
                $('#posSinLineas').toggleClass('d-none', lineas.length > 0);
                const t = Puro.calcularTotales(lineas, config.tasa);
                $('#posSubtotal').text(Puro.formatoDinero(t.subtotal));
                $('#posImpuesto').text(Puro.formatoDinero(t.impuesto));
                $('#posTotal').text(Puro.formatoDinero(t.total));
            }

            function agregar(articulo) {
                if (Cobro.enviando()) return;
                lineas = Puro.agregarArticulo(lineas, articulo);
                pintar();
                const $fila = $('#posLineas tr').filter(function () { return this.getAttribute('data-codigo') === articulo.codigo; });
                if ($fila.length) $fila[0].scrollIntoView({ block: 'nearest' });
            }

            function codigoDeFila(el) {
                return $(el).closest('tr').attr('data-codigo');
            }

            function cantidadDe(codigo) {
                const l = lineas.find(x => x.codigo === codigo);
                return l ? l.cantidad : 0;
            }

            /** Al cambiar de cliente el precio puede cambiar (lista de precios): se vuelve a pedir cada artículo. */
            async function refrescarPrecios() {
                const version = ++versionPrecios;
                const cliente = Cliente.codigo();
                const codigos = lineas.map(l => l.codigo);
                const resultados = await Promise.all(codigos.map(codigo =>
                    Promise.resolve($.get('/Pos/PorCodigo', { codigo, cliente })).catch(() => null)));
                if (version !== versionPrecios) return;
                codigos.forEach((codigo, i) => {
                    const r = resultados[i];
                    const linea = lineas.find(l => l.codigo === codigo);
                    if (!linea) return;
                    if (r && r.resultado && r.dato && r.dato.codigo === codigo) {
                        linea.precio = Number(r.dato.precio);
                        linea.existencias = Number(r.dato.existencias);
                        linea.noDisponible = false;
                    } else {
                        linea.noDisponible = true;
                    }
                });
                pintar();
            }

            function iniciar() {
                $('#posLineas')
                    .on('click', '.pos-mas', function () {
                        const codigo = codigoDeFila(this);
                        lineas = Puro.cambiarCantidad(lineas, codigo, cantidadDe(codigo) + 1);
                        pintar();
                    })
                    .on('click', '.pos-menos', function () {
                        const codigo = codigoDeFila(this);
                        lineas = Puro.cambiarCantidad(lineas, codigo, cantidadDe(codigo) - 1);
                        pintar();
                    })
                    .on('click', '.pos-quitar', function () {
                        lineas = Puro.quitarLinea(lineas, codigoDeFila(this));
                        pintar();
                    })
                    .on('change', '.pos-input-cantidad', function () {
                        lineas = Puro.cambiarCantidad(lineas, codigoDeFila(this), this.value);
                        pintar();
                        enfocarBuscador();
                    })
                    .on('keydown', '.pos-input-cantidad', function (e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            $(this).trigger('change');
                        }
                    });
                pintar();
            }

            return {
                iniciar, agregar, refrescarPrecios,
                vaciar: () => { versionPrecios++; lineas = []; pintar(); },
                lineas: () => lineas.map(l => Object.assign({}, l)),
                hayLineas: () => lineas.length > 0,
                total: () => Puro.calcularTotales(lineas, config.tasa).total
            };
        })();

        // =================================================================================================
        // Buscador (lector de códigos y búsqueda por texto)
        // =================================================================================================
        const Buscador = (function () {
            const $input = $('#posBuscador');
            const $lista = $('#posSugerencias');
            let resultados = [];
            let indiceActivo = -1;
            let temporizador = null;
            let ultimaBusqueda = 0;

            function visibles() {
                return !$lista.hasClass('d-none') && resultados.length > 0;
            }

            function ocultar() {
                resultados = [];
                indiceActivo = -1;
                $lista.addClass('d-none').empty();
                $input.attr('aria-expanded', 'false').removeAttr('aria-activedescendant');
            }

            function pintar() {
                if (resultados.length === 0) {
                    ocultar();
                    return;
                }
                $lista.html(resultados.map((a, i) => Puro.htmlSugerencia(a, i, i === indiceActivo)).join('')).removeClass('d-none');
                $input.attr('aria-expanded', 'true');
                if (indiceActivo >= 0) {
                    $input.attr('aria-activedescendant', `posSugerencia${indiceActivo}`);
                    const li = document.getElementById(`posSugerencia${indiceActivo}`);
                    if (li) li.scrollIntoView({ block: 'nearest' });
                } else {
                    $input.removeAttr('aria-activedescendant');
                }
            }

            async function buscar(texto) {
                const id = ++ultimaBusqueda;
                let r = null;
                try {
                    r = await $.get('/Pos/Buscar', { texto, cliente: Cliente.codigo() });
                } catch (e) {
                    r = null;
                }
                if (id !== ultimaBusqueda) return null;   // ya hay una búsqueda más reciente
                resultados = r && r.resultado && Array.isArray(r.dato) ? r.dato.slice(0, 20) : [];
                indiceActivo = -1;
                pintar();
                return r;
            }

            function elegir(articulo) {
                ocultar();
                $input.val('');
                ocultarMensaje();
                Lista.agregar(articulo);
                enfocarBuscador();
            }

            /** Enter: la sugerencia resaltada, o el código exacto (lector); si no hay coincidencia, sugerencias. */
            async function alPresionarEnter() {
                if (visibles() && indiceActivo >= 0) {
                    elegir(resultados[indiceActivo]);
                    return;
                }
                const texto = String($input.val() || '').trim();
                if (texto === '') return;
                clearTimeout(temporizador);
                ultimaBusqueda++;            // descarta búsquedas en curso
                ocultar();
                $input.val('');              // listo para el siguiente código del lector

                let r = null;
                try {
                    r = await $.get('/Pos/PorCodigo', { codigo: texto, cliente: Cliente.codigo() });
                } catch (e) {
                    r = null;
                }
                if (r && r.resultado && r.dato) {
                    ocultarMensaje();
                    Lista.agregar(r.dato);
                    return;
                }

                // Sin coincidencia exacta: se devuelve el texto (si el usuario no escribió otro) y se muestran sugerencias.
                if (String($input.val() || '') !== '') return;
                $input.val(texto);
                if (texto.length < 2) {
                    mostrarMensaje((r && r.mensaje) || `No se encontró el artículo ${texto}.`);
                    return;
                }
                const b = await buscar(texto);
                if (b && resultados.length === 0) {
                    mostrarMensaje((r && r.mensaje) || `Sin resultados para «${texto}».`);
                } else if (!b && !r) {
                    mostrarMensaje('No se pudo consultar el artículo. Revisa la conexión e intenta de nuevo.');
                }
            }

            function iniciar() {
                $input.on('input', function () {
                    const valor = String($input.val() || '').trim();
                    clearTimeout(temporizador);
                    if (valor.length < 2) {
                        ultimaBusqueda++;
                        ocultar();
                        return;
                    }
                    temporizador = setTimeout(() => buscar(valor), 250);
                });

                $input.on('keydown', function (e) {
                    if (e.key === 'ArrowDown' && visibles()) {
                        e.preventDefault();
                        indiceActivo = Math.min(indiceActivo + 1, resultados.length - 1);
                        pintar();
                    } else if (e.key === 'ArrowUp' && visibles()) {
                        e.preventDefault();
                        indiceActivo = Math.max(indiceActivo - 1, 0);
                        pintar();
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        alPresionarEnter();
                    }
                });

                // mousedown (no click): elige antes de que el input pierda el foco.
                $lista.on('mousedown', 'li', function (e) {
                    e.preventDefault();
                    const articulo = resultados[Number(this.getAttribute('data-indice'))];
                    if (articulo) elegir(articulo);
                });

                $input.on('blur', function () {
                    // Deja tiempo al mousedown de la lista; luego oculta las sugerencias.
                    setTimeout(() => {
                        if (document.activeElement !== $input[0]) ocultar();
                    }, 150);
                });
            }

            return {
                iniciar, ocultar, visibles,
                limpiar: () => { clearTimeout(temporizador); ultimaBusqueda++; ocultar(); $input.val(''); ocultarMensaje(); }
            };
        })();

        // =================================================================================================
        // Rápidos
        // =================================================================================================
        const Rapidos = (function () {
            let articulos = [];

            async function cargar() {
                let r = null;
                try {
                    r = await $.get('/Pos/Rapidos');
                } catch (e) {
                    r = null;
                }
                const $c = $('#posRapidos');
                if (!r || !r.resultado) {
                    $c.html('').append($('<div class="text-muted small"></div>').text((r && r.mensaje) || 'No se pudieron cargar los artículos rápidos.'));
                    return;
                }
                articulos = Array.isArray(r.dato) ? r.dato : [];
                $c.html(articulos.length
                    ? articulos.map((a, i) => Puro.htmlRapido(a, i)).join('')
                    : '<div class="text-muted small">No hay artículos rápidos. Márcalos con «Mostrar en el POS» en la ficha del artículo.</div>');
            }

            async function tocar(indice) {
                const articulo = articulos[indice];
                if (!articulo) return;
                // Los rápidos traen el precio del cliente por defecto; con otro cliente se pide su precio.
                if (Cliente.esDefecto()) {
                    Lista.agregar(articulo);
                    return;
                }
                let r = null;
                try {
                    r = await $.get('/Pos/PorCodigo', { codigo: articulo.codigo, cliente: Cliente.codigo() });
                } catch (e) {
                    r = null;
                }
                if (r && r.resultado && r.dato && r.dato.codigo === articulo.codigo) {
                    Lista.agregar(r.dato);
                } else {
                    mostrarMensaje((r && r.mensaje) || `No se pudo agregar ${articulo.nombre}.`);
                }
            }

            function iniciar() {
                $('#posRapidos').on('click', '.pos-rapido', function () {
                    tocar(Number(this.getAttribute('data-indice')));
                });
                cargar();
            }

            return { iniciar };
        })();

        // =================================================================================================
        // Cobro
        // =================================================================================================
        const Cobro = (function () {
            let enviando = false;          // candado contra doble Enter/F9/clic
            let efectivoPrecargado = false;
            let totalPreparado = null;     // total con que se prepararon los importes (si cambia, se reinician)

            const $filas = () => $('#posTablaPagos .pos-fila-pago');
            const $filaEfectivo = () => $filas().filter('[data-efectivo="S"]').first();

            function leerPagos() {
                return $filas().map(function () {
                    const $f = $(this);
                    return {
                        codigo: $f.attr('data-codigo'),
                        tipo: $f.attr('data-tipo'),
                        nombre: $f.attr('data-nombre'),
                        monto: $f.find('.pos-monto').val(),
                        referencia: $f.find('.pos-referencia').val(),
                        banco: $f.find('.pos-banco').val(),
                        fechaCheque: $f.find('.pos-fecha-cheque').val()
                    };
                }).get();
            }

            function evaluar() {
                return Puro.evaluarCobro(Lista.total(), leerPagos(), config.formaEfectivo);
            }

            function recalcular() {
                const ev = evaluar();
                $('#posCobroTotal').text(Puro.formatoDinero(ev.total));
                $('#posCobroPagado').text(Puro.formatoDinero(ev.pagado));
                if (ev.falta > 0) {
                    $('#posCobroDiferenciaEtiqueta').text('Falta');
                    $('#posCobroDiferencia').text(Puro.formatoDinero(ev.falta)).removeClass('text-success').addClass('text-danger');
                } else {
                    $('#posCobroDiferenciaEtiqueta').text('Cambio');
                    $('#posCobroDiferencia').text(Puro.formatoDinero(ev.cambio)).removeClass('text-danger').addClass('text-success');
                }
                $('#posCobroMensaje').text(ev.problema && ev.falta === 0 ? ev.problema : '');
                $('#posBtnConfirmar').prop('disabled', enviando || !ev.puedeConfirmar);
                return ev;
            }

            function preparar() {
                const total = Lista.total();
                if (totalPreparado === total) return;   // se conservan los importes de un intento anterior
                totalPreparado = total;
                $filas().find('input').val('');
                $filaEfectivo().find('.pos-monto').val(total.toFixed(2));
                efectivoPrecargado = true;
            }

            function abrir() {
                if (!config.puedeCobrar) {
                    mostrarMensaje('No tienes permiso para cobrar.');
                    return;
                }
                if (!Lista.hayLineas()) {
                    mostrarMensaje('Agrega al menos un artículo antes de cobrar.');
                    return;
                }
                Buscador.ocultar();
                preparar();
                recalcular();
                modal('posModalCobro').show();
            }

            function reiniciar() {
                totalPreparado = null;
                efectivoPrecargado = false;
                $filas().find('input').val('');
            }

            function fijarBotonEnviando(valor) {
                const $b = $('#posBtnConfirmar');
                if (valor) {
                    $b.prop('disabled', true).attr('data-texto', $b.html())
                        .html('<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Cobrando...');
                } else if ($b.attr('data-texto')) {
                    $b.html($b.attr('data-texto')).removeAttr('data-texto');
                }
            }

            async function confirmar() {
                if (enviando) return;
                const ev = recalcular();
                if (!ev.puedeConfirmar) {
                    $('#posCobroMensaje').text(ev.problema || '');
                    return;
                }
                enviando = true;
                fijarBotonEnviando(true);
                const solicitud = Puro.componerSolicitud(Cliente.codigo(), Cliente.nit(), Lista.lineas(), leerPagos());
                const r = await App.enviarJson('/Pos/Vender', 'POST', solicitud);
                enviando = false;
                fijarBotonEnviando(false);

                if (r && r.resultado && r.dato) {
                    // La venta existe: se limpia ya (aunque el ticket tarde o falle en mostrarse).
                    Lista.vaciar();
                    Cliente.restablecer();
                    Buscador.limpiar();
                    reiniciar();
                    const html = r.html;
                    const factura = r.dato.facturaEntry;
                    cerrarModalY('posModalCobro', () => {
                        if (html) Ticket.mostrar(html, 'venta');
                        else Ticket.cargar(factura, 'venta');
                    });
                    return;
                }

                // Error: se conserva la venta (y los importes) para reintentar; el mensaje de la API se muestra tal cual.
                recalcular();
                cerrarModalY('posModalCobro', () => avisarError(r && r.mensaje));
            }

            function iniciar() {
                const $tabla = $('#posTablaPagos');
                $tabla.on('input', '.pos-monto', function () {
                    if ($(this).closest('.pos-fila-pago').attr('data-efectivo') === 'S') efectivoPrecargado = false;
                    recalcular();
                });
                $tabla.on('input change', '.pos-referencia, .pos-banco, .pos-fecha-cheque', recalcular);
                // Al perder el foco el importe queda con 2 decimales (o vacío).
                $tabla.on('blur', '.pos-monto', function () {
                    const n = Puro.normalizarImporte(this.value);
                    this.value = n > 0 ? n.toFixed(2) : '';
                    recalcular();
                });

                $('.pos-billete').on('click', function () {
                    const $monto = $filaEfectivo().find('.pos-monto');
                    const valor = Puro.sumarBillete($monto.val(), Number(this.getAttribute('data-valor')), efectivoPrecargado);
                    efectivoPrecargado = false;
                    $monto.val(valor.toFixed(2));
                    recalcular();
                    $monto.trigger('focus');   // Enter después de un billete confirma (no repite el billete)
                });

                $('#posBtnExacto').on('click', function () {
                    const otros = leerPagos().filter(p => !Puro.mismoCodigo(p.codigo, config.formaEfectivo))
                        .reduce((s, p) => s + Puro.normalizarImporte(p.monto), 0);
                    const $monto = $filaEfectivo().find('.pos-monto');
                    const valor = Puro.efectivoExacto(Lista.total(), otros);
                    efectivoPrecargado = false;
                    $monto.val(valor > 0 ? valor.toFixed(2) : '');
                    recalcular();
                    $monto.trigger('focus');
                });

                $('#posBtnLimpiarEfectivo').on('click', function () {
                    const $monto = $filaEfectivo().find('.pos-monto');
                    efectivoPrecargado = false;
                    $monto.val('');
                    recalcular();
                    $monto.trigger('focus');
                });

                $('#posBtnConfirmar').on('click', confirmar);
                $('#posBtnCobrar').on('click', abrir);

                const $modal = $('#posModalCobro');
                $modal.on('hide.bs.modal', function (e) {
                    if (enviando) e.preventDefault();   // no se cierra mientras se registra la venta
                });
                $modal.on('shown.bs.modal', function () {
                    const $monto = $filaEfectivo().find('.pos-monto');
                    ($monto.length ? $monto : $filas().find('.pos-monto').first()).trigger('focus').trigger('select');
                });
            }

            return { iniciar, abrir, confirmar, enviando: () => enviando };
        })();

        // =================================================================================================
        // Ticket
        // =================================================================================================
        const Ticket = (function () {
            let modo = 'venta';

            function mostrar(html, nuevoModo) {
                modo = nuevoModo;
                $('#ticketImprimible').html(html);   // parcial _Ticket renderizado (y codificado) por el servidor
                $('#posModalTicketTitulo').text(modo === 'venta' ? 'Venta registrada' : 'Reimpresión del ticket');
                $('#posBtnTicketCerrar').html(modo === 'venta'
                    ? 'Nueva venta <span class="pos-atajo">Enter</span>'
                    : 'Cerrar <span class="pos-atajo">Enter</span>');
                modal('posModalTicket').show();
            }

            async function cargar(factura, nuevoModo) {
                let r = null;
                try {
                    r = await $.get('/Pos/Ticket', { factura });
                } catch (e) {
                    r = null;
                }
                // HTML del parcial _Ticket; cualquier otro HTML (p. ej. la página de inicio de sesión) no es un ticket.
                if (typeof r === 'string' && r.indexOf('pos-ticket') >= 0) {
                    mostrar(r, nuevoModo);
                } else if (nuevoModo === 'venta') {
                    avisarError(`La venta se registró, pero no se pudo cargar el ticket${r && r.mensaje ? ': ' + r.mensaje : ''}. Reimprímelo desde «Ventas del día».`);
                } else {
                    avisarError((r && r.mensaje) || 'No se pudo cargar el ticket.');
                }
            }

            function iniciar() {
                $('#posBtnImprimir').on('click', () => global.print());
                $('#posBtnTicketCerrar').on('click', () => modal('posModalTicket').hide());
                $('#posModalTicket').on('shown.bs.modal', () => $('#posBtnTicketCerrar').trigger('focus'));
                $('#posModalTicket').on('hidden.bs.modal', () => $('#ticketImprimible').empty());
            }

            return { iniciar, mostrar, cargar, cerrar: () => modal('posModalTicket').hide(), modo: () => modo };
        })();

        // =================================================================================================
        // Ventas del día
        // =================================================================================================
        const VentasDelDia = (function () {
            async function cargar() {
                const $estado = $('#posVentasDiaEstado');
                const $cuerpo = $('#posVentasDiaCuerpo');
                $estado.text('Cargando...');
                $cuerpo.empty();
                let r = null;
                try {
                    r = await $.get('/Pos/VentasDelDia');
                } catch (e) {
                    r = null;
                }
                if (!r || !r.resultado) {
                    $estado.text((r && r.mensaje) || 'No se pudieron cargar las ventas del día.');
                    return;
                }
                const ventas = Array.isArray(r.dato) ? r.dato : [];
                $estado.text(ventas.length ? `${ventas.length} venta(s) hoy.` : 'Todavía no hay ventas hoy.');
                $cuerpo.html(ventas.map(Puro.htmlVentaDelDia).join(''));
            }

            function iniciar() {
                $('#posBtnVentasDia').on('click', () => {
                    modal('posModalVentasDia').show();
                    cargar();
                });
                $('#posVentasDiaCuerpo').on('click', '.pos-reimprimir', function () {
                    const factura = Number(this.getAttribute('data-factura'));
                    cerrarModalY('posModalVentasDia', () => Ticket.cargar(factura, 'reimpresion'));
                });
            }

            return { iniciar };
        })();

        // =================================================================================================
        // Nueva venta, pantalla completa y atajos
        // =================================================================================================
        function nuevaVenta() {
            if (Cobro.enviando()) return;
            if (!Lista.hayLineas()) {
                Buscador.limpiar();
                Cliente.restablecer();
                enfocarBuscador();
                return;
            }
            // Diferido: que la tecla Esc que lo abrió no lo cierre en el acto.
            setTimeout(async () => {
                const r = await Swal.fire({
                    icon: 'warning',
                    title: '¿Descartar la venta en curso?',
                    text: 'Se quitarán todos los artículos de la lista.',
                    showCancelButton: true,
                    confirmButtonText: 'Descartar',
                    cancelButtonText: 'Seguir con la venta',
                    confirmButtonColor: '#dc3545',
                    focusCancel: true
                });
                if (r.isConfirmed) {
                    Lista.vaciar();
                    Cliente.restablecer();
                    Buscador.limpiar();
                }
                enfocarBuscador();
            }, 0);
        }

        $('#posBtnNuevaVenta').on('click', nuevaVenta);

        $('#posBtnPantallaCompleta').on('click', function () {
            try {
                if (document.fullscreenElement) document.exitFullscreen();
                else document.documentElement.requestFullscreen();
            } catch (e) { /* el navegador no lo permite: se ignora */ }
        });

        const Atajos = (function () {
            const esBoton = el => el && (el.tagName === 'BUTTON' || el.tagName === 'A');

            function alPresionar(e) {
                const tecla = e.key;
                if (tecla === 'F2' || tecla === 'F4' || tecla === 'F9') e.preventDefault();
                if (global.Swal && Swal.isVisible()) return;

                const abierto = document.querySelector('#posApp .modal.show');
                if (abierto || modalesAbiertos > 0) {
                    const id = abierto ? abierto.id : '';
                    if (id === 'posModalCobro' && (tecla === 'F9' || (tecla === 'Enter' && !esBoton(e.target)))) {
                        e.preventDefault();
                        Cobro.confirmar();
                    } else if (id === 'posModalTicket' && tecla === 'Enter' && !esBoton(e.target)) {
                        e.preventDefault();
                        Ticket.cerrar();
                    }
                    return;   // Esc lo maneja Bootstrap (cierra el modal)
                }

                if (tecla === 'F2') {
                    enfocarBuscador(true);
                } else if (tecla === 'F4') {
                    Cliente.abrir();
                } else if (tecla === 'F9') {
                    Cobro.abrir();
                } else if (tecla === 'Escape') {
                    e.preventDefault();
                    if (Buscador.visibles()) {
                        Buscador.ocultar();
                        enfocarBuscador();
                    } else {
                        nuevaVenta();
                    }
                }
            }

            return { iniciar: () => document.addEventListener('keydown', alPresionar) };
        })();

        Cliente.iniciar();
        Lista.iniciar();
        Buscador.iniciar();
        Rapidos.iniciar();
        Cobro.iniciar();
        Ticket.iniciar();
        VentasDelDia.iniciar();
        Atajos.iniciar();
        enfocarBuscador();
    });
})(typeof window !== 'undefined' ? window : globalThis);
