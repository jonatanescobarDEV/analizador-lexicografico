import { panelLexer, panelEstructura, panelParser} from "./main.js";

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
        const panel = document.getElementById("panelLL1");
        
        const divInput = document.createElement("div");
        divInput.innerHTML = `
            <div>
                <span class="codigo-entrada">[Entrada requerida] cin >> ${nombreVariable}: </span>
                <input type="number" id="inputCin" class="input-cin" placeholder="Ingresa un número" />
                <button id="btnCin" class="button-cin">Ingresar</button>
            </div>
        `;
        panel.appendChild(divInput);
        
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