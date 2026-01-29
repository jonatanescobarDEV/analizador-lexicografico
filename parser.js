let posicionActual = 0;
let contenidoFuente = "";
let html = "";
let tokens = [];
const ALFABETO = ["si", "sino", "finsi", "mientras", "finmientras"];

export async function ejecutarAnalisis() {
    const selectorArchivos = document.getElementById('archivo');
    const areaTexto = document.getElementById('editor');
    
    posicionActual = 0;
    contenidoFuente = "";
    tokens = [];

    if (selectorArchivos.files[0]) {
        contenidoFuente = await selectorArchivos.files[0].text();
        areaTexto.value = contenidoFuente;
    } else {
        contenidoFuente = areaTexto.value;
    }

    const validacion = validarEstructura();
    mostrarResultado(validacion);
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
                posicionActual++;
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


function mostrarResultado(val) {
    let panel = document.getElementById('panelResultados');
    let clase = val === "reconoce" ? "valido" : "error";
    let texto = val === "reconoce" ? "ARCHIVO CORRECTO" : "ARCHIVO INCORRECTO";
    
    html = `<div class="status-banner ${clase}">${texto}</div>`;
    
    mostrarEstructuraVerificada(clase)
    
    panel.innerHTML = html;
}

function mostrarEstructuraVerificada(clase){
    let contTab = 0;
    while (tokens.length > 0) {
        let token = tokens.shift();
        if (token === "si" || token === "mientras"){
            html += `<div class="codigo-${clase}"> `+ "\t".repeat(contTab) + token + "</div>";
            contTab++;
        } else if (token === "finsi" || token === "finmientras"){
            contTab--;
            if (contTab < 0) contTab = 0;
            html += `<div class="codigo-${clase}"> ` + "\t".repeat(contTab) + token + "</div>";
        }
    }
}
