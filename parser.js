let posicionActual = 0;
let contenidoFuente = "";
let html = "";
let tokens = [];
const ALFABETO = ["si", "sino", "finsi", "mientras", "finmientras"];

let tablaSimbolos = {}; 
let tokenActual = null;
let tokensAritmeticos = [];
let idxAritmetico = 0;

export async function ejecutarAnalisis() {
	const selectorArchivos = document.getElementById('archivo');
	const areaTexto = document.getElementById('editor');
	
	posicionActual = 0;
	contenidoFuente = "";
	tokens = [];
	
	tablaSimbolos = {};

	if (selectorArchivos.files[0]) {
		contenidoFuente = await selectorArchivos.files[0].text();
		areaTexto.value = contenidoFuente;
	} else {
		contenidoFuente = areaTexto.value;
	}

	const validacion = validarEstructura();
	
	mostrarResultado(validacion);

	posicionActual = 0; 
	
	iniciarInterpretacionAritmetica();
}

function obtenerSiguienteToken() {
	while (posicionActual < contenidoFuente.length) {
		let caracter = contenidoFuente.charAt(posicionActual);
	
		if (/[a-zA-Z]/.test(caracter)) {
			let lexema = "";
			
			while (posicionActual < contenidoFuente.length && /[a-zA-Z]/.test(contenidoFuente.charAt(posicionActual))) {
				lexema = lexema + contenidoFuente.charAt(posicionActual);
				posicionActual = posicionActual + 1;
			}
			
			let lexLower = lexema.toLowerCase();

			if (ALFABETO.includes(lexLower)) {
				tokens.push(lexLower);
				posicionActual = posicionActual + 1;
				return lexLower;
			}
		} else {
			posicionActual = posicionActual + 1;
		}
	} 
	
	return null;
}

function validarEstructura() {
	let pila = [];
	let qF = 100;
	let qE = -1;
	let q = 0;
	
	while (q !== qF && q !== qE) {
		let token = obtenerSiguienteToken();
		let cabezaPila = null;
		
		if (pila.length > 0) {
			cabezaPila = pila[pila.length - 1];
		}

		if (q === 0) {
			if (pila.length === 0) {
				if (token === "si") {
					q = 1;
					pila.push("si");
				} else if (token === "mientras") {
					q = 1;
					pila.push("mientras");
				} else {
					q = qE;
				}
			}
		} else if (q === 1) {
			if (token === "si") {
				pila.push("si");
			}

			if (token === "sino") {
				if (cabezaPila === "si") {
					pila.push("sino");
				} else {
					q = qE;
				}
			}

			if (token === "finsi") {
				if (cabezaPila === "si") {
					pila.pop();
				} else if (cabezaPila === "sino") {
					pila.pop();
					pila.pop();
				} else {
					q = qE;
				}
			}
			
			if (token === "mientras") {
				pila.push("mientras");
			}

			if (token === "finmientras") {
				if (cabezaPila === "mientras") {
					pila.pop();
				} else {
					q = qE;
				}
			}

			if (token === null) {
				if (pila.length === 0) {
					q = qF;
				} else {
					q = qE;
				}
			}
		}
	}

	if (q === qF) {
		return "reconoce";
	} else {
		return "error";
	}
}

function iniciarInterpretacionAritmetica() {
	const panelAritmetico = document.getElementById('panelLL1');
	let salidaAritmetica = `<div class="status-banner valido">EJECUCIÓN ARITMÉTICA (LL1)</div>`;
	
	const lineas = contenidoFuente.split(';');
	
	lineas.forEach(linea => {
		let l = linea.trim();
		
		if (l !== "") {
			tokensAritmeticos = l.match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+)?|[+*()=]|<<|;/g) || [];
			idxAritmetico = 0;
			
			avanzarScanner();

			try {
				if (tokenActual === "cout") {
					avanzarScanner();
					
					if (tokenActual === "<<") {
						avanzarScanner();
						
						let res = E();
						
						salidaAritmetica = salidaAritmetica + `<div class="codigo-valido">SALIDA COUT: <b>${res}</b></div>`;
					}
				} else if (/^[a-zA-Z]+$/.test(tokenActual)) {
					let variable = tokenActual;
					
					avanzarScanner();
					
					if (tokenActual === "=") {
						avanzarScanner();
						
						let res = E();
						
						tablaSimbolos[variable] = res;
						
						salidaAritmetica = salidaAritmetica + `<div class="codigo-valido">Asignación: ${variable} = ${res}</div>`;
					}
				}
			} catch (e) {
				salidaAritmetica = salidaAritmetica + `<div class="status-banner error">Error Sintáctico: ${e.message}</div>`;
			}
		}
	});
	
	panelAritmetico.innerHTML = salidaAritmetica;
}

function avanzarScanner() {
	if (idxAritmetico < tokensAritmeticos.length) {
		tokenActual = tokensAritmeticos[idxAritmetico];
		idxAritmetico = idxAritmetico + 1;
	} else {
		tokenActual = "$";
	}
}

function E() {
	let res = T();
	let final = E_Prima(res);
	return final;
}

function E_Prima(izq) {
	if (tokenActual === "+") {
		avanzarScanner();
		
		let der = T();
		
		let suma = izq + der;
		
		return E_Prima(suma);
	}
	
	return izq; 
}

function T() {
	let res = F();
	let final = T_Prima(res);
	return final;
}

function T_Prima(izq) {
	if (tokenActual === "*") {
		avanzarScanner();
		
		let der = F();
		
		let multiplicacion = izq * der;
		
		return T_Prima(multiplicacion);
	}
	
	return izq;
}

function F() {
	if (tokenActual === "(") {
		avanzarScanner();
		
		let res = E();
		
		if (tokenActual !== ")") {
			throw new Error("Se esperaba ')'");
		}
		
		avanzarScanner();
		
		return res;
	} else if (/^[0-9]+(?:\.[0-9]+)?$/.test(tokenActual)) {
		let val = parseFloat(tokenActual);
		
		avanzarScanner();
		
		return val;
	} else if (/^[a-zA-Z]+$/.test(tokenActual)) {
		let valorEnTabla = tablaSimbolos[tokenActual];
		
		if (valorEnTabla === undefined) {
			throw new Error("Variable '" + tokenActual + "' no definida");
		}
		
		avanzarScanner();
		
		return valorEnTabla;
	}
	
	throw new Error("Token inesperado: " + tokenActual);
}

function mostrarResultado(val) {
	let panel = document.getElementById('panelResultados');
	let clase = "error";
	let texto = "ESTRUCTURA INCORRECTA";
	
	if (val === "reconoce") {
		clase = "valido";
		texto = "ESTRUCTURA CORRECTA";
	}
	
	html = `<div class="status-banner ${clase}">${texto}</div>`;
	
	mostrarEstructuraVerificada(clase);
	
	panel.innerHTML = html;
}

function mostrarEstructuraVerificada(clase) {
	let contTab = 0;
	let tokensCopia = [...tokens];
	
	while (tokensCopia.length > 0) {
		let token = tokensCopia.shift();
		
		if (token === "si" || token === "mientras") {
			let espacios = "\t".repeat(contTab);
			html = html + `<div class="codigo-${clase}"> ` + espacios + token + "</div>";
			contTab = contTab + 1;
		} else if (token === "finsi" || token === "finmientras") {
			contTab = contTab - 1;
			
			if (contTab < 0) {
				contTab = 0;
			}
			
			let espacios = "\t".repeat(contTab);
			html = html + `<div class="codigo-${clase}"> ` + espacios + token + "</div>";
		} else if (token === "sino") {
			let espacios = "\t".repeat(contTab - 1);
			html = html + `<div class="codigo-${clase}"> ` + espacios + token + "</div>";
		}
	}
}