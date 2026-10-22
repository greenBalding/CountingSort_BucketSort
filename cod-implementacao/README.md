# Implementação do Bucket Sort

A implementação em C ordena valores `double` no intervalo global fixo `[0, 1)`. Os valores são distribuídos em `k` baldes por intervalos uniformes, e cada balde é ordenado com Insertion Sort. Nos experimentos, `k = n`.

Os baldes ocupam segmentos de um único vetor auxiliar. Contagens e posições delimitam esses segmentos, evitando reservar `n` posições para cada balde. O algoritmo usa memória auxiliar Θ(n + k) e preserva a ordem relativa de elementos iguais.

## Arquivos

- `bucket_sort.h` e `bucket_sort.c`: interface e implementação do algoritmo.
- `benchmark.c`: demonstração, geração dos cenários, medição e verificação dos resultados.
- `test_bucket_sort.c`: validação com casos de borda e comparação independente com `qsort`.
- `executar-testes.ps1`: compilação e execução no Windows com GCC.
- `gerar_planilha.mjs`: conversão das medições em planilha Excel com fórmulas e gráficos.

## Compilação e execução

Na raiz do repositório, com GCC disponível no `PATH`, execute no PowerShell:

```powershell
# Compila, valida e exibe uma demonstração; não executa os experimentos completos.
.\cod-implementacao\executar-testes.ps1 -SomenteValidar

# Executa três repetições para cada cenário e tamanho obrigatório.
.\cod-implementacao\executar-testes.ps1 -Repeticoes 3

# Repete somente a demonstração após compilar.
.\cod-implementacao\build\bucket_sort.exe --demo
```

O script interrompe a execução se o CSV de medições já existir. Para realizar uma nova rodada, renomeie os resultados anteriores antes de executar novamente. Os executáveis ficam em `build/`, ignorada pelo Git.

Para compilar manualmente a demonstração e o benchmark:

```powershell
gcc -std=c11 -O2 -Wall -Wextra -Wpedantic cod-implementacao/bucket_sort.c cod-implementacao/benchmark.c -o cod-implementacao/build/bucket_sort.exe -lm
```

O diretório `cod-implementacao/build` deve existir antes dessa compilação manual. A opção `--output caminho.csv 3` executa os experimentos com três repetições e grava as medições no arquivo indicado; essa opção direta substitui um arquivo existente.

## Cenários experimentais

| Cenário | Geração dos dados | Justificativa |
| --- | --- | --- |
| Aleatório | Valores pseudoaleatórios em `[0, 1)`, gerados com SplitMix64 e 53 bits de precisão; a semente é registrada por repetição. | Distribuição aproximadamente uniforme entre os baldes. |
| Melhor caso | Valor `(i + 0,5) / n` para cada índice `i`, com embaralhamento antes da ordenação. | Cada balde recebe exatamente um elemento; a ordenação interna não realiza deslocamentos. |
| Pior caso | Valor `((n - i) - 0,5) / n²` para cada índice `i`. | Valores distintos em ordem decrescente, todos no intervalo `[0, 1/n)`, portanto no primeiro balde. |

A faixa global permanece `[0, 1)` em todos os cenários. O algoritmo não recalcula mínimo e máximo da entrada: fazer isso no pior caso espalharia novamente os valores, alterando o cenário analisado.

Com `k = n`, o melhor caso custa Θ(n). No pior caso, o Insertion Sort de um único balde realiza `n(n−1)/2` deslocamentos, resultando em Θ(n²). A memória auxiliar é Θ(n).

## Medição e corretude

O tempo decorrido é obtido com `QueryPerformanceCounter` no Windows. A medição inclui a chamada completa a `bucket_sort`: alocação, distribuição, ordenação interna, cópia da saída e liberação da memória. A geração das entradas, a ordenação de referência com `qsort`, as verificações e a gravação no CSV ficam fora do trecho medido.

Cada execução deve produzir uma saída crescente e exatamente igual ao vetor ordenado com `qsort`. Falhas interrompem o experimento. Há uma chamada de aquecimento com 1.000 elementos aleatórios antes das medições registradas. As medições são executadas sequencialmente; o pior caso de 500.000 elementos pode levar vários minutos considerando as três repetições.

Os registros ficam em [`../db-resultados`](../db-resultados/). Os dados da máquina estão em [`pc-utilizado.txt`](../doc-referencia/pc-utilizado.txt).
