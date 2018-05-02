#include <stdlib.h>
#include <math.h>
#include <emscripten/emscripten.h>

// Uniforme em [1,0)
float u(){
	return ((float)(rand() >> 1)/((RAND_MAX >> 1) + 1));
}

// Projetar vetor v na superfície da esfera de raio 1
// e guarfar o resultado no vetor w. Dimensão n.
void projetar(float *v, float *w, int n){
	float s = 0;
	for (int i = 0; i < n; i++) s += pow(v[i],2);
	s = sqrt(s);
	for (int i = 0; i < n; i++) w[i] = ( s != 0 ) ? v[i] / s : 0;
}

// Um par de variáveis aleatórias com distribuição normal,
// esperança zero e variância unitária (método Box-Muller)
void parNormal(float *par){
	// Gerar um ponto uniforme dentro do disco 
	// de raio unitário centrado na origem
	float r;
	par[0] = -1.0 + 2.0*u();
	par[1] = -1.0 + 2.0*u();
	r = pow(par[0],2) + pow(par[1],2);
	// Gerar novamente caso ponto fora 
	// do disco ou exatamente na origem
	while ( r > 1 || r == 0 ){
		par[0] = -1.0 + 2.0*u();
		par[1] = -1.0 + 2.0*u();
		r = pow(par[0],2) + pow(par[1],2);
	}
	// Fator comum
	float f = sqrt(-2*log(r)/r);
	// Par normal
	par[0] *= f;
	par[1] *= f;
}

// n variáveis aleatórias com distribuição 
// normal, esperança zero e variância unitária
void normal(float *p, int n){
	float par[2];
	if ( n == 1 ){
		parNormal(par);
		// Um valor do par é descartado
		p[0] = par[0];
		return;
	}
	for (int i = 0; i < n - 1; i += 2){
		parNormal(par);
		p[i] = par[0];
		p[i+1] = par[1];
	}
	// Se n ímpar, falta gerar o último
	if ( n % 2 == 1 ){
		parNormal(par);
		// Um valor do par é descartado
		p[n-1] = par[0];
	}
}

// Gerar pontos uniformemente distribuídos na superfície 
// da esfera do R^n utilizando o método Box-Muller
void EMSCRIPTEN_KEEPALIVE bm(char *buffer, int size){
	int *m = (int*)buffer;
	int *n = (int*)(buffer+4);
	float *data = (float*)(buffer+8);

	// Ponto não-projetado
	float *p = malloc(*n*4);
	for (int i = 0; i < *m; i++){
		// Gerar um ponto na quantidade de dimensões solicitada
		normal(p, *n);
		// Projetar o ponto na superfície da esfera 
		// de raio 1 e armazenar a resposta no buffer
		projetar(p, data+(*n)*i, *n);
	}
	free(p);

	// Enviar resultado
	emscripten_worker_respond(buffer, size);
}
