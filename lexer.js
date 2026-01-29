// Variables de control global
let posicionActual = 0;
let contenidoFuente = "";

// Diccionario de apoyo
const PALABRAS_RESERVADAS = ["auto", "break", "case", "char", "const", "continue", "default",
    "do", "double", "else", "enum", "extern", "float", "for", "goto", "if", "inline", "int",
    "long", "register", "restrict", "return", "short", "signed", "sizeof", "static", "struct",
    "switch", "typedef", "union", "unsigned", "void", "volatile", "while", "_Alignas",
    "_Alignof", "_Atomic", "_Bool", "_Complex", "_Generic", "_Imaginary", "_Noreturn",
    "_Static_assert", "_Thread_local"];

export async function ejecutarAnalisis() {
    const selectorArchivos = document.getElementById('archivo');
    const areaTexto = document.getElementById('editor');
    
    // Reiniciamos para un nuevo análisis
    posicionActual = 0;
    contenidoFuente = "";
    const contadorTokens = {
        PR: [],
        ID: [],
        OP: [],
        NUM: [],
        NUM_REAL: [],
        CADENA: [],
        CARACTER: []
    };

    // Selección de la fuente de datos
    if (selectorArchivos.files[0]) {
        contenidoFuente = await selectorArchivos.files[0].text();
        areaTexto.value = contenidoFuente;
    } else {
        contenidoFuente = areaTexto.value;
    }

    // Recorrido principal: Seguimos la lógica original de avanzar por el texto
    while (posicionActual < contenidoFuente.length) {
        let resultadoToken = obtenerSiguienteToken();

        if (resultadoToken !== null && resultadoToken.tipo !== "SKIP") {
            // Guardamos el lexema según la categoría
            const tipo = resultadoToken.tipo;
            const lexema = resultadoToken.lexema;

            if (tipo === "PR") {
                contadorTokens.PR.push(lexema);
            } else if (tipo === "ID") {
                contadorTokens.ID.push(lexema);
            } else if (tipo === "OP") {
                contadorTokens.OP.push(lexema);
            } else if (tipo === "NUM") {
                contadorTokens.NUM.push(lexema);
            } else if (tipo === "NUM_REAL") {
                contadorTokens.NUM_REAL.push(lexema);
            } else if (tipo === "CADENA") {
                contadorTokens.CADENA.push(lexema);
            } else if (tipo === "CARACTER") {
                contadorTokens.CARACTER.push(lexema);
            }
        }
    }

    mostrarResultadosEnTabla(contadorTokens);
}

function obtenerSiguienteToken() {
    let caracter = contenidoFuente.charAt(posicionActual);

    // Se omiten espacios, tabulaciones y saltos de línea
    if (caracter === ' ' || caracter === '\n' || caracter === '\r' || caracter === '\t') {
        posicionActual++;
        return { tipo: "SKIP" };
    }

    // Comentarios 
    if (caracter === '/') {
        let siguiente = contenidoFuente.charAt(posicionActual + 1);

        // Comentario de una línea
        if (siguiente === '/') {
            while (posicionActual < contenidoFuente.length && contenidoFuente.charAt(posicionActual) !== '\n') {
                posicionActual++;
            }
            return { tipo: "SKIP" };
        }

        // Comentario de bloque
        if (siguiente === '*') {
            posicionActual = posicionActual + 2;
            while (posicionActual < contenidoFuente.length) {
                if (contenidoFuente.charAt(posicionActual) === '*' && contenidoFuente.charAt(posicionActual + 1) === '/') {
                    posicionActual = posicionActual + 2;
                    break;
                }
                posicionActual++;
            }
            return { tipo: "SKIP" };
        }
    }
    
    if (caracter === '#') {
        while (posicionActual < contenidoFuente.length && contenidoFuente.charAt(posicionActual) !== '\n') {
            posicionActual++;
        }
        return { tipo: "SKIP" };
    }

    if (caracter === '"') {
        let textoCadena = '"';
        posicionActual++; 
        while (posicionActual < contenidoFuente.length) {
            let actual = contenidoFuente.charAt(posicionActual);
            textoCadena = textoCadena + actual;
            posicionActual++;
            if (actual === '"') {
                break;
            }
        }
        return { tipo: "CADENA", lexema: textoCadena };
    }

    if (caracter === "'") {
        let textoChar = "'";
        posicionActual++;
        while (posicionActual < contenidoFuente.length) {
            let actual = contenidoFuente.charAt(posicionActual);
            textoChar = textoChar + actual;
            posicionActual++;
            if (actual === "'") {
                break;
            }
        }
        return { tipo: "CARACTER", lexema: textoChar };
    }

    // Identificadores y Palabras Reservadas
    if ((caracter >= 'a' && caracter <= 'z') || (caracter >= 'A' && caracter <= 'Z') || caracter === '_') {
        let textoAcumulado = "";
        
        while (posicionActual < contenidoFuente.length) {
            let actual = contenidoFuente.charAt(posicionActual);
            if ((actual >= 'a' && actual <= 'z') || (actual >= 'A' && actual <= 'Z') || (actual >= '0' && actual <= '9') || actual === '_') {
                textoAcumulado = textoAcumulado + actual;
                posicionActual++;
            } else {
                break;
            }
        }

        // Verificar palabra reservada
        let esReservada = false;
        for (let i = 0; i < PALABRAS_RESERVADAS.length; i++) {
            if (PALABRAS_RESERVADAS[i] === textoAcumulado) {
                esReservada = true;
                break;
            }
        }

        // Clasificación final
        let categoriaFinal = "";
        if (esReservada) {
            categoriaFinal = "PR";
        } else {
            categoriaFinal = "ID";
        }

        return {
            tipo: categoriaFinal,
            lexema: textoAcumulado
        };
    }

    // Números (Enteros y decimal)
    if (caracter >= '0' && caracter <= '9') {
        let numeroTexto = "";
        let tieneDecimal = false;

        while (posicionActual < contenidoFuente.length) {
            let actual = contenidoFuente.charAt(posicionActual);
            if (actual >= '0' && actual <= '9') {
                numeroTexto = numeroTexto + actual;
                posicionActual++;
            } else if (actual === '.') {
                tieneDecimal = true;
                numeroTexto = numeroTexto + actual;
                posicionActual++;
            } else {
                break;
            }
        }

        let tipoNumero = "";
        if (tieneDecimal) {
            tipoNumero = "NUM_REAL";
        } else {
            tipoNumero = "NUM";
        }

        return {
            tipo: tipoNumero,
            lexema: numeroTexto
        };
    }

    //  Operadores y símbolos especiales
    let listaDeOperadores = "+-*/%=<>!&|;,()[]{}";
    let esOperador = false;

    for (let i = 0; i < listaDeOperadores.length; i++) {
        if (caracter === listaDeOperadores[i]) {
            esOperador = true;
            break;
        }
    }

    if (esOperador) {
        let operadorFinal = caracter;
        let siguienteCaracter = contenidoFuente.charAt(posicionActual + 1);

        if (caracter === '=' && siguienteCaracter === '=') { operadorFinal = "=="; posicionActual++; }
        else if (caracter === '!' && siguienteCaracter === '=') { operadorFinal = "!="; posicionActual++; }
        else if (caracter === '<' && siguienteCaracter === '=') { operadorFinal = "<="; posicionActual++; }
        else if (caracter === '>' && siguienteCaracter === '=') { operadorFinal = ">="; posicionActual++; }
        else if (caracter === '+' && siguienteCaracter === '+') { operadorFinal = "++"; posicionActual++; }
        else if (caracter === '-' && siguienteCaracter === '-') { operadorFinal = "--"; posicionActual++; }
        else if (caracter === '&' && siguienteCaracter === '&') { operadorFinal = "&&"; posicionActual++; }
        else if (caracter === '|' && siguienteCaracter === '|') { operadorFinal = "||"; posicionActual++; }

        posicionActual++;
        return { tipo: "OP", lexema: operadorFinal };
    }

    posicionActual++;
    return { tipo: "SKIP" };
}

function mostrarResultadosEnTabla(contador) {
    let tablaHTML = "<table class='results-table'>";
    tablaHTML += "<thead><tr><th>Tipo de Token</th><th>Cantidad</th><th>Lexemas Encontrados</th></tr></thead>";
    tablaHTML += "<tbody>";

    let categorias = ["PR", "ID", "OP", "NUM", "NUM_REAL", "CADENA", "CARACTER"];

    for (let i = 0; i < categorias.length; i++) {
        let clave = categorias[i];
        let listaLexemas = contador[clave];

        tablaHTML += "<tr>";
        tablaHTML += "<td class='token-type'>" + clave + "</td>";
        tablaHTML += "<td>" + listaLexemas.length + "</td>";
        let simbolos = listaLexemas.length > 0 ? listaLexemas.join('<span class="separador"> - </span>') : "-";
        tablaHTML += "<td>" + simbolos + "</td>";
        tablaHTML += "</tr>";
    }

    tablaHTML += "</tbody></table>";
    document.getElementById('lexer-resultados').innerHTML = tablaHTML;
}