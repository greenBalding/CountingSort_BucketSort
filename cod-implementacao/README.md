# Implementação e experimentos

Counting Sort estável e Bucket Sort com Insertion Sort interno ordenam valores `uint32_t` na faixa conhecida `[0, K)`. Counting Sort utiliza contagens acumuladas e percorre a entrada em ordem inversa para preencher a saída. Bucket Sort distribui os valores de forma estável em segmentos de um vetor auxiliar e aplica Insertion Sort em cada segmento.

## Arquivos principais

- `counting_sort.c/h`: Counting Sort estável, tempo e memória auxiliar Θ(n + K).
- `bucket_sort_int.c/h`: Bucket Sort inteiro, memória auxiliar Θ(n + b).
- `benchmark_comparacao.c`: demonstração, entradas compartilhadas, cronômetro e verificação com `qsort`.
- `test_comparacao.c`: casos de borda, parâmetros inválidos e comparação com `qsort` em 771 grupos de entradas para cada algoritmo.
- `executar-comparacao.ps1`: compilação e execução com GCC no Windows.
- `gerar_comparacao.mjs`: planilha Excel com fórmulas e gráficos.
- `gerar_relatorio.py`: relatório e conclusões em PDF a partir do CSV.
- `preparar-apresentacao.mjs`: dados e trechos reais de C para a apresentação.

## Executar

Na raiz do repositório, com GCC no `PATH`, execute no PowerShell:

```powershell
# Compila, valida e demonstra os dois algoritmos.
.\cod-implementacao\executar-comparacao.ps1 -SomenteValidar

# Executa a rodada completa, incluindo os testes opcionais com 1 milhão.
.\cod-implementacao\executar-comparacao.ps1 -Repeticoes 3
```

O script interrompe a execução se `comparacao_medicoes.csv` já existir. Para outra rodada, preserve os arquivos anteriores em outro local. Os executáveis são gerados em `build/`, ignorada pelo Git. O pior caso de Bucket Sort pode levar vários minutos.

Compilação manual, após criar `cod-implementacao/build`:

```powershell
gcc -std=c11 -O2 -Wall -Wextra -Wpedantic cod-implementacao/counting_sort.c cod-implementacao/bucket_sort_int.c cod-implementacao/benchmark_comparacao.c -o cod-implementacao/build/comparacao.exe
.\cod-implementacao\build\comparacao.exe --demo
```

## Protocolo

Usam-se `K = 10n`, `b = n` baldes e nove tamanhos em todos os cenários: 10, 100, 1.000, 5.000, 10.000, 50.000, 100.000, 500.000 e 1.000.000. Cada combinação é executada três vezes por algoritmo, totalizando 162 medições.

| Cenário | Entrada compartilhada | Efeito no Bucket Sort |
| --- | --- | --- |
| Aleatório | SplitMix64 módulo K, com semente registrada | Distribuição aproximadamente uniforme |
| Melhor | Valores `10*i + 5` embaralhados | Um elemento por balde; Θ(n) |
| Pior | Metade dos valores iguais a 1 seguida de metade igual a 0 | Primeiro balde; n²/4 deslocamentos; Θ(n²) |

A entrada de pior caso demonstra crescimento quadrático, embora não maximize a constante entre todas as entradas possíveis. O intervalo global permanece fixo durante cada ordenação. Counting Sort executa Θ(n + K) em todos os cenários; com K = 10n, Θ(n).

`QueryPerformanceCounter` mede a chamada inteira: alocação, distribuição, ordenação, cópia final e liberação. Geração, cópia inicial, referência com `qsort`, validação e gravação ficam fora do tempo. Há aquecimento com 1.000 elementos nos dois algoritmos. A ordem das execuções é alternada e as medições são sequenciais. Todas as saídas devem estar ordenadas e ser exatamente iguais à referência.

## Artefatos derivados

```powershell
node cod-implementacao/gerar_comparacao.mjs
py cod-implementacao/gerar_relatorio.py
node cod-implementacao/preparar-apresentacao.mjs
```

O gerador de Excel requer `@oai/artifact-tool` no ambiente Node de geração. O relatório requer ReportLab, Matplotlib e pypdf. A apresentação usa somente Node e arquivos locais; o workflow de publicação regenera seus dados automaticamente.

## Histórico

`bucket_sort.c/h`, `benchmark.c`, `test_bucket_sort.c`, `executar-testes.ps1` e `gerar_planilha.mjs` pertencem à rodada anterior de Bucket Sort com `double` em `[0, 1)`. Os resultados históricos não são combinados com o experimento inteiro atual.
