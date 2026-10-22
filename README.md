# 1º Trabalho para N1 – Seminário (Projeto e Análise de Algoritmos 1)

**Disciplina:** Projeto e Análise de Algoritmos 1 (CMP 1065)  
**Professor:** Prof. MSc. Anibal Santos Jukemura  
**Alunos:** Ludmila Lima do Espirito Santo e Matheus Silva Pains  
**Tema/Algoritmos:** Counting Sort x Bucket Sort  

---

## Enunciado

> **(Cormen – 2.2.2)** Considere a ordenação de $n$ números armazenados no arranjo (vetor estático unidimensional) $A$, localizando primeiro o menor elemento de $A$ e permutando esse elemento com o elemento contido em $A[1]$. Em seguida, encontre o segundo menor elemento de $A$ e o troque pelo elemento $A[2]$. Continue dessa maneira para os primeiros $n - 1$ elementos de $A$.

---

## O que é pedido para o trabalho

- **a)** Forneça os tempos de execução do melhor caso e do pior caso das ordenações em notação $\Theta$, conforme sorteio feito em sala.
- **b)** Forneça uma implementação em Linguagem C que demonstre o funcionamento dos algoritmos, com o cálculo de tempo gasto para ordenar o vetor.
- **c)** Realize testes com 10, 100, 1.000, 5.000, 10.000, 50.000, 100.000, 500.000 e 1.000.000 de entradas aleatórias. Coloque os resultados temporais em Excel e plote um gráfico de linhas com os valores encontrados e respectivas quantidades. Entregue o relatório para apresentação em sala.
- **d)** Simule os testes com 10, 100, 1.000, 5.000, 10.000, 50.000, 100.000 e 500.000 de entradas para o melhor caso e para o pior caso. Coloque os resultados temporais em Excel e plote um gráfico de linhas com os valores encontrados e respectivas quantidades. Entregue o relatório para apresentação em sala.
- **e)** Descrevam o computador utilizado (CPU, RAM, modelo).
- **f)** Caso necessário para melhores esclarecimentos, podem testar com 1.000.000 de entradas no melhor, pior e caso aleatório.
- **g)** Apresentem conclusões retiradas com o experimento para iniciarmos as discussões em sala de aula (devem ser impressas para todos os alunos).

---

## Checklist de Entregas

- [ ] **Item a:** Tempos teóricos de melhor e pior caso em notação $\Theta$
- [ ] **Item b:** Implementação em C com medição de tempo de execução
- [ ] **Item c:** Testes com entradas aleatórias + planilha Excel + gráfico de linhas
- [ ] **Item d:** Testes de melhor e pior caso + planilha Excel + gráfico de linhas
- [ ] **Item e:** Descrição da máquina de teste (CPU, RAM, modelo)
- [ ] **Item f:** Teste opcional com 1.000.000 para melhor/pior/aleatório
- [ ] **Item g:** Conclusões obtidas para discussão em sala e relatório final

---

## Livros de referência

As páginas abaixo correspondem às versões dos livros salvas em `doc-referencia`. A página impressa é a numeração apresentada no próprio livro; a página do PDF é a posição contada pelo leitor de PDF, incluindo capa e páginas iniciais.

### Counting Sort — ordenação por contagem

**MORIN, Pat. _Open Data Structures (in C++)_. Edição 0.1Gβ.**

- **Arquivo:** [Open Data Structures — Pat Morin](doc-referencia/Open_Data_Structures_Pat_Morin_CPP.pdf#page=253).
- **Localização:** capítulo 11, “Sorting Algorithms”; seção 11.2, “Counting Sort and Radix Sort”; subseção **11.2.1, “Counting Sort”**.
- **Páginas impressas:** 239–241 (**páginas 253–255 do PDF**). A subseção 11.2.2, sobre Radix Sort, começa ainda na página impressa 241.
- **Conteúdo para a fundamentação teórica:** contagem das ocorrências, contagens acumuladas, construção do vetor de saída, implementação em C++, análise do tempo em função de `n` (quantidade de elementos) e `k` (tamanho da faixa de valores), além da estabilidade do algoritmo.
- **Fonte original:** [site oficial do livro](https://opendatastructures.org/).

### Bucket Sort — ordenação por baldes

**KRAHETS e colaboradores. _Hello Algo_. Versão 1.3.0, edição em inglês com exemplos em C.**

- **Arquivo:** [Hello Algo — versão em inglês com código em C](doc-referencia/Hello_Algo_1.3.0_English_C.pdf#page=273).
- **Localização:** capítulo 11, “Sorting”; seção **11.8, “Bucket Sort”**.
- **Páginas impressas:** 266–269 (**páginas 273–276 do PDF**).
- **Funcionamento e implementação:** subseção **11.8.1, “Algorithm Flow”**, páginas impressas 266–267 (**páginas 273–274 do PDF**), com ilustração da distribuição, ordenação interna e reunião dos baldes, além de código em C.
- **Análise de complexidade e estabilidade:** subseção **11.8.2, “Algorithm Characteristics”**, página impressa 268 (**página 275 do PDF**).
- **Distribuição dos dados:** subseção **11.8.3, “How to Achieve Even Distribution”**, páginas impressas 268–269 (**páginas 275–276 do PDF**).
- **Pior caso:** a seção 11.11, “Summary”, página impressa 279 (**página 286 do PDF**), explica que concentrar os elementos em um único balde pode produzir tempo quadrático quando a ordenação interna tem custo quadrático. A análise do trabalho deve explicitar o algoritmo interno e a quantidade de baldes adotados.
- **Fonte original:** [PDF oficial da versão 1.3.0](https://github.com/krahets/hello-algo/releases/download/1.3.0/hello-algo_1.3.0_en_c.pdf) e [seção online sobre Bucket Sort](https://www.hello-algo.com/en/chapter_sorting/bucket_sort/).
