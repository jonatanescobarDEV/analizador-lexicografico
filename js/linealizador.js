import { astGlobal } from "./parser.js";
import { mostrarResultadoPanelLTA } from "./ui.js";

let contadorEtiquetas = 1;
let codigoLinealizado = [];

let listaTercetos = [];
let numTerceto = 1;

function nuevaEtiqueta() {
    return "E" + (contadorEtiquetas++);
}

function obtenerOperadorInvertido(op) {
    if (op === "==") return "!=";
    if (op === "!=") return "==";
    if (op === "<") return ">=";
    if (op === ">") return "<=";
    if (op === "<=") return ">";
    if (op === ">=") return "<";
    return op;
}

function invertirCondicion(nodoRelacional) {
    let op = obtenerOperadorInvertido(nodoRelacional.lexema);
    let izq = obtenerTextoExpresion(nodoRelacional.izq);
    let der = obtenerTextoExpresion(nodoRelacional.der);
    return `${izq} ${op} ${der}`;
}

function obtenerTextoExpresion(nodo) {
    if (!nodo) return "";
    if (["NUM", "ID", "CADENA", "CARACTER"].includes(nodo.tipo)) return nodo.lexema;
    if (["SUMA", "RESTA", "MULT", "DIV"].includes(nodo.tipo)) {
        return `${obtenerTextoExpresion(nodo.izq)} ${nodo.lexema} ${obtenerTextoExpresion(nodo.der)}`;
    }
    return "";
}

function crearTerceto(op, arg1, arg2) {
    let indice = numTerceto++;
    listaTercetos.push({ indice, op, arg1, arg2 });
    return `(${indice})`; 
}

function evaluarExpTerceto(nodo) {
    if (!nodo) return "";
    if (["NUM", "ID", "CADENA", "CARACTER"].includes(nodo.tipo)) return nodo.lexema;
    if (["SUMA", "RESTA", "MULT", "DIV"].includes(nodo.tipo)) {
        let izq = evaluarExpTerceto(nodo.izq);
        let der = evaluarExpTerceto(nodo.der);
        return crearTerceto(nodo.lexema, izq, der); 
    }
    return "";
}

function generarSaltosCondicion(op) {
    let indices = [];
    if (op === ">") {
        indices.push(numTerceto); crearTerceto("BP", "???", "");
    } else if (op === "<") {
        indices.push(numTerceto); crearTerceto("BN", "???", "");
    } else if (op === "==") {
        indices.push(numTerceto); crearTerceto("BE", "???", "");
    } else if (op === ">=") {
        indices.push(numTerceto); crearTerceto("BP", "???", "");
        indices.push(numTerceto); crearTerceto("BE", "???", "");
    } else if (op === "<=") {
        indices.push(numTerceto); crearTerceto("BN", "???", "");
        indices.push(numTerceto); crearTerceto("BE", "???", "");
    } else if (op === "!=") {
        indices.push(numTerceto); crearTerceto("BP", "???", "");
        indices.push(numTerceto); crearTerceto("BN", "???", "");
    }
    return indices;
}

function procesarTercetos(nodos) {
    if (!nodos) return;
    let listaNodos = Array.isArray(nodos) ? nodos : [nodos];

    for (let nodo of listaNodos) {
        if (!nodo) continue;

        if (nodo.tipo === "ASIGNAR") {
            let resDer = evaluarExpTerceto(nodo.der);
            crearTerceto("=", nodo.lexema, resDer);
        } 
        else if (nodo.tipo === "LEER") {
            crearTerceto("cin", nodo.lexema, "");
        } 
        else if (nodo.tipo === "IMPRIMIR") {
            let resDer = evaluarExpTerceto(nodo.der);
            crearTerceto("cout", resDer, "");
        } 
        else if (nodo.tipo === "WHILE") {
            let idxInicio = numTerceto;
            let resIzq = evaluarExpTerceto(nodo.izq.izq);
            let resDer = evaluarExpTerceto(nodo.izq.der);
            
            crearTerceto("-", resIzq, resDer);
            
            let opInvertido = obtenerOperadorInvertido(nodo.izq.lexema);
            let idxSaltosSalida = generarSaltosCondicion(opInvertido);
            
            procesarTercetos(nodo.der); 
            crearTerceto("B", `${idxInicio}`, ""); 
            
            idxSaltosSalida.forEach(idx => {
                listaTercetos[idx - 1].arg1 = `${numTerceto}`;
            });
        } 
        else if (nodo.tipo === "IF") {
            let resIzq = evaluarExpTerceto(nodo.izq.izq);
            let resDer = evaluarExpTerceto(nodo.izq.der);
            
            crearTerceto("-", resIzq, resDer);
            
            let opInvertido = obtenerOperadorInvertido(nodo.izq.lexema);
            let idxSaltosFalsos = generarSaltosCondicion(opInvertido);
            
            procesarTercetos(nodo.der.bloqueV); 
            
            if (!nodo.der.bloqueF) {
                idxSaltosFalsos.forEach(idx => {
                    listaTercetos[idx - 1].arg1 = `${numTerceto}`;
                });
            } else {
                let idxSaltoFin = numTerceto;
                crearTerceto("B", "???", ""); 
                
                idxSaltosFalsos.forEach(idx => {
                    listaTercetos[idx - 1].arg1 = `${numTerceto}`;
                });
                
                procesarTercetos(nodo.der.bloqueF);
                listaTercetos[idxSaltoFin - 1].arg1 = `${numTerceto}`;
            }
        }
    }
}

function recorrerASTLinealizacion(nodos) {
    if (!nodos) return;
    let listaNodos = Array.isArray(nodos) ? nodos : [nodos];

    for (let nodo of listaNodos) {
        if (!nodo) continue;
        if (nodo.tipo === "DECLARAR") {
            codigoLinealizado.push({ etiqueta: "", instruccion: `${nodo.lexema} ${nodo.izq};` });
        } else if (nodo.tipo === "ASIGNAR") {
            codigoLinealizado.push({ etiqueta: "", instruccion: `${nodo.lexema} = ${obtenerTextoExpresion(nodo.der)};` });
        } else if (nodo.tipo === "LEER") {
            codigoLinealizado.push({ etiqueta: "", instruccion: `cin >> ${nodo.lexema};` });
        } else if (nodo.tipo === "IMPRIMIR") {
            codigoLinealizado.push({ etiqueta: "", instruccion: `cout << ${obtenerTextoExpresion(nodo.der)};` });
        } else if (nodo.tipo === "WHILE") {
            let eInicio = nuevaEtiqueta();
            let eFin = nuevaEtiqueta();
            codigoLinealizado.push({ etiqueta: eInicio, instruccion: `if (${invertirCondicion(nodo.izq)}) goto ${eFin};` });
            recorrerASTLinealizacion(nodo.der);
            codigoLinealizado.push({ etiqueta: "", instruccion: `goto ${eInicio};` });
            codigoLinealizado.push({ etiqueta: eFin, instruccion: "" });
        } else if (nodo.tipo === "IF") {
            let eFinIf = nuevaEtiqueta();
            if (!nodo.der.bloqueF) {
                codigoLinealizado.push({ etiqueta: "", instruccion: `if (${invertirCondicion(nodo.izq)}) goto ${eFinIf};` });
                recorrerASTLinealizacion(nodo.der.bloqueV);
                codigoLinealizado.push({ etiqueta: eFinIf, instruccion: "" });
            } else {
                let eFinElse = nuevaEtiqueta();
                codigoLinealizado.push({ etiqueta: "", instruccion: `if (${invertirCondicion(nodo.izq)}) goto ${eFinIf};` });
                recorrerASTLinealizacion(nodo.der.bloqueV);
                codigoLinealizado.push({ etiqueta: "", instruccion: `goto ${eFinElse};` });
                codigoLinealizado.push({ etiqueta: eFinIf, instruccion: "" });
                recorrerASTLinealizacion(nodo.der.bloqueF);
                codigoLinealizado.push({ etiqueta: eFinElse, instruccion: "" });
            }
        }
    }
}

function obtenerVariablesUnicas(nodos, vars = new Set()) {
    if (!nodos) return vars;
    let lista = Array.isArray(nodos) ? nodos : [nodos];
    for (let nodo of lista) {
        if (!nodo) continue;
        if (nodo.tipo === "DECLARAR") {
            vars.add(nodo.izq);
        } else if (nodo.tipo === "WHILE") {
            obtenerVariablesUnicas(nodo.der, vars);
        } else if (nodo.tipo === "IF") {
            obtenerVariablesUnicas(nodo.der.bloqueV, vars);
            if (nodo.der.bloqueF) obtenerVariablesUnicas(nodo.der.bloqueF, vars);
        }
    }
    return Array.from(vars);
}

function formatoArg(arg) {
    if (!arg) return "";
    let match = String(arg).match(/^\((\d+)\)$/);
    if (match) return "t" + match[1];
    return arg;
}

function generarEnsamblador() {
    let asm = [];
    
    asm.push("org 100h");
    asm.push("");
    asm.push("jmp inicio ; Salta las variables para no ejecutarlas accidentalmente");
    asm.push("");

    let variables = obtenerVariablesUnicas(astGlobal);
    variables.forEach(v => {
        asm.push(`${v} dw 0`);
    });

    listaTercetos.forEach(t => {
        if (["+", "-", "*", "/"].includes(t.op)) {
            asm.push(`t${t.indice} dw 0`);
        }
    });

    let mapStrings = {};
    let contadorStrings = 0;
    listaTercetos.forEach(t => {
        if (t.op === "cout" && (t.arg1.startsWith('"') || t.arg1.startsWith("'"))) {
            if (t.arg1 !== '"\\n"' && t.arg1 !== "'\\n'") { 
                if (!mapStrings[t.arg1]) {
                    mapStrings[t.arg1] = `msg_${contadorStrings++}`;
                    asm.push(`${mapStrings[t.arg1]} db ${t.arg1}, '$'`); 
                }
            }
        }
    });

    asm.push("");
    asm.push("inicio:");
    asm.push("");

    
    listaTercetos.forEach(t => {
        asm.push(`L${t.indice}:`); 
        
        let arg1 = formatoArg(t.arg1);
        let arg2 = formatoArg(t.arg2);

        switch (t.op) {
            case "=":
                asm.push(`    mov ax, ${arg2}`);
                asm.push(`    mov ${arg1}, ax`);
                break;
            case "+":
                asm.push(`    mov ax, ${arg1}`);
                asm.push(`    add ax, ${arg2}`);
                asm.push(`    mov t${t.indice}, ax`);
                break;
            case "-":
                asm.push(`    mov ax, ${arg1}`);
                asm.push(`    sub ax, ${arg2}`);
                asm.push(`    mov t${t.indice}, ax`);
                break;
            case "BP":
                asm.push(`    jg L${t.arg1}`); 
                break;
            case "BN":
                asm.push(`    jl L${t.arg1}`); 
                break;
            case "BE":
                asm.push(`    je L${t.arg1}`); 
                break;
            case "B":
                asm.push(`    jmp L${t.arg1}`); 
                break;
            case "cin":
                asm.push(`    call lee_num`);
                asm.push(`    xor ah, ah`);   
                asm.push(`    mov ${arg1}, ax`); 
                break;
            case "cout":
                if (arg1 === '"\\n"' || arg1 === "'\\n'") {
                    asm.push(`    call print_nl`);
                } else if (arg1.startsWith('"') || arg1.startsWith("'")) {
                    let msgVar = mapStrings[arg1];
                    asm.push(`    lea dx, ${msgVar}`);
                    asm.push(`    mov ah, 09h`);
                    asm.push(`    int 21h`);
                } else if (!isNaN(arg1)) {
                    asm.push(`    mov dl, ${arg1}`); 
                    asm.push(`    call imp_num`);
                } else {
                    asm.push(`    mov ax, ${arg1}`);
                    asm.push(`    mov dl, al`);      
                    asm.push(`    call imp_num`);
                }
                break;
        }
    });

    asm.push(`L${listaTercetos.length + 1}:`); 
    asm.push("    ret");
    asm.push("");

    
    asm.push(
`;--------------------------------------------
; Imprime un salto de linea
;--------------------------------------------
proc print_nl
    push ax
    push dx
    mov ah, 02h
    mov dl, 13  ; Carriage Return
    int 21h
    mov dl, 10  ; Line Feed
    int 21h
    pop dx
    pop ax
    ret
endp

;--------------------------------------------
; Lee numero decimal de dos digitos 00-99
; El numero es devuelto en AL
;--------------------------------------------
proc lee_num  
    push bx   
    push cx
    mov ah,01
    int 21h   ; lee 1er digito
    sub al,'0'
    mov bl,al ; guardar 1er digito en bl
    
    mov ah,01
    int 21h   ; lee 2do digito
    sub al,'0'
    
    mov cx,10
F1:
    add al,bl ; al 2do digito le sumamos 10 veces el 1ero  
    loop F1     
    
    pop cx
    pop bx
    ret   
endp    

;--------------------------------------------
; Imprime numero decimal de dos digitos 00-99
; El numero debe enviarse en DL
;--------------------------------------------
proc imp_num
    ; recibe numero en al
  
    push bx
    mov bl,dl
    mov dl,0
F2: cmp bl,9
    jle F3
    sub bl,10
    inc dl
    jmp F2
    
F3: add dl,'0'
    mov ah,02
    int 21h
      
    mov dl,bl
    add dl,'0'
    int 21h
    pop bx    
    ret
endp`);

    return asm.join("\n");
}

export async function ejecutarAnalisis() {
    contadorEtiquetas = 1;
    codigoLinealizado = [];
    listaTercetos = [];
    numTerceto = 1;
    let ensamblador = "";
    
    if (astGlobal) {
        recorrerASTLinealizacion(astGlobal);
        procesarTercetos(astGlobal);    
        ensamblador = generarEnsamblador();
    }
    
    mostrarResultadoPanelLTA(codigoLinealizado, listaTercetos, ensamblador); 
}