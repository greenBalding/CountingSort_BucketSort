#ifndef COUNTING_SORT_H
#define COUNTING_SORT_H
#include <stddef.h>
#include <stdint.h>
/* Chaves inteiras sem sinal no intervalo [0, faixa).
   Versao estavel, tempo Theta(n + faixa), memoria Theta(n + faixa).
   Retorna 0 no sucesso, -1 para argumentos invalidos, -2 sem memoria. */
int counting_sort(uint32_t *valores, size_t n, uint32_t faixa);
#endif
