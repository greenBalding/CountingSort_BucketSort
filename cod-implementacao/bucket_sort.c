#include "bucket_sort.h"
#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

static size_t indice_balde(double valor, size_t k) {
    size_t indice = (size_t)(valor * (double)k);
    /* Protege o limite superior contra arredondamento de ponto flutuante. */
    return indice < k ? indice : k - 1;
}

int bucket_sort(double *valores, size_t n, size_t k) {
    if (k == 0 || (n > 0 && valores == NULL)) return -1;
    if (n == 0) return 0;
    if (n > SIZE_MAX / sizeof(double) || k >= SIZE_MAX / sizeof(size_t)) return -1;

    size_t *posicoes = calloc(k, sizeof(*posicoes));
    size_t *inicio = malloc((k + 1) * sizeof(*inicio));
    double *auxiliar = malloc(n * sizeof(*auxiliar));
    if (posicoes == NULL || inicio == NULL || auxiliar == NULL) {
        free(posicoes); free(inicio); free(auxiliar);
        return -2;
    }

    /* 1. Conta a ocupacao de cada balde. */
    for (size_t i = 0; i < n; ++i) {
        if (!isfinite(valores[i]) || valores[i] < 0.0 || valores[i] >= 1.0) {
            free(posicoes); free(inicio); free(auxiliar);
            return -1;
        }
        ++posicoes[indice_balde(valores[i], k)];
    }

    /* 2. Reserva um trecho contiguo do vetor auxiliar para cada balde.
       As contagens apenas organizam os trechos; a ordenacao dentro de
       cada intervalo de valores e realizada pelo Insertion Sort abaixo. */
    inicio[0] = 0;
    for (size_t b = 0; b < k; ++b) {
        inicio[b + 1] = inicio[b] + posicoes[b];
        posicoes[b] = inicio[b];
    }
    for (size_t i = 0; i < n; ++i) {
        size_t b = indice_balde(valores[i], k);
        auxiliar[posicoes[b]++] = valores[i];
    }

    /* 3. Insertion Sort em cada balde, preservando a ordem dos iguais. */
    for (size_t b = 0; b < k; ++b) {
        for (size_t i = inicio[b] + 1; i < inicio[b + 1]; ++i) {
            double chave = auxiliar[i];
            size_t j = i;
            while (j > inicio[b] && auxiliar[j - 1] > chave) {
                auxiliar[j] = auxiliar[j - 1];
                --j;
            }
            auxiliar[j] = chave;
        }
    }

    /* 4. Os trechos ja estao na ordem dos intervalos. */
    memcpy(valores, auxiliar, n * sizeof(*valores));
    free(posicoes); free(inicio); free(auxiliar);
    return 0;
}
