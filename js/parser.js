import { contenidoFuente } from "./index.js";
import { mostrarResultadoPanelEstructura } from "./ui.js";

let posicionActual = 0;
let tokens = [];
const ALFABETO = ["si", "sino", "finsi", "mientras", "finmientras"];

export async function ejecutarAnalisis() {
    posicionActual = 0;
    tokens = [];

    const validacion = validarEstructura();
    mostrarResultadoPanelEstructura(validacion, tokens);
}

function obtenerSiguienteToken() {
    while (posicionActual < contenidoFuente.length) {
        let caracter = contenidoFuente.charAt(posicionActual);
    
        if (/[a-zA-Z]/.test(caracter)) {
            let lexema = "";
            while (posicionActual < contenidoFuente.length && /[a-zA-Z]/.test(contenidoFuente.charAt(posicionActual))) {
                lexema += contenidoFuente.charAt(posicionActual);
                posicionActual++;
            }
            let lexLower = lexema.toLowerCase();

            if (ALFABETO.includes(lexLower)) {
                tokens.push(lexLower);
                return lexLower;
            }
        } else {
            posicionActual++;
        }
    } return null;
}

function validarEstructura() {
    let pila = [];
    let qF = 100, qE = -1;
    let q = 0;
    
    while (q !== qF && q !== qE) {
        let token = obtenerSiguienteToken();
        let cabezaPila = pila.length > 0 ? pila[pila.length - 1] : null;
        switch (q) {
            case 0: 
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
                break;

            case 1:
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

                break;

        }
    }

    if (q === qF){
        return "reconoce";
    } else {
        return "error";
    }
}
