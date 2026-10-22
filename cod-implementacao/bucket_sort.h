#ifndef BUCKET_SORT_H
#define BUCKET_SORT_H

#include <stddef.h>

/* Ordena valores finitos em [0, 1). Retorna 0 no sucesso, -1 para
   argumentos invalidos e -2 quando nao consegue alocar memoria.
   Os elementos sao distribuidos estavelmente em k intervalos uniformes;
   cada intervalo e ordenado por Insertion Sort. Memoria: Theta(n + k). */
int bucket_sort(double *valores, size_t n, size_t k);

#endif
