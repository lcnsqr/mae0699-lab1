CC=emcc
OPTIONS=-O3

all: bin.js worker_bm.js worker_ar.js

bin.js: bin.c
	$(CC) bin.c -s EXPORTED_RUNTIME_METHODS='["getValue","setValue"]' $(OPTIONS) -o $@

worker_bm.js: worker_bm.c
	$(CC) worker_bm.c -s BUILD_AS_WORKER=1 -o worker_bm.js $(OPTIONS) -o $@

worker_ar.js: worker_ar.c
	$(CC) worker_ar.c -s BUILD_AS_WORKER=1 -o worker_ar.js $(OPTIONS) -o $@

clean:
	rm bin.js worker_bm.js worker_ar.js 
