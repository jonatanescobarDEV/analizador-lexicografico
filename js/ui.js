import { panelLexer, panelEstructura, panelParser, panelLTA} from "./main.js";

export function mostrarResultadoPanelLexer(contador) {
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
    panelLexer.innerHTML = tablaHTML;
}

export function mostrarResultadoPanelEstructura(val, tokens) {
    let clase = val === "reconoce" ? "valido" : "error";
    let texto = val === "reconoce" ? "ARCHIVO CORRECTO" : "ARCHIVO INCORRECTO";
    let html = `<div class="status-banner ${clase}">${texto}</div>`;
    
    let contTab = 0;
    while (tokens.length > 0) {
        let token = tokens.shift();
        if (token === "si" || token === "mientras"){
            html += `<div class="codigo-${clase}"> `+ "│\t".repeat(contTab) + token + "</div>";
            contTab++;
        } else if (token === "finsi" || token === "finmientras"){
            contTab--;
            if (contTab < 0) contTab = 0;
            html += `<div class="codigo-${clase}"> ` + "│\t".repeat(contTab) + token + "</div>";
        }
    }
    
    panelEstructura.innerHTML = html;
}

export function mostrarResultadoPanelParser(resultados) {
    panelParser.innerHTML = resultados.map(res => `<div class="codigo-valido">${res}</div>`).join("");
}

export async function pedirValorPanelParser(nombreVariable) {
    const valorIngresado = await new Promise((resolve) => {
        
        const divInput = document.createElement("div");
        divInput.innerHTML = `
            <div>
                <span class="codigo-entrada">[Entrada requerida] cin >> ${nombreVariable}: </span>
                <input type="number" id="inputCin" class="input-cin" placeholder="Ingresa un número" />
                <button id="btnCin" class="button-cin">Ingresar</button>
            </div>
        `;
        panelParser.appendChild(divInput);
        
        const inputField = document.getElementById("inputCin");
        const btn = document.getElementById("btnCin");
        
        inputField.focus();

        btn.addEventListener("click", () => {
            let valorStr = inputField.value;
            resolve(valorStr);
            
            divInput.innerHTML = `<span class="codigo-entrada">[Entrada usuario] cin >> ${nombreVariable}: ${valorStr}</span>`;
        });
    });

    return valorIngresado;
}

export function mostrarResultadoPanelLTA(lineas, tercetos, assembler) {
    const panelLTA = document.getElementById('panelLTA');
    
    if (!lineas || lineas.length === 0) {
        panelLTA.innerHTML = '<p class="empty-msg">No hay código para analizar...</p>';
        return;
    }

    
    let html = "<div style='display: flex; gap: 10px; align-items: flex-start;'>";

    
    html += "<div style='flex: 1; overflow-x: auto;'>";
    html += "<h3 style='color:#ecc94b; margin-top:0;'>Código Linealizado</h3>";
    html += "<table class='results-table'>";
    html += "<thead><tr><th style='width: 60px; text-align: center; color: #ecc94b;'>Etiqueta</th><th style='color: #a0aec0;'>Instrucción</th></tr></thead>";
    html += "<tbody>";
    lineas.forEach(linea => {
        let etiquetaHtml = linea.etiqueta ? `<span style="color: #ecc94b; font-weight: bold;">${linea.etiqueta}:</span>` : "";
        let instColor = "#a0aec0";
        if (linea.instruccion.includes("goto") || linea.instruccion.startsWith("if")) instColor = "#9f7aea";
        else if (linea.instruccion.includes("cin >>") || linea.instruccion.includes("cout <<")) instColor = "#63b3ed";
        html += `<tr><td style="text-align: center; border-right: 1px solid rgba(255,255,255,0.05);">${etiquetaHtml}</td><td style="padding-left: 15px;"><span style="color: ${instColor}; font-family: monospace; font-size: 1.1em;">${linea.instruccion}</span></td></tr>`;
    });
    html += "</tbody></table></div>";

    
    if (tercetos && tercetos.length > 0) {
        html += "<div style='flex: 1; overflow-x: auto;'>";
        html += "<h3 style='color:#63b3ed; margin-top: 0;'>Tabla de Tercetos</h3>";
        html += "<table class='results-table'>";
        html += "<thead><tr><th style='width: 40px; text-align: center; color: #63b3ed;'>#</th><th style='color: #a0aec0;'>Op</th><th style='color: #a0aec0;'>Arg 1</th><th style='color: #a0aec0;'>Arg 2</th></tr></thead>";
        html += "<tbody>";
        tercetos.forEach(t => {
            html += `<tr><td style="text-align: center; border-right: 1px solid rgba(255,255,255,0.05); color: #63b3ed; font-weight: bold;">(${t.indice})</td><td style="padding-left: 15px; color: #f6e05e; font-family: monospace; font-size: 1.1em; font-weight: bold;">${t.op}</td><td style="padding-left: 15px; color: #cbd5e0; font-family: monospace; font-size: 1.1em;">${t.arg1}</td><td style="padding-left: 15px; color: #cbd5e0; font-family: monospace; font-size: 1.1em;">${t.arg2}</td></tr>`;
        });
        html += "</tbody></table></div>";
    }

    if (assembler) {
        html += "<div style='flex: 1; min-width: 0;'>";
        html += "<h3 style='color:#48bb78; margin-top: 0;'>Assembler (emu 8086)</h3>";
        
        html += "<div style='background: #0b1a30; padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto;'>";
        html += `<pre style='color: #cbd5e0; font-family: monospace; font-size: 1.05em; margin: 0;'>${assembler}</pre>`;
        html += "</div></div>";
    }

    html += "</div>"; 
    panelLTA.innerHTML = html;
}