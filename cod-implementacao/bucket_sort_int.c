/*
 * BUCKET SORT (ordenacao por baldes) para numeros inteiros
 * =========================================================
 *
 * Ideia geral, em 3 etapas:
 *   1. DISTRIBUIR: cada numero vai para o balde do seu intervalo.
 *   2. ORDENAR:    cada balde e ordenado com Insertion Sort.
 *   3. JUNTAR:     os baldes sao emendados em ordem (balde 0, 1, 2, ...).
 *
 * Como cada balde cobre um intervalo maior que o anterior, depois de
 * ordenar cada balde o vetor inteiro ja fica em ordem.
 *
 * Parametros usados no experimento (ver benchmark_comparacao.c):
 *   n     = quantidade de numeros no vetor
 *   faixa = 10n  -> os numeros vao de 0 ate 10n - 1
 *   k     = n    -> um balde para cada numero
 *   Assim, cada balde cobre 10 valores: balde 0 = 0..9, balde 1 = 10..19, ...
 *
 * Detalhe de implementacao: os baldes NAO sao listas separadas. Eles sao
 * trechos (segmentos) de um unico vetor auxiliar. Por isso, antes de
 * distribuir, o codigo conta quantos numeros vao para cada balde, para
 * saber onde cada trecho comeca.
 *
 * Custo:
 *   melhor caso (um numero por balde)               -> Theta(n)
 *   pior caso   (todos no mesmo balde, fora de ordem) -> Theta(n^2)
 *   memoria extra: Theta(n + k), que com k = n e Theta(n)
 */

#include "bucket_sort_int.h"
#include <stdlib.h>   /* calloc, malloc, free */
#include <string.h>   /* memcpy */

/*
 * Calcula em qual balde um numero deve ficar.
 *
 *   balde = valor * k / faixa   (divisao inteira, descarta a parte decimal)
 *
 * Com k = n e faixa = 10n, isso e o mesmo que valor / 10.
 * Exemplos: 4 -> balde 0, 22 -> balde 2, 99 -> balde 9.
 *
 * A conversao para uint64_t evita estouro: valor * k pode passar do
 * limite de 32 bits quando n e grande (ex.: 9.999.999 * 1.000.000).
 */
static size_t indice_balde(uint32_t valor, uint32_t faixa, size_t k) {
    return (size_t)(((uint64_t)valor * (uint64_t)k) / faixa);
}

/*
 * Ordena o vetor 'valores' (com n numeros) em ordem crescente.
 *
 *   valores: vetor a ser ordenado (o resultado fica nele mesmo)
 *   n:       quantidade de numeros
 *   faixa:   todos os numeros devem estar em [0, faixa)
 *   k:       quantidade de baldes
 *
 * Retorna:
 *    0 -> ordenou com sucesso
 *   -1 -> parametros invalidos (ex.: numero fora da faixa)
 *   -2 -> faltou memoria
 */
int bucket_sort_int(uint32_t *valores, size_t n, uint32_t faixa, size_t k) {
    /* ---------------------------------------------------------------
     * VALIDACOES: garante que os parametros fazem sentido antes de
     * comecar. Nada disso e parte do algoritmo em si; so evita erros.
     * --------------------------------------------------------------- */
    if (faixa == 0 || k == 0 || (n > 0 && valores == NULL)) return -1;
    if (n == 0) return 0;   /* vetor vazio ja esta ordenado */
    /* Evita estouro nos calculos de tamanho de memoria e no indice_balde. */
    if (n > SIZE_MAX / sizeof(uint32_t) || k >= SIZE_MAX / sizeof(size_t)) return -1;
    if (faixa > 1 && (uint64_t)k > UINT64_MAX / (faixa - 1)) return -1;

    /* ---------------------------------------------------------------
     * PREPARACAO: cria as estruturas auxiliares.
     *
     *   posicoes[b]: primeiro conta quantos numeros vao para o balde b;
     *                depois vira a proxima posicao livre dentro do balde b.
     *   inicio[b]:   posicao onde o balde b comeca no vetor auxiliar.
     *                inicio[k] marca o fim do ultimo balde.
     *   auxiliar:    vetor de n posicoes onde ficam todos os baldes,
     *                um trecho depois do outro.
     *
     * calloc ja cria 'posicoes' zerado (todos os baldes comecam vazios).
     * --------------------------------------------------------------- */
    size_t *posicoes = calloc(k, sizeof(*posicoes));
    size_t *inicio = malloc((k + 1) * sizeof(*inicio));
    uint32_t *auxiliar = malloc(n * sizeof(*auxiliar));
    if (posicoes == NULL || inicio == NULL || auxiliar == NULL) {
        free(posicoes); free(inicio); free(auxiliar); return -2;
    }

    /* ---------------------------------------------------------------
     * ETAPA 1: DISTRIBUIR (feita em 3 passos)
     * --------------------------------------------------------------- */

    /* Passo 1a - CONTAR: percorre o vetor e conta quantos numeros
       vao para cada balde. Tambem verifica se algum numero esta fora
       da faixa; se estiver, desiste e retorna erro. */
    for (size_t i = 0; i < n; ++i) {
        if (valores[i] >= faixa) { free(posicoes); free(inicio); free(auxiliar); return -1; }
        ++posicoes[indice_balde(valores[i], faixa, k)];
    }

    /* Passo 1b - RESERVAR ESPACO: calcula onde cada balde comeca no
       vetor auxiliar. Cada balde comeca logo depois do anterior.
       Exemplo: se os baldes 0, 1 e 2 tem 1, 2 e 0 numeros,
       entao inicio = 0, 1, 3, 3.
       Depois, posicoes[b] passa a apontar para o inicio do balde b,
       que e onde o primeiro numero desse balde sera escrito. */
    inicio[0] = 0;
    for (size_t b = 0; b < k; ++b) {
        inicio[b + 1] = inicio[b] + posicoes[b];
        posicoes[b] = inicio[b];
    }

    /* Passo 1c - COLOCAR: percorre o vetor de novo e copia cada numero
       para a proxima posicao livre do seu balde. A ordem original dos
       numeros dentro de cada balde e mantida (distribuicao estavel). */
    for (size_t i = 0; i < n; ++i) {
        size_t b = indice_balde(valores[i], faixa, k);
        auxiliar[posicoes[b]++] = valores[i];
    }

    /* ---------------------------------------------------------------
     * ETAPA 2: ORDENAR CADA BALDE
     * --------------------------------------------------------------- */

    /* Insertion Sort interno. Repeticoes tambem podem gerar Theta(n^2):
       m valores 1 seguidos de m valores 0 exigem m*m deslocamentos.
       Para cada balde b, ordena so o trecho auxiliar[inicio[b] .. inicio[b+1]-1].
       Funciona como organizar cartas na mao: pega o proximo numero
       ('chave') e empurra para a direita os maiores que ele, ate achar
       o lugar certo. Cada empurrao e um "deslocamento".
       - Balde com 0 ou 1 numero: o laco interno nem executa (melhor caso).
       - Balde lotado e fora de ordem: muitos deslocamentos (pior caso). */
    for (size_t b = 0; b < k; ++b) {
        for (size_t i = inicio[b] + 1; i < inicio[b + 1]; ++i) {
            uint32_t chave = auxiliar[i];   /* numero que sera encaixado */
            size_t j = i;
            /* Enquanto o vizinho da esquerda (no mesmo balde) for maior,
               empurra ele uma posicao para a direita. */
            while (j > inicio[b] && auxiliar[j - 1] > chave) {
                auxiliar[j] = auxiliar[j - 1];
                --j;
            }
            auxiliar[j] = chave;            /* encaixa no lugar certo */
        }
    }

    /* ---------------------------------------------------------------
     * ETAPA 3: JUNTAR
     * Os baldes ja estao lado a lado e em ordem no vetor auxiliar
     * (balde 0, depois balde 1, ...). Basta copiar tudo de volta
     * para o vetor original.
     * --------------------------------------------------------------- */
    memcpy(valores, auxiliar, n * sizeof(*valores));

    /* Libera a memoria auxiliar. */
    free(posicoes); free(inicio); free(auxiliar);
    return 0;
}
