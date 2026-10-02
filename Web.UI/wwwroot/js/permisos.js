/** Agrupa el catalogo de modulos por su Grupo, preservando el orden en que llegaron. */
function agruparModulosPorGrupo(modulos) {
    const grupos = [];
    const indice = {};
    modulos.forEach(m => {
        const grupo = m.grupo ?? m.Grupo;
        if (!(grupo in indice)) {
            indice[grupo] = grupos.length;
            grupos.push({ nombre: grupo, modulos: [] });
        }
        grupos[indice[grupo]].modulos.push(m);
    });
    return grupos;
}

/** Arma el HTML de la grilla modulo x 4 acciones, marcando los checkboxes segun la matriz actual. */
function pintarGrillaPermisos(modulos, matriz) {
    const porCodigo = {};
    (matriz ?? []).forEach(p => { porCodigo[p.codigoModulo ?? p.CodigoModulo] = p; });

    const filas = agruparModulosPorGrupo(modulos).map(grupo => {
        const filasGrupo = grupo.modulos.map(m => {
            const codigo = m.codigo ?? m.Codigo;
            const nombre = m.nombre ?? m.Nombre;
            const p = porCodigo[codigo] ?? {};
            const chk = (campo) => (p[campo] ?? p[campo.charAt(0).toUpperCase() + campo.slice(1)]) ? 'checked' : '';
            return `
                <tr data-codigo-modulo="${codigo}">
                    <td>${nombre}</td>
                    <td class="text-center"><input type="checkbox" class="chkVer" ${chk('ver')}></td>
                    <td class="text-center"><input type="checkbox" class="chkAgregar" ${chk('agregar')}></td>
                    <td class="text-center"><input type="checkbox" class="chkActualizar" ${chk('actualizar')}></td>
                    <td class="text-center"><input type="checkbox" class="chkEliminar" ${chk('eliminar')}></td>
                </tr>`;
        }).join('');
        return `<tr class="table-light"><td colspan="5"><strong>${grupo.nombre}</strong></td></tr>${filasGrupo}`;
    }).join('');

    return filas;
}

/** Lee el estado actual de los checkboxes de #tblGrillaPermisos y arma la matriz a guardar. */
function leerGrillaPermisos() {
    const matriz = [];
    $('#tblGrillaPermisos tbody tr[data-codigo-modulo]').each(function () {
        const $fila = $(this);
        matriz.push({
            CodigoModulo: $fila.data('codigo-modulo'),
            Ver: $fila.find('.chkVer').is(':checked'),
            Agregar: $fila.find('.chkAgregar').is(':checked'),
            Actualizar: $fila.find('.chkActualizar').is(':checked'),
            Eliminar: $fila.find('.chkEliminar').is(':checked')
        });
    });
    return matriz;
}
