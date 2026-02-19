let tablaSimbolos = {};
let tokensLocales = [];
let i = 0;
let tokenActual = null;
let errorSintactico = false;

export async function iniciarInterpretacion(tokensLexer) {
    const areaSalida = document.getElementById('panelLL1'); 
    let htmlSalida = `<div class="status-banner valido-ll1">EJECUCIÓN ARITMÉTICA (LL1)</div>`;
    
   
    tokensLocales = tokensLexer.filter(t => t && t.tipo !== "SKIP");
    i = 0;
    tablaSimbolos = {}; 
    errorSintactico = false;

    try {
        while (i < tokensLocales.length && !errorSintactico) {
            scanner(); 
            
           
            if (tokenActual.tipo === "ID" && tokenActual.lexema !== "cout") {
                let nombreVariable = tokenActual.lexema;
                
                
                let sigToken = tokensLocales[i]; 
                
                if (sigToken && sigToken.lexema === "=") {
                    scanner(); 
                    let resultadoCalculado = E(); 
                    
                    if (tokenActual.lexema === ";") {
                        tablaSimbolos[nombreVariable] = resultadoCalculado;
                        htmlSalida += `<div class="linea-asignacion">Asignación: ${nombreVariable} = ${resultadoCalculado}</div>`;
                    } else {
                        throw new Error("Se esperaba ';' al final de la asignación de " + nombreVariable);
                    }
                }
            } 
          
            else if (tokenActual.lexema === "cout") {
                scanner();
                if (tokenActual.lexema === "<<") {
                    scanner();
                    let valorParaImprimir = E();
                    if (tokenActual.lexema === ";") {
                        htmlSalida += `<div class="linea-cout">SALIDA COUT: <b>${valorParaImprimir}</b></div>`;
                    } else {
                        throw new Error("Se esperaba ';' después del cout");
                    }
                } else {
                    throw new Error("Se esperaba '<<' después de cout");
                }
            }
        }
    } catch (err) {
        errorSintactico = true;
        
        htmlSalida = `<div class="error-ll1">ERROR: ${err.message}</div>` + htmlSalida;
    }

    areaSalida.innerHTML = htmlSalida;
}

function scanner() {
	if (i < tokensLocales.length) {
		tokenActual = tokensLocales[i];
		i = i + 1;
	} else {
		tokenActual = { tipo: "FIN", lexema: "$" };
	}
}

function E() {
	let resultadoT = T();
	let resultadoFinal = E_Prima(resultadoT);
	return resultadoFinal;
}

function E_Prima(valorIzquierdo) {
	if (tokenActual.lexema === "+") {
		scanner(); 
		let valorSiguienteT = T();
		let sumaProcesada = valorIzquierdo + valorSiguienteT;
		return E_Prima(sumaProcesada);
	} 
	
	return valorIzquierdo;
}

function T() {
	let resultadoF = F();
	let resultadoFinal = T_Prima(resultadoF);
	return resultadoFinal;
}

function T_Prima(valorIzquierdo) {
	if (tokenActual.lexema === "*") {
		scanner(); 
		let valorSiguienteF = F();
		let multiplicacionProcesada = valorIzquierdo * valorSiguienteF;
		return T_Prima(multiplicacionProcesada);
	}
	
	return valorIzquierdo; 
}

function F() {
	if (tokenActual.lexema === "(") {
		scanner();
		let valorInternoE = E();
		
		if (tokenActual.lexema === ")") {
			scanner();
			return valorInternoE;
		} else {
			throw new Error("Falta cerrar paréntesis");
		}
	} 
	
	if (tokenActual.tipo === "NUM" || tokenActual.tipo === "NUM_REAL") {
		let valorNumero = parseFloat(tokenActual.lexema);
		scanner();
		return valorNumero;
	} 
	
	if (tokenActual.tipo === "ID") {
		let nombreVar = tokenActual.lexema;
		let valorDeVariable = tablaSimbolos[nombreVar];
		
		if (valorDeVariable === undefined) {
			throw new Error("Variable '" + nombreVar + "' no definida");
		}
		
		scanner();
		return valorDeVariable;
	} 
	
	throw new Error("Se esperaba un número o variable y se encontró: " + tokenActual.lexema);
}