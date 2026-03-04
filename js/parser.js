import { reiniciarLexer, obtenerSiguienteToken } from "./lexer.js";
import { mostrarResultadoPanelParser, pedirValorPanelParser } from "./ui.js";

let datosAImprimir = [];
let lookahead;
export let astGlobal = null;

let SimbolosD = {
    P:          ['INT', 'FLOAT', 'CADENA', 'CARACTER', 'ID', 'COUT', 'CIN', 'IF', 'WHILE', 'DO', 'EOF'],

    L_INST:     ['INT', 'FLOAT', 'CADENA', 'CARACTER', 'ID', 'COUT', 'CIN', 'IF', 'WHILE', 'DO'],
    L_EPSILON:  ['R_LLAVE', 'EOF'],

    I_DEC:      ['INT', 'FLOAT', 'CADENA', 'CARACTER'],
    I_ASIGNAR:  ['ID'],
    I_COUT:     ['COUT'],
    I_CIN:      ['CIN'],
    I_IF:       ['IF'],
    I_WHILE:    ['WHILE'],
    I_DO:       ['DO'],

    TYPE_INT:   ['INT'],
    TYPE_FLOAT: ['FLOAT'],
    TYPE_CHAR:  ['CARACTER'],
    TYPE_STR:   ['CADENA'],

    DEC_L:      ['ID'],

    INIT_O_IGUAL: ['IGUAL'],
    INIT_O_EPSILON: ['COMA', 'PUNTO_COMA'],

    DEC_T_COMA: ['COMA'],
    DEC_T_EPSILON: ['PUNTO_COMA'],

    EXP:        ['L_PAREN', 'NUM', 'ID', 'CADENA', 'CARACTER'],

    RELOP_IGUAL_I:      ['IGUAL_IGUAL'],
    RELOP_DIF:          ['DIFERENTE'],
    RELOP_MAYOR:        ['MAYOR'],
    RELOP_MENOR:        ['MENOR'],
    RELOP_MAYOR_IGUAL:  ['MAYOR_IGUAL'],
    RELOP_MENOR_IGUAL:  ['MENOR_IGUAL'],

    ELSE_O:      ['ELSE'],
    ELSE_O_EPSILON:['INT', 'FLOAT', 'CADENA', 'CARACTER', 'ID', 'COUT', 'CIN', 'IF', 'WHILE', 'DO', 'R_LLAVE', 'EOF'],

    E_ARIT:          ['NUM', 'ID', 'L_PAREN'],
    E_CAD:           ['CADENA'],
    E_CAR:           ['CARACTER'],

    X_SUMA:     ['SUMA'],
    X_RESTA:    ['RESTA'],
    X_EPSILON:  ['COMA', 'PUNTO_COMA', 'R_PAREN', 'IGUAL_IGUAL', 'DIFERENTE', 'MAYOR', 'MENOR', 'MAYOR_IGUAL', 'MENOR_IGUAL'],

    T:          ['NUM', 'ID', 'L_PAREN'],
    
    W_MULT:     ['MULT'],
    w_DIV:      ['DIV'],
    W_EPSILON:  ['SUMA', 'RESTA', 'COMA', 'PUNTO_COMA', 'R_PAREN', 'IGUAL_IGUAL', 'DIFERENTE', 'MAYOR', 'MENOR', 'MAYOR_IGUAL', 'MENOR_IGUAL'],

    F_NUM:      ['NUM'],
    F_ID:       ['ID'],
    F_PAREN:    ['L_PAREN']
}

class Nodo {
    constructor(tipo, lexema, izq = null, der = null, linea = null) {
        this.tipo = tipo;   
        this.lexema = lexema; 
        this.izq = izq;     
        this.der = der;
        this.linea = linea;     
    }
}

export async function ejecutarAnalisis() {
    reiniciarLexer();
    datosAImprimir = [];
    tablaSimbolos = {};

    try{
        lookahead = obtenerSigTokenEspecifico();

        if (lookahead.tipo === "EOF") {
            datosAImprimir.push("No hay código para analizar.");
            mostrarResultadoPanelParser(datosAImprimir);
            return;
        }

        let nodoPrincipal = main();
        astGlobal = nodoPrincipal;
        
        ejecutar(nodoPrincipal).then(() => {
            mostrarResultadoPanelParser(datosAImprimir);
        }).catch(error => {
            // Captura Errores Semánticos (Ej. Variables no definidas)
            datosAImprimir.push(`<span class="codigo-error"> ${error.message}</span>`);
            mostrarResultadoPanelParser(datosAImprimir);
            
            // NUEVO: Fuerza a la interfaz a saltar a la pestaña del Parser
            document.querySelector('[data-target="parserll1"]').click();
        });
        
    } catch (error) {
        // Captura Errores Léxicos y Sintácticos (Ej. Falta de punto y coma)
        datosAImprimir.push(`<span class="codigo-error"> ${error.message}</span>`);
        mostrarResultadoPanelParser(datosAImprimir);
        
        // NUEVO: Fuerza a la interfaz a saltar a la pestaña del Parser
        document.querySelector('[data-target="parserll1"]').click();
    }
}

function obtenerSigTokenEspecifico(){
    let token = obtenerSiguienteToken();
    
    while (token.tipo === "SKIP") {
        token = obtenerSiguienteToken();
    }

    validarTokenObtenido(token);

    return token;
}

function validarTokenObtenido(token) {
    if (token.lexema == "*") { token.tipo = "MULT"; }
    else if (token.lexema == "/") { token.tipo = "DIV"; }
    else if (token.lexema == "+") { token.tipo = "SUMA"; }
    else if (token.lexema == "-") { token.tipo = "RESTA"; }
    else if (token.lexema == "(") { token.tipo = "L_PAREN"; }
    else if (token.lexema == ")") { token.tipo = "R_PAREN"; }
    else if (token.lexema == "=") { token.tipo = "IGUAL"; }
    else if (token.lexema == ";") { token.tipo = "PUNTO_COMA";}
    else if (token.lexema == ",") { token.tipo = "COMA"; }
    else if (token.lexema == "<<") { token.tipo = "SHIFT_L"; }
    else if (token.lexema == ">>") { token.tipo = "SHIFT_R"; }
    else if (token.lexema == "{") { token.tipo = "L_LLAVE"; }
    else if (token.lexema == "}") { token.tipo = "R_LLAVE"; }
    else if (token.lexema == ">>") { token.tipo = "SHIFT_R"; }
    
    else if (token.lexema == "==") { token.tipo = "IGUAL_IGUAL"; }
    else if (token.lexema == "!=") { token.tipo = "DISTINTO"; }
    else if (token.lexema == "<") { token.tipo = "MENOR"; }
    else if (token.lexema == ">") { token.tipo = "MAYOR"; }
    else if (token.lexema == "<=") { token.tipo = "MENOR_IGUAL"; }
    else if (token.lexema == ">=") { token.tipo = "MAYOR_IGUAL"; }

    else if (token.lexema == "int") { token.tipo = "INT"; }
    else if (token.lexema == "float") { token.tipo = "FLOAT"; }
    else if (token.lexema == "string") { token.tipo = "CADENA"; }
    else if (token.lexema == "char") { token.tipo = "CARACTER"; }
    
    else if (token.lexema == "cout") { token.tipo = "COUT"; }
    else if (token.lexema == "cin") { token.tipo = "CIN"; }
    
    else if (token.lexema == "if") { token.tipo = "IF"; }
    else if (token.lexema == "else") { token.tipo = "ELSE"; }
    else if (token.lexema == "do") { token.tipo = "DO"; }
    else if (token.lexema == "while") { token.tipo = "WHILE"; }
    
    else if (token.tipo == "NUM_REAL") { token.tipo = "NUM"; }
    else if (token.tipo == "CADENA") { }
    else if (token.tipo == "NUM") { }
    else if (token.tipo == "EOF") { }
    else if (token.tipo == "ID") { }

    else throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error Léxico: Carácter '${token.lexema}' no reconocido`);
}

function match(tipoEsperado) {
    if (lookahead.tipo === tipoEsperado) {
        const tokenActual = lookahead;
        lookahead = obtenerSigTokenEspecifico();
        return tokenActual;
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error Sintáctico: Se esperaba '${tipoEsperado}', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function main() {
    let instrucciones = [];

    while (lookahead.tipo !== "EOF") {
        let instruccion = I();
        
        if (Array.isArray(instruccion)) {
            instrucciones = instrucciones.concat(instruccion);
        } else {
            instrucciones.push(instruccion);
        }
    }
    return instrucciones;
}

function L() {
    let instrucciones = [];

    while (SimbolosD.L_INST.includes(lookahead.tipo)) {
        let instruccion = I();

        if (Array.isArray(instruccion)) {
            instrucciones = instrucciones.concat(instruccion);
        } else {
            instrucciones.push(instruccion);
        }
    }

    if (SimbolosD.L_EPSILON.includes(lookahead.tipo)) {
        return instrucciones;
    }

    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en L: Token '${lookahead.tipo}' ('${lookahead.lexema}') no permitido en lista de instrucciones`);
}

function I() {
    if (SimbolosD.I_ASIGNAR.includes(lookahead.tipo)) {
        const idToken = match("ID");
        match("IGUAL");
        const nodoE = E();
        match("PUNTO_COMA");
        return new Nodo("ASIGNAR", idToken.lexema, null, nodoE, idToken.linea);
    }
    else if (SimbolosD.I_COUT.includes(lookahead.tipo)) {
        match("COUT");
        match("SHIFT_L");
        const nodoE = E();
        match("PUNTO_COMA");
        return new Nodo("IMPRIMIR", "cout", null, nodoE);
    }
    else if (SimbolosD.I_CIN.includes(lookahead.tipo)) {
        match("CIN");
        match("SHIFT_R");
        let idToken = match("ID");
        match("PUNTO_COMA");
        return new Nodo("LEER", idToken.lexema);
    }
    else if (SimbolosD.I_DEC.includes(lookahead.tipo)) {
        const nodoType = Type();
        const nodoDecL = DecL(nodoType);
        match("PUNTO_COMA");
        return nodoDecL;
    }
    else if (SimbolosD.I_IF.includes(lookahead.tipo)) {
        match("IF");
        match("L_PAREN");
        const condicion = Exp();
        match("R_PAREN");
        match("L_LLAVE");
        const bloqueIf = L();
        match("R_LLAVE");
        const bloqueElse = ElseO();

        return new Nodo("IF", "if", condicion, { bloqueV : bloqueIf, bloqueF : bloqueElse });
    }
    else if (SimbolosD.I_WHILE.includes(lookahead.tipo)) {
        match("WHILE");
        match("L_PAREN");
        const condicion = Exp();
        match("R_PAREN");
        match("L_LLAVE");
        const bloqueWhile = L();
        match("R_LLAVE");
        
        return new Nodo("WHILE", "while", condicion, bloqueWhile);
    }

    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error Sintáctico: Se esperaba una instrucción, pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function DecL(tipoDato) {
    if (SimbolosD.DEC_L.includes(lookahead.tipo)) {
        let idToken = match("ID");
        const valorInicial = InitO();
    
        const nodoActual = new Nodo("DECLARAR", tipoDato, idToken.lexema, valorInicial, idToken.linea);

        let masDeclaraciones = DecT(tipoDato);

        return [nodoActual].concat(masDeclaraciones);
    }
}

function InitO() {
    if (SimbolosD.INIT_O_IGUAL.includes(lookahead.tipo)) {
        match("IGUAL");
        return E();
    }
    else if (SimbolosD.INIT_O_EPSILON.includes(lookahead.tipo)) {
        return null;
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en InitO: Se esperaba '=' o ',' o ';', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function DecT(tipoDato) {
    if (SimbolosD.DEC_T_COMA.includes(lookahead.tipo)) {
        match("COMA");
        let idToken = match("ID");
        return DecL(tipoDato);
    }
    else if (SimbolosD.DEC_T_EPSILON.includes(lookahead.tipo)) {
        return [];
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en DecT: Se esperaba ',' o ';', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function Exp() {
    if (SimbolosD.EXP.includes(lookahead.tipo)) {
        const izq = E();
        const operadorRelacional = ExpRelO();
        const der = E();
        
        return new Nodo("RELACIONAL", operadorRelacional, izq, der);
    }

    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en Exp: Se esperaba número o ID o '(' o cadena o caracter, pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function ExpRelO() {
    const opRelacionales = [...SimbolosD.RELOP_IGUAL_I, ...SimbolosD.RELOP_DIF, ...SimbolosD.RELOP_MAYOR, ...SimbolosD.RELOP_MENOR, ...SimbolosD.RELOP_MAYOR_IGUAL, ...SimbolosD.RELOP_MENOR_IGUAL];

    if (opRelacionales.includes(lookahead.tipo)) {
        const operador = lookahead.lexema;
        match(lookahead.tipo);
        return operador;
    }

    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en ExpRelO: Se esperaba un operador relacional, pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function ElseO() {
    if (SimbolosD.ELSE_O.includes(lookahead.tipo)) {
        match("ELSE");
        match("L_LLAVE");
        const bloqueElse = L();
        match("R_LLAVE");
        return bloqueElse;
    }
    else if (SimbolosD.ELSE_O_EPSILON.includes(lookahead.tipo)) {
        return null;
    }

    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en ElseO: Se esperaba 'else' o el final del bloque, pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function Type() {
    const tipos = [...SimbolosD.TYPE_INT, ...SimbolosD.TYPE_FLOAT, ...SimbolosD.TYPE_CHAR, ...SimbolosD.TYPE_STR];

    if (tipos.includes(lookahead.tipo)) {
        const tipoEncontrado = lookahead.tipo;
        match(lookahead.tipo);
        return tipoEncontrado;
    }
}

function E() {
    if (SimbolosD.E_ARIT.includes(lookahead.tipo)) {
        const nodoT = T();
        return X(nodoT);
    }
    else if (SimbolosD.E_CAD.includes(lookahead.tipo)) {
        const cadenaToken = match("CADENA");
        return new Nodo("CADENA", cadenaToken.lexema);
    }
    else if (SimbolosD.E_CAR.includes(lookahead.tipo)) {
        const charToken = match("CARACTER");
        return new Nodo("CARACTER", charToken.lexema);
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en E: Se esperaba número o cadena o caracter o ID o '(', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function X(nodoHeredado) {
    if (SimbolosD.X_SUMA.includes(lookahead.tipo)) {
        match("SUMA");
        const nodoT = T();
        const nodoSuma = new Nodo("SUMA", "+", nodoHeredado, nodoT);
        return X(nodoSuma);
    }
    else if (SimbolosD.X_RESTA.includes(lookahead.tipo)) {
        match("RESTA");
        const nodoT = T();
        const nodoResta = new Nodo("RESTA", "-", nodoHeredado, nodoT);
        return X(nodoResta);
    }
    else if (SimbolosD.X_EPSILON.includes(lookahead.tipo)) {
        return nodoHeredado;
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en X: Token '${lookahead.tipo}' ('${lookahead.lexema}') no permitido tras expresión`);
}

function T() {
    if (SimbolosD.T.includes(lookahead.tipo)) {
        const nodoF = F();
        return W(nodoF);
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en T: Se esperaba número, ID o '(', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

function W(nodoHeredado) {
    if (SimbolosD.W_MULT.includes(lookahead.tipo)) {
        match("MULT");
        const nodoF = F();
        const nodoMult = new Nodo("MULT", "*", nodoHeredado, nodoF);
        return W(nodoMult);
    }
    else if (SimbolosD.w_DIV.includes(lookahead.tipo)) {
        match("DIV");
        const nodoF = F();
        const nodoDiv = new Nodo("DIV", "/", nodoHeredado, nodoF, lookahead.linea);
        return W(nodoDiv);
    }
    else if (SimbolosD.W_EPSILON.includes(lookahead.tipo)) {
        return nodoHeredado;
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en W: Token '${lookahead.tipo}' ('${lookahead.lexema}') no permitido tras término`);
}

function F() {
    if (SimbolosD.F_NUM.includes(lookahead.tipo)) {
        const numToken = match("NUM");
        return new Nodo("NUM", numToken.lexema);
    }
    else if (SimbolosD.F_ID.includes(lookahead.tipo)) {
        const idToken = match("ID");
        return new Nodo("ID", idToken.lexema, null, null, lookahead.linea);
    }
    else if (SimbolosD.F_PAREN.includes(lookahead.tipo)) {
        match("L_PAREN");
        const nodoE = E();
        match("R_PAREN");
        return nodoE;
    }
    throw new Error(`<b>[Linea ${lookahead.linea}]</b> Error en F: Se esperaba número, ID o '(', pero se encontró '${lookahead.tipo}' ('${lookahead.lexema}')`);
}

let tablaSimbolos = {};

async function evaluar(nodo) {
    if (!nodo) return null;

    if (nodo.tipo == "NUM"){
        return Number(nodo.lexema);
    }
    else if (nodo.tipo == "CADENA" || nodo.tipo == "CARACTER") {
        return nodo.lexema.slice(1, -1); 
    }
    else if (nodo.tipo == "ID"){
        if (nodo.lexema in tablaSimbolos) {
            return tablaSimbolos[nodo.lexema];
        }
        throw new Error(`<b>[Linea ${nodo.linea}]</b> Error Semántico: Variable '${nodo.lexema}' no definida`);
    }
    else if (nodo.tipo == "SUMA"){
        return await evaluar(nodo.izq) + await evaluar(nodo.der);
    }
    else if (nodo.tipo == "RESTA"){
        return await evaluar(nodo.izq) - await evaluar(nodo.der);
    }
    else if (nodo.tipo == "MULT"){
        return await evaluar(nodo.izq) * await evaluar(nodo.der);
    }
    else if (nodo.tipo == "DIV"){
        const divisor = await evaluar(nodo.der);
        if (divisor === 0) {
            throw new Error(`<b>[Linea ${nodo.linea}]</b> Error Semántico: División por cero`);
        }
        return await evaluar(nodo.izq) / divisor;
    }
    else if (nodo.tipo == "DECLARAR"){
        let nombreVar = nodo.izq;
        let valorInicial = undefined;
        if (nodo.der) {
            valorInicial = await evaluar(nodo.der);
        }
        tablaSimbolos[nombreVar] = valorInicial !== undefined ? valorInicial : null;

        datosAImprimir.push(`Declaración: ${nodo.lexema} ${nombreVar} ${valorInicial !== undefined ? ` = ${valorInicial}` : ''}`);
        return valorInicial;
    }
    else if (nodo.tipo == "ASIGNAR"){
        let valor = await evaluar(nodo.der);
        if (nodo.lexema in tablaSimbolos) {
            tablaSimbolos[nodo.lexema] = valor;
            datosAImprimir.push(`Asignación: ${nodo.lexema} = ${valor}`);
            return valor;
        }
        throw new Error(`<b>[Linea ${nodo.linea}]</b> Error Semántico: Variable '${nodo.lexema}' no definida`);
    }
    else if (nodo.tipo == "IMPRIMIR"){
        let valor = await evaluar(nodo.der);
        datosAImprimir.push(`SALIDA COUT: <b>${valor}</b>`);
        return valor;
    }

    else if (nodo.tipo == "LEER"){
        let nombreVar = nodo.lexema;

        mostrarResultadoPanelParser(datosAImprimir);

        const valorIngresado = await pedirValorPanelParser(nombreVar);

        tablaSimbolos[nombreVar] = Number(valorIngresado);
        datosAImprimir.push(`<span style="color: #63b3ed;">[Entrada usuario] cin >> ${nombreVar}: ${valorIngresado}</span>`);
        return Number(valorIngresado);
    }

    else if (nodo.tipo == "RELACIONAL") {
        let valIzq = await evaluar(nodo.izq);
        let valDer = await evaluar(nodo.der);
        let op = nodo.lexema;
        
        if (op === "==") return valIzq == valDer;
        if (op === "!=") return valIzq != valDer;
        if (op === "<")  return valIzq < valDer;
        if (op === ">")  return valIzq > valDer;
        if (op === "<=") return valIzq <= valDer;
        if (op === ">=") return valIzq >= valDer;
    }

    else if (nodo.tipo == "IF") {
        let condicionEsVerdadera = await evaluar(nodo.izq);
        
        if (condicionEsVerdadera) {
            await ejecutar(nodo.der.bloqueV);
        } else if (nodo.der.bloqueF !== null) {
            await ejecutar(nodo.der.bloqueF);
        }
    }
    else if (nodo.tipo == "WHILE") {
        while (await evaluar(nodo.izq)) {
            await ejecutar(nodo.der);
        }
    }
}

async function ejecutar(arbolSintacticoAbstracto) {
    if (!arbolSintacticoAbstracto) return;

    for (let i = 0; i < arbolSintacticoAbstracto.length; i++) {
        await evaluar(arbolSintacticoAbstracto[i]);
    }
}