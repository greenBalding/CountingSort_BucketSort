#include "counting_sort.h"
#include <stdlib.h>
#include <string.h>

int counting_sort(uint32_t *valores, size_t n, uint32_t faixa) {
    if (faixa == 0 || (n > 0 && valores == NULL)) return -1;
    if (n == 0) return 0;
    if (n > SIZE_MAX / sizeof(uint32_t)) return -1;
#if SIZE_MAX <= UINT32_MAX
    if (faixa > SIZE_MAX / sizeof(size_t)) return -1;
#endif
    size_t *contagens = calloc(faixa, sizeof(*contagens));
    uint32_t *saida = malloc(n * sizeof(*saida));
    if (contagens == NULL || saida == NULL) {
        free(contagens); free(saida); return -2;
    }
    /* 1. Conta as ocorrencias de cada chave. */
    for (size_t i = 0; i < n; ++i) {
        if (valores[i] >= faixa) { free(contagens); free(saida); return -1; }
        ++contagens[valores[i]];
    }
    /* 2. As somas acumuladas determinam o final de cada grupo de chaves. */
    for (size_t chave = 1; chave < faixa; ++chave) {
        contagens[chave] += contagens[chave - 1];
    }
    /* 3. Percorrer de tras para frente preserva a ordem dos iguais. */
    for (size_t i = n; i > 0; --i) {
        uint32_t chave = valores[i - 1];
        saida[--contagens[chave]] = chave;
    }
    memcpy(valores, saida, n * sizeof(*valores));
    free(contagens); free(saida);
    return 0;
}
