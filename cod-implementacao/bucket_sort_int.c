#include "bucket_sort_int.h"
#include <stdlib.h>
#include <string.h>

static size_t indice_balde(uint32_t valor, uint32_t faixa, size_t k) {
    return (size_t)(((uint64_t)valor * (uint64_t)k) / faixa);
}

int bucket_sort_int(uint32_t *valores, size_t n, uint32_t faixa, size_t k) {
    if (faixa == 0 || k == 0 || (n > 0 && valores == NULL)) return -1;
    if (n == 0) return 0;
    if (n > SIZE_MAX / sizeof(uint32_t) || k >= SIZE_MAX / sizeof(size_t)) return -1;
    if (faixa > 1 && (uint64_t)k > UINT64_MAX / (faixa - 1)) return -1;
    size_t *posicoes = calloc(k, sizeof(*posicoes));
    size_t *inicio = malloc((k + 1) * sizeof(*inicio));
    uint32_t *auxiliar = malloc(n * sizeof(*auxiliar));
    if (posicoes == NULL || inicio == NULL || auxiliar == NULL) {
        free(posicoes); free(inicio); free(auxiliar); return -2;
    }
    /* Distribui estavelmente em segmentos contiguos. */
    for (size_t i = 0; i < n; ++i) {
        if (valores[i] >= faixa) { free(posicoes); free(inicio); free(auxiliar); return -1; }
        ++posicoes[indice_balde(valores[i], faixa, k)];
    }
    inicio[0] = 0;
    for (size_t b = 0; b < k; ++b) {
        inicio[b + 1] = inicio[b] + posicoes[b];
        posicoes[b] = inicio[b];
    }
    for (size_t i = 0; i < n; ++i) {
        size_t b = indice_balde(valores[i], faixa, k);
        auxiliar[posicoes[b]++] = valores[i];
    }
    /* Insertion Sort interno. Repeticoes tambem podem gerar Theta(n^2):
       m valores 1 seguidos de m valores 0 exigem m*m deslocamentos. */
    for (size_t b = 0; b < k; ++b) {
        for (size_t i = inicio[b] + 1; i < inicio[b + 1]; ++i) {
            uint32_t chave = auxiliar[i];
            size_t j = i;
            while (j > inicio[b] && auxiliar[j - 1] > chave) {
                auxiliar[j] = auxiliar[j - 1];
                --j;
            }
            auxiliar[j] = chave;
        }
    }
    memcpy(valores, auxiliar, n * sizeof(*valores));
    free(posicoes); free(inicio); free(auxiliar);
    return 0;
}
