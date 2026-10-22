#define _POSIX_C_SOURCE 200809L
#include "bucket_sort.h"
#include <inttypes.h>
#include <stdint.h>
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
    if (!QueryPerformanceFrequency(&frequencia) || !QueryPerformanceCounter(&contador)) {
        fprintf(stderr, "Falha no relogio de alta resolucao.\n"); exit(EXIT_FAILURE);
    }
    return (double)contador.QuadPart / (double)frequencia.QuadPart;
#else
    struct timespec instante;
    if (clock_gettime(CLOCK_MONOTONIC, &instante) != 0) {
        perror("clock_gettime"); exit(EXIT_FAILURE);
    }
    return (double)instante.tv_sec + (double)instante.tv_nsec / 1e9;
#endif
}

/* SplitMix64: geracao deterministica; nao depende de rand() da plataforma. */
static uint64_t proximo(uint64_t *estado) {
    uint64_t z = (*estado += UINT64_C(0x9e3779b97f4a7c15));
    z = (z ^ (z >> 30)) * UINT64_C(0xbf58476d1ce4e5b9);
    z = (z ^ (z >> 27)) * UINT64_C(0x94d049bb133111eb);
    return z ^ (z >> 31);
}

static void gerar(double *v, size_t n, int cenario, uint32_t semente) {
    uint64_t estado = semente;
    for (size_t i = 0; i < n; ++i) {
        if (cenario == 0) {
            v[i] = (double)(proximo(&estado) >> 11) * 0x1.0p-53;
        } else if (cenario == 1) {
            /* Exatamente um valor no centro de cada um dos n baldes. */
            v[i] = ((double)i + 0.5) / (double)n;
        } else {
            /* n valores distintos decrescentes em [0, 1/n): um unico balde.
               A faixa global do algoritmo permanece [0, 1). */
            v[i] = ((double)(n - i) - 0.5) / ((double)n * (double)n);
        }
    }
    if (cenario == 1) {
        /* A entrada do melhor caso nao precisa estar globalmente ordenada. */
        for (size_t i = n; i > 1; --i) {
            size_t j = (size_t)(proximo(&estado) % i);
            double tmp = v[i - 1]; v[i - 1] = v[j]; v[j] = tmp;
        }
    }
}

static int comparar(const void *a, const void *b) {
    double x = *(const double *)a, y = *(const double *)b;
    return (x > y) - (x < y);
}

static void mostrar(const double *v, size_t n) {
    for (size_t i = 0; i < n; ++i) printf("%s%.2f", i ? ", " : "", v[i]);
    putchar('\n');
}

static int demonstrar(void) {
    double v[] = {0.42, 0.15, 0.87, 0.33, 0.08, 0.71};
    size_t n = sizeof(v) / sizeof(v[0]), k = 5;
    printf("Bucket Sort com Insertion Sort interno; 5 baldes em [0, 1).\nEntrada: ");
    mostrar(v, n);
    for (size_t b = 0; b < k; ++b) {
        printf("Balde %zu [%.1f, %.1f): ", b, (double)b / k, (double)(b + 1) / k);
        for (size_t i = 0; i < n; ++i) if ((size_t)(v[i] * k) == b) printf("%.2f ", v[i]);
        putchar('\n');
    }
    double inicio = agora();
    int resultado = bucket_sort(v, n, k);
    double tempo = agora() - inicio;
    if (resultado != 0) return EXIT_FAILURE;
    printf("Saida ordenada: "); mostrar(v, n);
    printf("Tempo da ordenacao: %.9f segundos (medicao ilustrativa).\n", tempo);
    return EXIT_SUCCESS;
}

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--demo") == 0) return demonstrar();
    if (argc != 4 || strcmp(argv[1], "--output") != 0) {
        fprintf(stderr, "Uso: %s --demo\n     %s --output arquivo.csv repeticoes\n", argv[0], argv[0]);
        return EXIT_FAILURE;
    }
    char *fim;
    long repeticoes = strtol(argv[3], &fim, 10);
    if (*fim != '\0' || repeticoes < 1 || repeticoes > 100) {
        fprintf(stderr, "Repeticoes deve ser um inteiro entre 1 e 100.\n"); return EXIT_FAILURE;
    }
    FILE *csv = fopen(argv[2], "w");
    if (csv == NULL) { perror(argv[2]); return EXIT_FAILURE; }
    fprintf(csv, "algoritmo;cenario;n;baldes;repeticao;semente;tempo_segundos;ordenado;permutacao_correta\n");
    const size_t tamanhos[] = {10, 100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000};
    const char *cenarios[] = {"aleatorio", "melhor", "pior"};

    /* Aquecimento fora das medicoes registradas. */
    double aquecimento[1000];
    gerar(aquecimento, 1000, 0, 20261022);
    if (bucket_sort(aquecimento, 1000, 1000) != 0) { fclose(csv); return EXIT_FAILURE; }

    for (int cenario = 0; cenario < 3; ++cenario) {
        size_t quantidade = cenario == 0 ? 9 : 8;
        for (size_t t = 0; t < quantidade; ++t) {
            size_t n = tamanhos[t];
            double *v = malloc(n * sizeof(*v));
            double *referencia = malloc(n * sizeof(*referencia));
            if (v == NULL || referencia == NULL) {
                fprintf(stderr, "Memoria insuficiente.\n"); free(v); free(referencia); fclose(csv); return EXIT_FAILURE;
            }
            for (long r = 1; r <= repeticoes; ++r) {
                uint32_t semente = UINT32_C(20261022) + (uint32_t)n
                    + (uint32_t)cenario * UINT32_C(10000019) + (uint32_t)r * UINT32_C(1009);
                gerar(v, n, cenario, semente);
                memcpy(referencia, v, n * sizeof(*v));
                qsort(referencia, n, sizeof(*referencia), comparar);

                double inicio = agora();
                int resultado = bucket_sort(v, n, n);
                double tempo = agora() - inicio;

                int ordenado = 1;
                for (size_t i = 1; i < n; ++i) if (v[i - 1] > v[i]) ordenado = 0;
                int permutacao = memcmp(v, referencia, n * sizeof(*v)) == 0;
                if (resultado != 0 || !ordenado || !permutacao) {
                    fprintf(stderr, "FALHA: %s n=%zu repeticao=%ld\n", cenarios[cenario], n, r);
                    free(v); free(referencia); fclose(csv); return EXIT_FAILURE;
                }
                fprintf(csv, "bucket_sort_insertion;%s;%zu;%zu;%ld;%" PRIu32 ";%.9f;%d;%d\n",
                        cenarios[cenario], n, n, r, semente, tempo, ordenado, permutacao);
                fflush(csv);
                printf("%s n=%zu repeticao=%ld: %.9f s OK\n", cenarios[cenario], n, r, tempo);
                fflush(stdout);
            }
            free(v); free(referencia);
        }
    }
    if (fclose(csv) != 0) { perror("fclose"); return EXIT_FAILURE; }
    return EXIT_SUCCESS;
}
