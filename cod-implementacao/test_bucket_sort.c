#include "bucket_sort.h"
#include <assert.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int comparar(const void *a, const void *b) {
    double x = *(const double *)a, y = *(const double *)b;
    return (x > y) - (x < y);
}

static void conferir(const double *entrada, size_t n, size_t k) {
    double *real = malloc(n * sizeof(*real));
    double *esperado = malloc(n * sizeof(*esperado));
    assert(real && esperado);
    memcpy(real, entrada, n * sizeof(*real));
    memcpy(esperado, entrada, n * sizeof(*esperado));
    qsort(esperado, n, sizeof(*esperado), comparar);
    assert(bucket_sort(real, n, k) == 0);
    assert(memcmp(real, esperado, n * sizeof(*real)) == 0);
    free(real); free(esperado);
}

int main(void) {
    assert(bucket_sort(NULL, 0, 1) == 0);
    assert(bucket_sort(NULL, 1, 1) == -1);
    assert(bucket_sort(NULL, 0, 0) == -1);
    double amostra[] = {0.42, 0.15, 0.87, 0.33, 0.08, 0.71};
    double limites[] = {0.0, nextafter(1.0, 0.0), 0.2, 0.4, 0.6, 0.8, 0.0, 0.2};
    double iguais[] = {0.5, 0.5, 0.5, 0.5};
    double reverso[] = {0.09, 0.08, 0.07, 0.06, 0.05, 0.04};
    conferir(amostra, 6, 5); conferir(amostra, 6, 1); conferir(amostra, 1, 1);
    conferir(limites, 8, 5); conferir(iguais, 4, 20); conferir(reverso, 6, 6);
    double invalidos[] = {-0.1, 1.0, NAN, INFINITY};
    for (size_t i = 0; i < 4; ++i) assert(bucket_sort(&invalidos[i], 1, 1) == -1);

    /* Compara muitos tamanhos/ocupacoes com o qsort, um oraculo independente. */
    uint32_t estado = 12345;
    double v[257];
    for (size_t n = 1; n <= 257; ++n) {
        for (size_t i = 0; i < n; ++i) {
            estado = estado * UINT32_C(1664525) + UINT32_C(1013904223);
            v[i] = (double)(estado % 101) / 101.0;
        }
        conferir(v, n, 1); conferir(v, n, n); conferir(v, n, 17);
    }
    puts("OK: limites, repetidos, invalidos e 771 comparacoes com qsort.");
    return 0;
}
