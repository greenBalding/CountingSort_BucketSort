#include "counting_sort.h"
#include "bucket_sort_int.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int comparar(const void *a, const void *b) {
    uint32_t x = *(const uint32_t *)a, y = *(const uint32_t *)b;
    return (x > y) - (x < y);
}
static void conferir(const uint32_t *entrada, size_t n, uint32_t faixa, size_t k) {
    uint32_t *contagem = malloc(n * sizeof(*contagem));
    uint32_t *baldes = malloc(n * sizeof(*baldes));
    uint32_t *esperado = malloc(n * sizeof(*esperado));
    assert(contagem && baldes && esperado);
    memcpy(contagem, entrada, n * sizeof(*entrada));
    memcpy(baldes, entrada, n * sizeof(*entrada));
    memcpy(esperado, entrada, n * sizeof(*entrada));
    qsort(esperado, n, sizeof(*esperado), comparar);
    assert(counting_sort(contagem, n, faixa) == 0);
    assert(bucket_sort_int(baldes, n, faixa, k) == 0);
    assert(memcmp(contagem, esperado, n * sizeof(*entrada)) == 0);
    assert(memcmp(baldes, esperado, n * sizeof(*entrada)) == 0);
    free(contagem); free(baldes); free(esperado);
}
int main(void) {
    assert(counting_sort(NULL, 0, 1) == 0);
    assert(bucket_sort_int(NULL, 0, 1, 1) == 0);
    assert(counting_sort(NULL, 1, 1) == -1);
    assert(bucket_sort_int(NULL, 1, 1, 1) == -1);
    assert(counting_sort(NULL, 0, 0) == -1);
    assert(bucket_sort_int(NULL, 0, 1, 0) == -1);
    uint32_t invalid = 10;
    assert(counting_sort(&invalid, 1, 10) == -1);
    assert(bucket_sort_int(&invalid, 1, 10, 5) == -1);
    const uint32_t repetidos[] = {1,1,1,1,0,0,0,0};
    const uint32_t bordas[] = {0,99,20,40,60,80,0,99};
    conferir(repetidos, 8, 80, 8); conferir(bordas, 8, 100, 5);
    uint32_t estado = 12345, v[257];
    for (size_t n = 1; n <= 257; ++n) {
        for (size_t i = 0; i < n; ++i) {
            estado = estado * UINT32_C(1664525) + UINT32_C(1013904223);
            v[i] = estado % 128;
        }
        conferir(v,n,128,1); conferir(v,n,128,n); conferir(v,n,128,17);
    }
    puts("OK: limites, entradas invalidas, repetidos e 771 grupos comparados com qsort nos dois algoritmos.");
    return 0;
}
