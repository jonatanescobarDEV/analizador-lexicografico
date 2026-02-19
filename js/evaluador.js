import { reiniciarLexer, obtenerSiguienteToken } from "./lexer.js";
import { mostrarResultadoPanelParser } from "./ui.js";

let posicionActual = 0;
let datosAImprimir = [];
let lookahead;

let SimbolosD = {
    I_ASIGNAR: ['ID'],
    I_COUT:    ['COUT'],
    E:         ['NUM', 'ID', 'L_PAREN'],
    X_SUMA:    ['SUMA'],
    X_EPSILON: ['PUNTO_COMA', 'R_PAREN', 'EOF'],
    T:         ['NUM', 'ID', 'L_PAREN'],
    W_MULT:    ['MULT'],
    W_EPSILON: ['SUMA', 'PUNTO_COMA', 'R_PAREN', 'EOF'],
    F_NUM:     ['NUM'],
    F_ID:      ['ID'],
    F_PAREN:   ['L_PAREN']
}

class Nodo {
    constructor(tipo, lexema, izq = null, der = null) {
        this.tipo = tipo;   
        this.lexema = lexema; 
        this.izq = izq;     
        this.der = der;     
    }
}

export async function ejecutarAnalisis() {
    reiniciarLexer();
    datosAImprimir = [];

    try{
        lookahead = obtenerSiguienteToken();

        if (lookahead.tipo === "EOF") {
            datosAImprimir.push("No hay código para analizar.");
            mostrarResultadoPanelParser(datosAImprimir);
            return;
        }

        let nodoPrincipal = main();
        ejecutar(nodoPrincipal);
    } catch (error) {
        datosAImprimir.push(`<span class="codigo-error"><b>[Linea ${lookahead.linea}]</b> ${error.message}</span>`);
    }

    mostrarResultadoPanelParser(datosAImprimir);
}

function obtenerSigTokenEspecifico(){
    let token = obtenerSiguienteToken();
    
    while (token.tipo === "SKIP") {
        token = obtenerSiguienteToken();
    }

    if (token.lexema == "*") {token.tipo = "MULT"}
    else if (token.lexema == "+") {token.tipo = "SUMA"}
    else if (token.lexema == "(") {token.tipo = "L_PAREN"}
    else if (token.lexema == ")") {token.tipo = "R_PAREN"}
    else if (token.lexema == "=") {token.tipo = "IGUAL"}
    else if (token.lexema == ";") {token.tipo = "PUNTO_COMA"}
    else if (token.lexema == "<<") {token.tipo = "SHIFT_L"}
    else if (token.tipo == "EOF") {}
    else if (token.tipo == "NUM_REAL") {token.tipo = "NUM"}
    else if (token.tipo == "NUM") {}
    else if (token.lexema == "cout") {token.tipo = "COUT"}
    else if (token.tipo == "ID") {}

    else throw new Error(`Error Léxico: Carácter '${token.lexema}' no reconocido`);;

    return token;
}

function match(tipoEsperado) {
    if (lookahead.tipo === tipoEsperado) {
        const tokenActual = lookahead;
        lookahead = obtenerSigTokenEspecifico();
        return tokenActual;
    }
    throw new Error(`Error Sintáctico: Se esperaba '${tipoEsperado}', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function main() {
    const instrucciones = [];

    while (lookahead.tipo !== "EOF") {
        instrucciones.push(I());
    }
    return instrucciones;
}

function I() {
    if (SimbolosD.I_ASIGNAR.includes(lookahead.tipo)) {
        const idToken = match("ID");
        match("IGUAL");
        const nodoE = E();
        match("PUNTO_COMA");
        return new Nodo("ASIGNAR", idToken.lexema, null, nodoE);
    }
    else if (SimbolosD.I_COUT.includes(lookahead.tipo)) {
        match("COUT");
        match("SHIFT_L");
        const nodoE = E();
        match("PUNTO_COMA");
        return new Nodo("IMPRIMIR", "cout", null, nodoE);
    }
    throw new Error(`Error Sintáctico: Se esperaba una instrucción, pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function E() {
    if (SimbolosD.E.includes(lookahead.tipo)) {
        const nodoT = T();
        return X(nodoT);
    }
    throw new Error(`Error en E: Se esperaba número, ID o '(', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function X(nodoHeredado) {
    if (SimbolosD.X_SUMA.includes(lookahead.tipo)) {
        match("SUMA");
        const nodoT = T();
        const nodoSuma = new Nodo("SUMA", "+", nodoHeredado, nodoT);
        return X(nodoSuma);
    }
    else if (SimbolosD.X_EPSILON.includes(lookahead.tipo)) {
        return nodoHeredado;
    }
    throw new Error(`Error en X: Token '${lookahead.tipo}' ('${lookahead.lexema}') no permitido tras expresión`);
}

function T() {
    if (SimbolosD.T.includes(lookahead.tipo)) {
        const nodoF = F();
        return W(nodoF);
    }
    throw new Error(`Error en T: Se esperaba número, ID o '(', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function W(nodoHeredado) {
    if (SimbolosD.W_MULT.includes(lookahead.tipo)) {
        match("MULT");
        const nodoF = F();
        const nodoMult = new Nodo("MULT", "*", nodoHeredado, nodoF);
        return W(nodoMult);
    }
    else if (SimbolosD.W_EPSILON.includes(lookahead.tipo)) {
        return nodoHeredado;
    }
    throw new Error(`Error en W: Token '${lookahead.tipo}' ('${lookahead.lexema}') no permitido tras término`);
}

function F() {
    if (SimbolosD.F_NUM.includes(lookahead.tipo)) {
        const numToken = match("NUM");
        return new Nodo("NUM", numToken.lexema);
    }
    else if (SimbolosD.F_ID.includes(lookahead.tipo)) {
        const idToken = match("ID");
        return new Nodo("ID", idToken.lexema);
    }
    else if (SimbolosD.F_PAREN.includes(lookahead.tipo)) {
        match("L_PAREN");
        const nodoE = E();
        match("R_PAREN");
        return nodoE;
    }
    throw new Error(`Error en F: Se esperaba número, ID o '(', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

let tablaSimbolos = {};

function evaluar(nodo) {
    if (nodo.tipo == "NUM"){
        return Number(nodo.lexema);
    }
    else if (nodo.tipo == "ID"){
        if (nodo.lexema in tablaSimbolos) {
            return tablaSimbolos[nodo.lexema];
        }
        throw new Error(`Error Semántico: Variable '${nodo.lexema}' no definida`);
    }
    else if (nodo.tipo == "SUMA"){
        return evaluar(nodo.izq) + evaluar(nodo.der);
    }
    else if (nodo.tipo == "MULT"){
        return evaluar(nodo.izq) * evaluar(nodo.der);
    }
    else if (nodo.tipo == "ASIGNAR"){
        let valor = evaluar(nodo.der);
        tablaSimbolos[nodo.lexema] = valor;
        datosAImprimir.push(`Asignación: ${nodo.lexema} = ${valor}`);
        return valor;
    }
    else if (nodo.tipo == "IMPRIMIR"){
        let valor = evaluar(nodo.der);
        datosAImprimir.push(`SALIDA COUT: <b>${valor}</b>`);
        return valor;
    }
}

function ejecutar(arbolSintacticoAbstracto) {
    arbolSintacticoAbstracto.forEach(nodo => {
        evaluar(nodo);
    });
}