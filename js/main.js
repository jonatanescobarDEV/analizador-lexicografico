import * as index from './index.js';

const botonEjecutar = document.getElementById('ejecutar');
const botonLimpiar = document.getElementById('limpiar');
botonEjecutar.addEventListener('click', ejecutarAnalisis);
botonLimpiar.addEventListener('click', limpiarTodo);

export const panelLexer = document.getElementById('lexer-resultados');
export const panelEstructura = document.getElementById('panelResultados');
export const panelParser = document.getElementById('panelLL1');
panelEstructura.innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar... \n(si-sino-finsi-mientras-finmientras)\n\nEjemplo (A resolver):\nsi\nmientras\nsi\nfinsi\nmientras\nsi\nfinsi\nfinmientras\nfinsi</p>';
panelParser.innerHTML = '<p class="empty-msg">La ejecucion aritmetica aparecerá aquí...\n\nEjemplo (A resolver):\na = 9;\nb = 2;\na = a + (b * 2);\ncout<< a;\ncout<< a + 45</p>';

export const selectorArchivoCodFuente = document.getElementById('archivo');
export const objetoNombreArchivo = document.getElementById('file-name');

export const areaTexto = document.getElementById('editor');

selectorArchivoCodFuente.onchange = function () {
    if (this.files[0]) {
        objetoNombreArchivo.textContent = "Seleccionado: " + this.files[0].name;
    }
}

async function ejecutarAnalisis() {
    if(areaTexto.value === "" && !selectorArchivoCodFuente.files[0])
        return alert("Por favor, ingresa código o sube un archivo o texto.");

    await index.ejecutarAnalisis();
}

function limpiarTodo() {
    selectorArchivoCodFuente.value = "";
    objetoNombreArchivo.textContent = "Sin archivo seleccionado";
    areaTexto.value = "";

    panelLexer.innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar...</p>';
    panelEstructura.innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar... \n(si-sino-finsi-mientras-finmientras)\n\nEjemplo (A resolver):\nsi\nmientras\nsi\nfinsi\nmientras\nsi\nfinsi\nfinmientras\nfinsi</p>';
    panelParser.innerHTML = '<p class="empty-msg">La ejecucion aritmetica aparecerá aquí...\n\nEjemplo (A resolver):\na = 9;\nb = 2;\na = a + (b * 2);\ncout<< a;\ncout<< a + 45</p>';
}

function openTab(evento, nombrePestaña) {
    var contenidos = document.getElementsByClassName("tab-pane");
    for (var i = 0; i < contenidos.length; i++) {
        contenidos[i].style.display = "none";
    }

    var botones = document.getElementsByClassName("tab-btn");
    for (var i = 0; i < botones.length; i++) {
        botones[i].classList.remove("active");
    }

    const elementoDestino = document.getElementById(nombrePestaña);

    elementoDestino.style.display = "block";

    evento.currentTarget.classList.add("active");
}

const botonesTabs = document.querySelectorAll('.tab-btn');

botonesTabs.forEach(boton => {
    boton.addEventListener('click', (evento) => {
        const targetId = boton.dataset.target; 
        
        openTab(evento, targetId);
    });
});

areaTexto.addEventListener( 'keydown', function (e) {
    if (e.key === 'Tab') {
        e.preventDefault();

        const insertado = document.execCommand('insertText', false, '\t');

        if (!insertado) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "\t" + this.value.substring(start);
            setTimeout(() => {
                this.selectionStart = start + 1;
                this.selectionEnd = start + 1;
            }, 0);
        }
    }
});
