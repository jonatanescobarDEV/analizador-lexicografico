import * as lexer from './lexer.js';
import * as parser from './parser.js';
import * as evaluador from './evaluador.js';

document.getElementById('limpiar').addEventListener('click', limpiarTodo);
document.getElementById('ejecutar').addEventListener('click', ejecutarAnalisis);

document.getElementById('panelResultados').innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar... \n(si-sino-finsi-mientras-finmientras)</p>';

document.getElementById('archivo').onchange = function () {
	if (this.files[0]) {
		document.getElementById('file-name').textContent = "Seleccionado: " + this.files[0].name;
	}
}

async function ejecutarAnalisis() {
	let areaTexto = document.getElementById('editor');
	let selectorArchivos = document.getElementById('archivo');
	let contenidoEditor = areaTexto.value;
	let archivoSeleccionado = selectorArchivos.files[0];

	if (contenidoEditor === "" && !archivoSeleccionado) {
		alert("Por favor, ingresa código o sube un archivo o texto.");
		return;
	}

	let listaDeTokens = await lexer.ejecutarAnalisis();
	
	await parser.ejecutarAnalisis();
	
	await evaluador.iniciarInterpretacion(listaDeTokens);
}

function limpiarTodo() {
	let campoArchivo = document.getElementById('archivo');
	let etiquetaArchivo = document.getElementById('file-name');
	let areaTexto = document.getElementById('editor');
	let resultadosLexer = document.getElementById('lexer-resultados');
	let resultadosPanel = document.getElementById('panelResultados');
	let resultadosLL1 = document.getElementById('panelLL1');

	campoArchivo.value = "";
	etiquetaArchivo.textContent = "Sin archivo seleccionado";
	areaTexto.value = "";
	
	resultadosLexer.innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar...</p>';
	
	resultadosPanel.innerHTML = '<p class="empty-msg">Los resultados apareceran aqui despues de Ejecutar... \n(si-sino-finsi-mientras-finmientras)</p>';
	
	resultadosLL1.innerHTML = '<p class="empty-msg">La ejecucion aritmetica aparecerá aquí...</p>';
}

function openTab(evento, nombrePestana) {
	let contenidos = document.getElementsByClassName("tab-pane");
	let i = 0;
	
	while (i < contenidos.length) {
		contenidos[i].style.display = "none";
		i = i + 1;
	}

	let botones = document.getElementsByClassName("tab-btn");
	let j = 0;
	
	while (j < botones.length) {
		botones[j].classList.remove("active");
		j = j + 1;
	}

	let elementoDestino = document.getElementById(nombrePestana);
	
	elementoDestino.style.display = "block";
	
	evento.currentTarget.classList.add("active");
}

let todosLosBotones = document.querySelectorAll('.tab-btn');

todosLosBotones.forEach(boton => {
	boton.addEventListener('click', function(evento) {
		let identificador = boton.dataset.target; 
		
		openTab(evento, identificador);
	});
});