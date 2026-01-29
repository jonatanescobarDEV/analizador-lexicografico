import * as lexer from './lexer.js';
import * as parser from './parser.js';

document.getElementById('limpiar').addEventListener('click', limpiarTodo);
document.getElementById('ejecutar').addEventListener('click', ejecutarAnalisis);

// Muestra el nombre del archivo al seleccionarlo
document.getElementById('archivo').onchange = function () {
    if (this.files[0]) {
        document.getElementById('file-name').textContent = "Seleccionado: " + this.files[0].name;
    }
}

//Ejecutar y limpiar
async function ejecutarAnalisis() {
    if(document.getElementById('editor').value === "" && !document.getElementById('archivo').files[0])
        return alert("Por favor, ingresa código o sube un archivo o texto.");

    await lexer.ejecutarAnalisis();
    await parser.ejecutarAnalisis();
}

function limpiarTodo() {
    document.getElementById('archivo').value = "";
    document.getElementById('file-name').textContent = "Sin archivo seleccionado";
    document.getElementById('editor').value = "";
    document.getElementById('panelResultados').innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar...</p>';
    document.getElementById('lexer-resultados').innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar...</p>';
}

// Lógica de las pestañas
function openTab(evt, tabName) {
    var panes = document.getElementsByClassName("tab-pane");
    for (var i = 0; i < panes.length; i++) {
        panes[i].style.display = "none";
    }

    var buttons = document.getElementsByClassName("tab-btn");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }

    document.getElementById(tabName).style.display = "block";

    evt.currentTarget.classList.add("active");
}

const botonesTabs = document.querySelectorAll('.tab-btn');

botonesTabs.forEach(boton => {
    boton.addEventListener('click', (evento) => {
        const targetId = boton.dataset.target; 
        
        openTab(evento, targetId);
    });
});