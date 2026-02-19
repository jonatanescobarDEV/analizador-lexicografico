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