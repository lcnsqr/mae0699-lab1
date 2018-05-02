#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <emscripten/emscripten.h>

struct Ctx {
	// Ponteiro para cabeçalho+dados
	char *data;
	// Quantidade de pontos
	int m;
	// Dimensões em cada ponto
	int n;
	// Variáveis de controle
	int count;
	char pausa;
	char *funcao;
	// Identificador do worker
	worker_handle worker;
};

// Worker callback
void callback(char *buffer, int size, void *ctxWorker){
	// Quantidade
	int *m = (int*)buffer;
	// Dimensão
	int *n = (int*)(buffer+4);
	struct Ctx *ctx = (struct Ctx *)ctxWorker;
	// Copiar da memória do Worker para a memória original
	memcpy(ctx->data, buffer, size);
	ctx->count += *m;

	if ( ctx->pausa == 1 ) return;
	// Invocar recursivamente
	emscripten_call_worker(ctx->worker, ctx->funcao, buffer, size, callback, (void*)ctx);
}

void EMSCRIPTEN_KEEPALIVE carregue(char *ctxWorker, int m, int n, char *funcao){
	struct Ctx *ctx = (struct Ctx *)ctxWorker;
	// Copiar dimensões no cabeçalho dos dados
	memcpy(ctx->data, &m, 4);
	memcpy(ctx->data+4, &n, 4);
	ctx->m = m;
	ctx->n = n;
	// Nome de funcao fixo em char[2] (+ \0)
	ctx->funcao = funcao;
	// Carregar worker
	char filename[] = "worker___.js";
	// Adaptar o nome do arquivo para o nome da função
	filename[7] = ctx->funcao[0];
	filename[8] = ctx->funcao[1];
	ctx->worker = emscripten_create_worker((const char*)&filename);
	ctx->count = 0;
	ctx->pausa = 0;
	// Semente aleatória
	srand((unsigned int)time(NULL));
}

void EMSCRIPTEN_KEEPALIVE trabalhe(char *ctxWorker){
	struct Ctx *ctx = (struct Ctx *)ctxWorker;
	if ( ctx->pausa == 1 ) return;
	// Copiar cabeçalho dos dados para memória do Worker
	emscripten_call_worker(ctx->worker, ctx->funcao, ctx->data, 8+ctx->m*ctx->n*4, callback, (void*)ctx);
}

void EMSCRIPTEN_KEEPALIVE libere(char *ctxWorker){
	struct Ctx *ctx = (struct Ctx *)ctxWorker;
	// Finalizar Worker
	emscripten_destroy_worker(ctx->worker);
}
