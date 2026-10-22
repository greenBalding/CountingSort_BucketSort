# Resultados experimentais do Bucket Sort

Os resultados correspondem ao Bucket Sort implementado em C, com `n` baldes e Insertion Sort na ordenação interna. A faixa global dos valores é `[0, 1)`.

## Arquivos

- `bucket_sort_medicoes.csv`: tempos individuais, sementes, quantidade de baldes e verificação de corretude.
- `bucket_sort_resultados.xlsx`: medições, resumo estatístico e gráficos de linhas por cenário.
- `execucao_bucket_sort.txt`: compilador, opções de compilação, método de medição e horário da execução.

O CSV utiliza ponto e vírgula como separador e ponto como separador decimal. Os tempos estão em **segundos**. A planilha Excel apresenta os valores numéricos e os gráficos correspondentes.

## Tamanhos avaliados

| Cenário | Quantidade de elementos |
| --- | --- |
| Aleatório | 10; 100; 1.000; 5.000; 10.000; 50.000; 100.000; 500.000; 1.000.000 |
| Melhor caso | 10; 100; 1.000; 5.000; 10.000; 50.000; 100.000; 500.000 |
| Pior caso | 10; 100; 1.000; 5.000; 10.000; 50.000; 100.000; 500.000 |

São três repetições para cada combinação de cenário e tamanho, totalizando **75 medições**. Os testes opcionais de 1.000.000 de elementos no melhor e no pior caso não fazem parte desta rodada.

## Interpretação dos resultados

Os cenários são definidos pela distribuição dos valores entre os baldes e pela ordem dos elementos dentro deles. O melhor caso coloca um elemento em cada balde; o pior concentra valores distintos em ordem decrescente em um único balde. As definições completas e as instruções de reprodução estão em [`cod-implementacao/README.md`](../cod-implementacao/README.md).

A média, a mediana, o mínimo e o máximo permitem observar a variação das três medições. Para entradas pequenas, os tempos podem ser próximos da resolução prática da medição e sensíveis ao escalonamento do sistema, ao alocador de memória e aos processos em segundo plano. Melhor caso teórico não implica necessariamente o menor tempo observado em cada medição individual.

A rodada registra somente Bucket Sort. Os resultados de Counting Sort serão adicionados quando sua implementação e seus experimentos forem realizados.
