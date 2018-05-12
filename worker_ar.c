#include <stdlib.h>
#include <math.h>
#include <emscripten/emscripten.h>

// Uniforme em [1,0)
float u(){
	return ((float)(rand() >> 1)/((RAND_MAX >> 1) + 1));
}

// Projetar vetor v na superfície da esfera de raio 1
// e guardar o resultado no vetor w. Dimensão n.
void projetar(float *v, float *w, int n){
	float s = 0;
	for (int i = 0; i < n; i++) s += pow(v[i],2);
	s = sqrt(s);
	for (int i = 0; i < n; i++) w[i] = ( s != 0 ) ? v[i] / s : 0;
}

// Gerar ponto uniformemente distribuído dentro 
// da esfera de raio unitário centrada na origem
void ponto(float *p, int n){
	float s, r = 0;
	while ( r > 1 || r == 0 ){
		s = 0;
		for (int i = 0; i < n; i++){
			p[i] = u();
			s += pow(p[i], 2);
		}
		r = sqrt(s);
	}
}

// Gerar pontos uniformemente distribuídos na superfície 
// da esfera do R^n utilizando o método Aceitação-Rejeição
void EMSCRIPTEN_KEEPALIVE ar(char *buffer, int size){
	// Quantidade de pontos
	int *m = (int*)buffer;
	// Dimensão
	int *n = (int*)(buffer+4);
	float *data = (float*)(buffer+8);

	// Ponto não-projetado
	float *p = malloc(*n*4);
	for (int i = 0; i < *m; i++){
		// Gerar um ponto na quantidade de dimensões solicitada
		ponto(p, *n);
		// Projetar o ponto na superfície da esfera 
		// de raio 1 e armazenar a resposta no buffer
		projetar(p, data+(*n)*i, *n);
	}
	free(p);

	// Enviar resultado
	emscripten_worker_respond(buffer, size);
}
