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
