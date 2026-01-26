let posicionActual = 0;
let contenidoFuente = "";
const ALFABETO = ["si", "sino", "finsi", "mientras", "finmientras"];

async function ejecutarAnalisis() {
    const selectorArchivos = document.getElementById('archivo');
    const areaTexto = document.getElementById('editor');

    // Prioriza el archivo si se selecciono uno, de lo contrario usa el texto escrito
    if (selectorArchivos.files[0]) {
        contenidoFuente = await selectorArchivos.files[0].text();
        areaTexto.value = contenidoFuente;
    } else {
        contenidoFuente = areaTexto.value;
    }

    if (contenidoFuente.trim() === "") return;

    posicionActual = 0;
    const tokens = [];

    // Fase 1: Scanner (Lexico)
    while (posicionActual < contenidoFuente.length) {
        let token = obtenerSiguienteToken();
        if (token && token.tipo !== "SKIP") {
            tokens.push(token);
        }
    }

    // Fase 2: Automata a Pila (Sintactico)
    const validacion = validarEstructura(tokens);
    mostrarResultado(validacion);
}

function obtenerSiguienteToken() {
    let caracter = contenidoFuente.charAt(posicionActual);

    if (/\s/.test(caracter)) {
        posicionActual++;
        return { tipo: "SKIP" };
    }

    if (/[a-zA-Z]/.test(caracter)) {
        let lexema = "";
        while (posicionActual < contenidoFuente.length && /[a-zA-Z]/.test(contenidoFuente.charAt(posicionActual))) {
            lexema += contenidoFuente.charAt(posicionActual);
            posicionActual++;
        }
        let lexLower = lexema.toLowerCase();
        return { tipo: ALFABETO.includes(lexLower) ? "PR" : "ID", lexema: lexLower };
    }

    posicionActual++;
    return { tipo: "OTRO", lexema: caracter };
}

function validarEstructura(tokens) {
    let pila = [];
    let errores = [];

    for (let token of tokens) {
        // PUSH: Empilar aperturas
        if (token.lexema === "si" || token.lexema === "mientras") {
            pila.push(token.lexema);
        } 
        // POP: Desempilar y validar cierres
        else if (token.lexema === "finsi") {
            if (pila.length === 0 || pila.pop() !== "si") {
                errores.push("Error: finsi sin si");
            }
        } else if (token.lexema === "finmientras") {
            if (pila.length === 0 || pila.pop() !== "mientras") {
                errores.push("Error: finmientras sin mientras");
            }
        }
    }

    // Al final la pila debe estar vacia
    while (pila.length > 0) {
        errores.push("Error: Estructura " + pila.pop() + " no cerrada");
    }

    return { esValido: errores.length === 0, mensajes: errores };
}

function mostrarResultado(val) {
    let panel = document.getElementById('panelResultados');
    let clase = val.esValido ? "valido" : "error";
    let texto = val.esValido ? "ARCHIVO CORRECTO" : "ARCHIVO INCORRECTO";

    let html = `<div class="status-banner ${clase}">${texto}</div>`;
    
    if (!val.esValido) {
        html += `<ul style="margin-top:20px; color:#721c24;">`;
        val.mensajes.forEach(m => html += `<li>${m}</li>`);
        html += `</ul>`;
    }

    panel.innerHTML = html;
}
