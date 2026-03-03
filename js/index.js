import { selectorArchivoCodFuente, areaTexto } from './main.js';
import * as lexer from './lexer.js';
import * as estructura from './estructura.js';
import * as parser from './parser.js';

export const modulos = [lexer, estructura, parser];

export let contenidoFuente = "";

export async function ejecutarAnalisis() {
    await chequearArchivoOTexto();
    
    for (const modulo of modulos) {
        await modulo.ejecutarAnalisis();
    }
}

async function chequearArchivoOTexto() {
    if (selectorArchivoCodFuente.files[0]) {
        contenidoFuente = await selectorArchivoCodFuente.files[0].text();
        areaTexto.value = contenidoFuente;
    } else {
        contenidoFuente = areaTexto.value;
    }
}
