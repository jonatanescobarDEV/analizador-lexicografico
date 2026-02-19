import { contenidoFuente } from "./index.js";
import { mostrarResultadoPanelLexer } from "./ui.js";

let posicionActual = 0;
let lineaActual = 1;

const PALABRAS_RESERVADAS = ["auto", "break", "case", "char", "const", "continue", "default",
    "do", "double", "else", "enum", "extern", "float", "for", "goto", "if", "inline", "int",
    "long", "register", "restrict", "return", "short", "signed", "sizeof", "static", "struct",
    "switch", "typedef", "union", "unsigned", "void", "volatile", "while", "_Alignas",
    "_Alignof", "_Atomic", "_Bool", "_Complex", "_Generic", "_Imaginary", "_Noreturn",
    "_Static_assert", "_Thread_local"];

export async function ejecutarAnalisis() {
    posicionActual = 0;
    const contadorTokens = {
        PR: [],
        ID: [],
        OP: [],
        NUM: [],
        NUM_REAL: [],
        CADENA: [],
        CARACTER: []
    };

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

    mostrarResultadoPanelLexer(contadorTokens);
}

export function obtenerSiguienteToken() {
    let caracter = contenidoFuente.charAt(posicionActual);

    if (posicionActual >= contenidoFuente.length) {
        return { tipo: "EOF", lexema: "$", linea: lineaActual };
    }

    if (/\s/.test(caracter)) {
        if (caracter === '\n') {
            lineaActual++;
        }
        posicionActual++;
        return { tipo: "SKIP", linea: lineaActual };
    }

    if (caracter === '/') {
        let siguiente = contenidoFuente.charAt(posicionActual + 1);

        if (siguiente === '/') {
            while (posicionActual < contenidoFuente.length && contenidoFuente.charAt(posicionActual) !== '\n') {
                posicionActual++;
            }
            return { tipo: "SKIP" , linea: lineaActual };
        }

        if (siguiente === '*') {
            posicionActual = posicionActual + 2;
            while (posicionActual < contenidoFuente.length) {
                if (contenidoFuente.charAt(posicionActual) === '*' && contenidoFuente.charAt(posicionActual + 1) === '/') {
                    posicionActual = posicionActual + 2;
                    break;
                }
                posicionActual++;
            }
            return { tipo: "SKIP" , linea: lineaActual };
        }
    }
    
    if (caracter === '#') {
        while (posicionActual < contenidoFuente.length && contenidoFuente.charAt(posicionActual) !== '\n') {
            posicionActual++;
        }
        return { tipo: "SKIP" , linea: lineaActual };
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
        return { tipo: "CADENA", lexema: textoCadena, linea: lineaActual };
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
        return { tipo: "CARACTER", lexema: textoChar, linea: lineaActual };
    }

    if (/[a-zA-Z_]/.test(caracter)) {
        let textoAcumulado = "";
        
        while (posicionActual < contenidoFuente.length) {
            let actual = contenidoFuente.charAt(posicionActual);
            if (/[a-zA-Z0-9_]/.test(actual)) {
                textoAcumulado += actual;
                posicionActual++;
            } else if (/\s/.test(actual)) {
                break;
            } else {
                break;
            }
        }

        let esReservada = PALABRAS_RESERVADAS.includes(textoAcumulado) ? true : false;

        let categoriaFinal = esReservada ? "PR" : "ID";

        return {
            tipo: categoriaFinal,
            lexema: textoAcumulado,
            linea: lineaActual
        };
    }

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
            lexema: numeroTexto,
            linea: lineaActual
        };
    }

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
        else if (caracter === '<'){
            if (siguienteCaracter === '=') { operadorFinal = "<="; posicionActual++; }
            else if (siguienteCaracter === '<') { operadorFinal = "<<"; posicionActual++; }
        }
        else if (caracter === '>') {
            if (siguienteCaracter === '=') { operadorFinal = ">="; posicionActual++; }
            else if (siguienteCaracter === '>') { operadorFinal = ">>"; posicionActual++; }
        }
        else if (caracter === '+') {
            if (siguienteCaracter === '+') { operadorFinal = "++"; posicionActual++; }
            else if (siguienteCaracter === '=') { operadorFinal = "+="; posicionActual++; }
        }
        else if (caracter === '-') {
            if (siguienteCaracter === '-') { operadorFinal = "--"; posicionActual++; }
            else if (siguienteCaracter === '=') { operadorFinal = "-="; posicionActual++; }
        }
        else if (caracter === '*' && siguienteCaracter === '=') { operadorFinal = "*="; posicionActual++; }
        else if (caracter === '/' && siguienteCaracter === '=') { operadorFinal = "/="; posicionActual++; }
        else if (caracter === '%' && siguienteCaracter === '=') { operadorFinal = "%="; posicionActual++; }
        else if (caracter === '&' && siguienteCaracter === '&') { operadorFinal = "&&"; posicionActual++; }
        else if (caracter === '|' && siguienteCaracter === '|') { operadorFinal = "||"; posicionActual++; }

        posicionActual++;
        return { tipo: "OP", lexema: operadorFinal, linea: lineaActual };
    }

    posicionActual++;
    return { tipo: "SKIP", linea: lineaActual };
}

export function reiniciarLexer() {
    posicionActual = 0;
    lineaActual = 1;
}