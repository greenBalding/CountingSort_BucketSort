#define _POSIX_C_SOURCE 200809L
#include "counting_sort.h"
#include "bucket_sort_int.h"
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <time.h>
#endif
static double agora(void) {
#ifdef _WIN32
    LARGE_INTEGER contador, frequencia;
    if (!QueryPerformanceFrequency(&frequencia) || !QueryPerformanceCounter(&contador)) exit(EXIT_FAILURE);
    return (double)contador.QuadPart / (double)frequencia.QuadPart;
#else
    struct timespec t;
    if (clock_gettime(CLOCK_MONOTONIC, &t) != 0) exit(EXIT_FAILURE);
    return (double)t.tv_sec + (double)t.tv_nsec / 1e9;
#endif
}
static uint64_t proximo(uint64_t *estado) {
    uint64_t z = (*estado += UINT64_C(0x9e3779b97f4a7c15));
    z = (z ^ (z >> 30)) * UINT64_C(0xbf58476d1ce4e5b9);
    z = (z ^ (z >> 27)) * UINT64_C(0x94d049bb133111eb);
    return z ^ (z >> 31);
}
static void gerar(uint32_t *v, size_t n, int cenario, uint32_t semente) {
    uint64_t estado = semente;
    uint32_t faixa = (uint32_t)(10 * n);
    for (size_t i = 0; i < n; ++i) {
        if (cenario == 0) v[i] = (uint32_t)(proximo(&estado) % faixa);
        else if (cenario == 1) v[i] = (uint32_t)(10 * i + 5);
        else v[i] = i < n / 2 ? 1 : 0;
    }
    if (cenario == 1) for (size_t i = n; i > 1; --i) {
        size_t j = (size_t)(proximo(&estado) % i);
        uint32_t tmp = v[i - 1]; v[i - 1] = v[j]; v[j] = tmp;
    }
}
static int comparar(const void *a, const void *b) {
    uint32_t x = *(const uint32_t *)a, y = *(const uint32_t *)b;
    return (x > y) - (x < y);
}
static int demonstrar(void) {
    uint32_t original[] = {42,15,87,33,8,71}, v[6];
    for (int algoritmo = 0; algoritmo < 2; ++algoritmo) {
        memcpy(v,original,sizeof(v));
        double inicio = agora();
        int status = algoritmo == 0 ? counting_sort(v,6,100) : bucket_sort_int(v,6,100,5);
        double tempo = agora() - inicio;
        if (status != 0) return EXIT_FAILURE;
        printf("%s: ", algoritmo == 0 ? "Counting Sort" : "Bucket Sort");
        for (size_t i = 0; i < 6; ++i) printf("%s%" PRIu32, i ? ", " : "", v[i]);
        printf(" | tempo ilustrativo %.9f s\n", tempo);
    }
    return EXIT_SUCCESS;
}
int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1],"--demo") == 0) return demonstrar();
    if (argc != 4 || strcmp(argv[1],"--output") != 0) {
        fprintf(stderr,"Uso: %s --demo | --output arquivo.csv repeticoes\n",argv[0]); return EXIT_FAILURE;
    }
    char *fim;
    long repeticoes = strtol(argv[3],&fim,10);
    if (*fim || repeticoes < 1 || repeticoes > 100) return EXIT_FAILURE;
    FILE *csv = fopen(argv[2],"w");
    if (!csv) { perror(argv[2]); return EXIT_FAILURE; }
    fprintf(csv,"algoritmo;cenario;n;faixa;baldes;repeticao;semente;tempo_segundos;ordenado;permutacao_correta\n");
    const size_t tamanhos[] = {10,100,1000,5000,10000,50000,100000,500000,1000000};
    const char *cenarios[] = {"aleatorio","melhor","pior"};
    const char *algoritmos[] = {"counting_sort","bucket_sort_insertion_int"};
    uint32_t aquecimento[1000];
    for (int a = 0; a < 2; ++a) {
        gerar(aquecimento,1000,0,20261022);
        int status = a == 0 ? counting_sort(aquecimento,1000,10000) : bucket_sort_int(aquecimento,1000,10000,1000);
        if (status != 0) { fclose(csv); return EXIT_FAILURE; }
    }
    for (int c = 0; c < 3; ++c) for (size_t t = 0; t < 9; ++t) {
        size_t n = tamanhos[t];
        uint32_t faixa = (uint32_t)(10 * n);
        uint32_t *entrada = malloc(n*sizeof(*entrada)), *referencia = malloc(n*sizeof(*referencia)), *v = malloc(n*sizeof(*v));
        if (!entrada || !referencia || !v) { free(entrada);free(referencia);free(v);fclose(csv);return EXIT_FAILURE; }
        for (long r = 1; r <= repeticoes; ++r) {
            uint32_t semente = UINT32_C(20261022) + (uint32_t)n + (uint32_t)c*UINT32_C(10000019) + (uint32_t)r*UINT32_C(1009);
            gerar(entrada,n,c,semente);
            /* Verifica o cenario efetivo antes de medir. */
            if (c == 1) for (size_t i = 0; i < n; ++i) {
                if (entrada[i] % 10 != 5) { fclose(csv);return EXIT_FAILURE; }
            }
            if (c == 2) for (size_t i = 0; i < n; ++i) {
                if (entrada[i] != (i < n/2 ? 1u : 0u)) { fclose(csv);return EXIT_FAILURE; }
            }
            memcpy(referencia,entrada,n*sizeof(*entrada));
            qsort(referencia,n,sizeof(*referencia),comparar);
            /* Alterna qual algoritmo executa primeiro em cada repeticao. */
            for (int ordem = 0; ordem < 2; ++ordem) {
                int a = (int)((r - 1 + c + (long)t + ordem) % 2);
                memcpy(v,entrada,n*sizeof(*v));
                double inicio = agora();
                int status = a == 0 ? counting_sort(v,n,faixa) : bucket_sort_int(v,n,faixa,n);
                double tempo = agora() - inicio;
                int ordenado = 1;
                for (size_t i = 1; i < n; ++i) if (v[i-1] > v[i]) ordenado = 0;
                int permutacao = memcmp(v,referencia,n*sizeof(*v)) == 0;
                if (status != 0 || !ordenado || !permutacao) {
                    fprintf(stderr,"Falha de corretude: %s %s n=%zu\n",algoritmos[a],cenarios[c],n);
                    free(entrada);free(referencia);free(v);fclose(csv);return EXIT_FAILURE;
                }
                fprintf(csv,"%s;%s;%zu;%" PRIu32 ";%zu;%ld;%" PRIu32 ";%.9f;%d;%d\n",algoritmos[a],cenarios[c],n,faixa,a ? n : 0,r,semente,tempo,ordenado,permutacao);
                fflush(csv);
                printf("%s %s n=%zu repeticao=%ld: %.9f s OK\n",algoritmos[a],cenarios[c],n,r,tempo);
                fflush(stdout);
            }
        }
        free(entrada);free(referencia);free(v);
    }
    if (fclose(csv) != 0) return EXIT_FAILURE;
    return EXIT_SUCCESS;
}
