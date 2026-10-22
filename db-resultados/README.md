# Resultados experimentais

## Comparação principal

- `comparacao_medicoes.csv`: 162 tempos individuais dos dois algoritmos, sementes e indicadores de corretude.
- `comparacao_resultados.xlsx`: medições, estatísticas por fórmulas e três gráficos comparativos de linhas.
- `execucao_comparacao.txt`: compilador, protocolo, início, fim e situação da execução.

Os dois algoritmos recebem cópias das mesmas entradas `uint32_t`, com `K = 10n`. Bucket Sort usa `n` baldes e Insertion Sort interno. Foram feitas três repetições por algoritmo, cenário e tamanho, formando 54 grupos.

| Cenário | Quantidade de elementos |
| --- | --- |
| Aleatório | 10; 100; 1.000; 5.000; 10.000; 50.000; 100.000; 500.000; 1.000.000 |
| Melhor | 10; 100; 1.000; 5.000; 10.000; 50.000; 100.000; 500.000; 1.000.000 |
| Pior | 10; 100; 1.000; 5.000; 10.000; 50.000; 100.000; 500.000; 1.000.000 |

O CSV usa ponto e vírgula como separador e ponto decimal; os tempos estão em segundos. `baldes = 0` indica que Counting Sort não utiliza baldes. `ordenado` e `permutacao_correta` devem valer 1 em todos os registros; a última coluna verifica igualdade exata com `qsort`.

Os cenários melhor e pior descrevem as entradas escolhidas para Bucket Sort. Counting Sort executa Θ(n + K) em todos eles; com K = 10n, Θ(n). As médias são comparadas apenas dentro do mesmo cenário, tamanho e faixa. Tempos pequenos são sensíveis à resolução prática do cronômetro, ao alocador e ao escalonamento. Três repetições em um computador não permitem generalizar o desempenho para outras máquinas e distribuições.

Consulte o [guia da implementação](../cod-implementacao/README.md) e o [relatório final](../doc-entrega/relatorio_final.pdf).

## Rodada histórica

`bucket_sort_medicoes.csv`, `bucket_sort_resultados.xlsx` e `execucao_bucket_sort.txt` registram a rodada anterior, somente de Bucket Sort com `double` em `[0, 1)`: 75 medições, sem os testes opcionais de 1 milhão nos cenários melhor e pior. Esses dados não integram os gráficos comparativos atuais.
