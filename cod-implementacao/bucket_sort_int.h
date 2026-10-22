#ifndef BUCKET_SORT_INT_H
#define BUCKET_SORT_INT_H
#include <stddef.h>
#include <stdint.h>
/* Bucket Sort com Insertion Sort para as mesmas chaves do Counting Sort.
   Faixa global conhecida [0, faixa); k baldes. Retornos: 0, -1 ou -2. */
int bucket_sort_int(uint32_t *valores, size_t n, uint32_t faixa, size_t k);
#endif
