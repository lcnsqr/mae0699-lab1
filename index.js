/*
 * Variáveis globais são os parâmetros do simulador
 */
// Threads concorrentes
var threads = [];
// Intervalo de tempo (em milissegundos) 
// para calcular a taxa
var msec = 1000;
// Pontos gerados a cada requisição ao thread
var lote = 100000;
// Número de dimensões do ponto
var dim = 1;

// Iniciar vetor do gráfico da razão BoxMuller/AceitaçãoRejeição
var grafRazao = [];
// Gráfico exibe as últimas 77 amostras
for (var l=0; l<=77; l++){
	grafRazao.push(0);
}

// Gerador dos pontos (WebWorkers + WebAssembly)
var Operario = function(m, n, funcao, nome){
	// Contexto do sub-processo
	this.ctx = _malloc(22);
	// Alocar cabeçalho+data e armazenar ponteiro
	setValue(this.ctx, _malloc(8+m*n*4), 'i32');
	// Nome da função como string c
	this.f = _malloc(funcao.length+1);
	for (var c = 0; c < funcao.length; c++){
		setValue(this.f+c, funcao.charCodeAt(c), 'i8');
	}
	setValue(this.f+funcao.length, 0, 'i8');
	// Sigla da função em string do javascript
	this.sigla = funcao;
	// Nome do método utilizado
	this.nome = nome;
	// Carregar Worker
	_carregue(this.ctx, m, n, this.f);
};
Operario.prototype = {
	data: function(){
		return getValue(this.ctx, 'i32');
	},
	m: function(){
		return getValue(this.data(), 'i32');
	},
	n: function(){
		return getValue(this.data()+4, 'i32');
	},
	pontos: function(){
		return this.data()+8;
	},
	get: function(i, j){
		// Ponteiros somados como char*
		return getValue(this.pontos() + i * this.n() * 4 + j * 4, 'float');
	},
	trabalhar: function(){
		_trabalhe(this.ctx);
	},
	liberar: function(){
		// Finalizar worker
		_libere(this.ctx);
		// Liberar memória
		_free(this.pontos());
		_free(this.ctx);
		// Nome da função
		_free(this.f);
	},
	contar: function(){
		return getValue(this.ctx+12, 'i32');
	},
	recontar: function(){
		setValue(this.ctx+12, 0, 'i32');
	},
	pausado: function(){
		return getValue(this.ctx+16, 'i8');
	},
	pausar: function(){
		setValue(this.ctx+16, 1, 'i8');
	},
	continuar: function(){
		setValue(this.ctx+16, 0, 'i8');
		_trabalhe(this.ctx);
	}
}

// WebAssembly
var Module = {
	onRuntimeInitialized: function() {
		// WebAssembly carregado
		iniciar();

		// Atualização da taxa
		window.setInterval(function(){
			// Checar se houve mudança no número de dimensões desejado
			if ( dim != threads[0].n() || dim != threads[1].n() ){
				encerrar();
				iniciar();
			}
			var gerados = [];
			threads.forEach(function(thread){
				if ( thread.pausado() != 0 ) return;
				// Pausar thread
				thread.pausar();
				gerados.push(thread.contar());
				// Atualizar exibição da contagem
				document.querySelector("#"+thread.sigla+"-pps").textContent = thread.contar();
				// Zerar contador
				thread.recontar();
				// Continuar thread
				thread.continuar();
			});

			// Gráfico da razão entre os métodos
			if ( gerados.length != 2 ) return;
			// Box-muller sobre aceitação/rejeição
			// Acima de 1, vantagem box-muller
			var razao = gerados[1] / gerados[0];
			// Identificar divisão por zero
			if ( isNaN(razao) ) return;
			// Checar infinito
			if (razao == Number.POSITIVE_INFINITY || razao == Number.NEGATIVE_INFINITY) return;
			// Atualizar exibição
			document.querySelector("#graf-dim").textContent = ( dim > 1 ) ? dim + " dimensões" : dim + " dimensão";
			if (gerados[0] > gerados[1]){
				document.querySelector("#graf-melhor").textContent = threads[0].nome;
			}
			else {
				document.querySelector("#graf-melhor").textContent = threads[1].nome;
			}
			grafRazao.shift();
			grafRazao.push(razao);
			var linhaGraf = "M ";
			for (l=0; l<grafRazao.length; l++){
				x = l * 10;
				y = 300 - ((300*grafRazao[l])/2);
				linhaGraf = linhaGraf + x + "," + y + " ";
			}
			document.querySelector("#linha-razao").setAttribute("d", linhaGraf);

		}, msec);
	}
};
Module.TOTAL_MEMORY = 64000000;

// Controles gerais
var iniciar = function(){
	// Sub-processo do método Aceitação/Rejeição
	threads.push(new Operario(lote, dim, "ar", "Aceitação/Rejeição"));
	threads[0].trabalhar();
	// Sub-processo do método Box-Muller
	threads.push(new Operario(lote, dim, "bm", "Box-Muller"));
	threads[1].trabalhar();
}
var pausar = function(){
	threads.forEach(function(thread){
		thread.pausar();
	});
}
var continuar = function(){
	threads.forEach(function(thread){
		thread.continuar();
	});
}
var encerrar = function(){
	threads.forEach(function(thread){
		// Liberar memória
		thread.liberar();
	});
	threads = [];
}

// Botões
document.querySelector("button[name='dim-menos']").addEventListener("click", function(event){
	// Mínimo de 1 dimensão
	if ( dim == 1 ) return;
	dim--;
	// Atualizar exibição da contagem das dimensões
	document.querySelector("#graf-dim").textContent = ( dim > 1 ) ? dim + " dimensões" : dim + " dimensão";
	// Recomeçar com o novo parâmetro
	encerrar();
	iniciar();
});
document.querySelector("button[name='dim-mais']").addEventListener("click", function(event){
	// Máximo de 6 dimensões
	if ( dim == 6 ) return;
	dim++;
	// Atualizar exibição da contagem das dimensões
	document.querySelector("#graf-dim").textContent = ( dim > 1 ) ? dim + " dimensões" : dim + " dimensão";
	// Recomeçar com o novo parâmetro
	encerrar();
	iniciar();
});
