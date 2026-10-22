"""Gera relatório e conclusões a partir das medições reais pareadas.

Uso: py -3.13 cod-implementacao/gerar_relatorio.py
Dependências: reportlab, matplotlib, pypdf.
"""
from pathlib import Path
import csv
import statistics as st
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                               TableStyle, PageBreak, Image)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'doc-entrega'
DATA = ROOT / 'db-resultados' / 'comparacao_medicoes.csv'
SIZES = [10, 100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000]
ALGS = ['counting_sort', 'bucket_sort_insertion_int']
LABELS = ['Counting Sort', 'Bucket Sort + Insertion Sort']
NAMES = 'Ludmila Lima do Espirito Santo e Matheus Silva Pains'


def main():
    OUT.mkdir(exist_ok=True)
    with DATA.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f, delimiter=';'))
    assert len(rows) == 162, f'Esperadas 162 medições, obtidas {len(rows)}'
    groups = {}
    for r in rows:
        assert r['ordenado'] in ('1', 'true', 'sim')
        assert r['permutacao_correta'] in ('1', 'true', 'sim')
        key = (r['algoritmo'], r['cenario'], int(r['n']))
        groups.setdefault(key, []).append(float(r['tempo_segundos'].replace(',', '.')))
    assert len(groups) == 54 and all(len(v) == 3 for v in groups.values())
    assert set(k[1] for k in groups) == {'aleatorio', 'melhor', 'pior'}
    avg = lambda a, c, n: st.mean(groups[(a, c, n)])
    fmt = lambda v: f'{v:.9f}'.replace('.', ',')
    num = lambda v: f'{v:,}'.replace(',', '.')
    font_path = font_manager.findfont('DejaVu Sans')
    bold_path = font_manager.findfont(font_manager.FontProperties(family='DejaVu Sans', weight='bold'))
    pdfmetrics.registerFont(TTFont('DejaVu', font_path))
    pdfmetrics.registerFont(TTFont('DejaVu-Bold', bold_path))
    pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold', italic='DejaVu', boldItalic='DejaVu-Bold')
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='BodyPT', fontName='DejaVu', fontSize=9.3, leading=14, spaceAfter=8))
    styles.add(ParagraphStyle(name='SmallPT', fontName='DejaVu', fontSize=8, leading=11.5, spaceAfter=6))
    styles.add(ParagraphStyle(name='TitlePT', fontName='DejaVu-Bold', fontSize=20, leading=25, spaceAfter=13))
    styles.add(ParagraphStyle(name='HeadPT', fontName='DejaVu-Bold', fontSize=12, leading=17, spaceBefore=9, spaceAfter=8))
    styles.add(ParagraphStyle(name='CodePT', fontName='Courier', fontSize=7.8, leading=11, spaceAfter=8))
    narrative = []
    def p(text, small=False):
        narrative.append(text.replace('<b>', '').replace('</b>', ''))
        return Paragraph(text, styles['SmallPT' if small else 'BodyPT'])
    def h(text):
        narrative.append('\n## ' + text)
        return Paragraph(text, styles['HeadPT'])
    def title(text):
        narrative.append('# ' + text)
        return Paragraph(text, styles['TitlePT'])
    def table(scenario):
        data = [[Paragraph('<b>Elementos (n)</b>', styles['SmallPT']), Paragraph('<b>Counting Sort (s)</b>', styles['SmallPT']), Paragraph('<b>Bucket Sort (s)</b>', styles['SmallPT'])]]
        for n in SIZES:
            data.append([num(n), fmt(avg(ALGS[0], scenario, n)), fmt(avg(ALGS[1], scenario, n))])
        t = Table(data, colWidths=[120, 185, 185], repeatRows=1, hAlign='LEFT')
        t.setStyle(TableStyle([('FONTNAME', (0,0),(-1,-1),'DejaVu'),('FONTSIZE',(0,0),(-1,-1),8.5),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eceff2')),('LINEBELOW',(0,0),(-1,0),0.6,colors.HexColor('#333333')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f6f7f8')]),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
        return t
    def chart(scenario):
        fig, ax = plt.subplots(figsize=(8.0, 3.6), layout='constrained')
        for alg, label, color, marker in zip(ALGS,LABELS,['#1b4b70','#9b392b'],['o','s']):
            ax.plot(SIZES,[avg(alg,scenario,n) for n in SIZES], label=label, color=color, marker=marker, markersize=4, linewidth=1.5)
        ax.set_xscale('log'); ax.set_yscale('log')
        ax.set_xlabel('Quantidade de elementos (n) - escala logarítmica')
        ax.set_ylabel('Tempo médio (s) - escala logarítmica')
        ax.grid(True, which='major', alpha=.25); ax.legend(fontsize=8)
        path=OUT/f'comparacao_{scenario}.png'
        fig.savefig(path,dpi=190); plt.close(fig)
        return Image(str(path), width=490, height=220)
    def footer(canvas, doc):
        canvas.saveState(); canvas.setFont('DejaVu',7)
        canvas.setStrokeColor(colors.HexColor('#b0b7be')); canvas.line(48,40,A4[0]-48,40)
        canvas.drawString(48,27,'Counting Sort x Bucket Sort | Projeto e Análise de Algoritmos 1')
        canvas.drawRightString(A4[0]-48,27,str(doc.page)); canvas.restoreState()
    def build(path, story):
        SimpleDocTemplate(str(path), pagesize=A4, rightMargin=48,leftMargin=48,topMargin=40,bottomMargin=54,title='Counting Sort x Bucket Sort',author=NAMES).build(story,onFirstPage=footer,onLaterPages=footer)

    story=[title('Counting Sort x Bucket Sort'),p(NAMES),p('Projeto e Análise de Algoritmos 1 (CMP 1065)<br/>Professor: Prof. MSc. Anibal Santos Jukemura<br/>Experimentos: 22 de outubro de 2026.'),p('Este relatório apresenta a implementação em C, a análise assintótica e a comparação experimental dos algoritmos. Os itens seguem a ordem A a G da atividade.'),h('A. Melhor e pior caso em notação Θ'),p('Adotam-se n elementos inteiros sem sinal de 32 bits, faixa conhecida de K chaves em [0, K), com K = 10n, e b = n baldes. O número de chaves possíveis K é mantido para cada tamanho, inclusive quando a entrada usa somente 0 e 1. Esses parâmetros são parte da análise, e não valores recalculados a partir do máximo observado.'),h('Counting Sort: contagens acumuladas'),p('A implementação inicializa K contadores, conta n ocorrências, acumula as K contagens, percorre a entrada de trás para frente para construir a saída e copia os n elementos. Portanto, melhor e pior caso são Θ(n + K). Com K = 10n, ambos são Θ(n). A ordem de entrada e a concentração dos valores não eliminam a passagem por toda a faixa. A memória auxiliar é Θ(n + K). A passagem reversa preserva a ordem relativa de chaves iguais, caracterizando a versão estável. [1]'),h('Bucket Sort: Insertion Sort dentro de cada balde'),p('O índice é floor(valor × b / K); com os parâmetros adotados, equivale a valor / 10. Os baldes são segmentos de um vetor auxiliar, dimensionados por contagens e posições acumuladas, sem reservar n posições para cada balde. Inicialização, distribuição estável e reunião custam Θ(n + b). A memória auxiliar é Θ(n + b).'),p('<b>Melhor caso: Θ(n + b), ou Θ(n) com b = n.</b> Cada balde recebe um elemento. O Insertion Sort não desloca elementos e as demais etapas são lineares. Esse é um exemplo suficiente de melhor caso; baldes já ordenados também podem produzir custo linear.'),p('<b>Pior caso: Θ(n² + b), ou Θ(n²) com b = n.</b> A entrada contém primeiro n/2 valores 1 e depois n/2 valores 0. Todos pertencem ao primeiro balde. Cada zero desloca os n/2 valores 1, totalizando n²/4 deslocamentos para os tamanhos pares utilizados. Esse custo atinge a mesma ordem quadrática do limite superior do Insertion Sort.'),p('Sob distribuição aproximadamente uniforme e b proporcional a n, o custo esperado do Bucket Sort com Insertion Sort é linear. Essa afirmação depende da distribuição e não substitui a análise do pior caso. A escolha do algoritmo interno é explícita: o exemplo do Hello Algo usa qsort; este trabalho adota Insertion Sort para estudar a degeneração quadrática. [2]',True),PageBreak()]
    story += [title('Implementação e protocolo'),h('B. Programa em linguagem C'),p('Os algoritmos recebem cópias do mesmo vetor de uint32_t. Counting Sort usa contagens acumuladas e saída auxiliar; Bucket Sort usa distribuição por intervalos, preserva a ordem de chegada e aplica Insertion Sort em cada segmento. A comparação utiliza o mesmo domínio de entrada e o mesmo tipo numérico.'),h('Estrutura das operações'),p('<b>Counting Sort:</b> zerar K contadores; contar as chaves; acumular as contagens; percorrer a entrada em sentido reverso, posicionando cada valor na saída; copiar a saída e liberar a memória.'),p('<b>Bucket Sort:</b> contar ocupações; calcular os limites dos segmentos; distribuir preservando a ordem; ordenar cada segmento com Insertion Sort; copiar o resultado e liberar a memória.'),h('Medição e validação'),p('O relógio QueryPerformanceCounter mede a chamada completa de cada ordenação, incluindo alocação, processamento, cópia de saída e liberação de memória. Geração, cópia das entradas, ordenação de referência com qsort, conferência e gravação no CSV ficam fora do intervalo cronometrado.'),p('Cada saída é conferida quanto à ordem crescente e à igualdade exata com o resultado de qsort. Assim, não basta produzir um vetor crescente: os valores e suas multiplicidades devem coincidir com a entrada. Todas as 162 medições registradas passaram nas duas verificações.'),h('Entradas e repetições'),p('São nove tamanhos: 10, 100, 1.000, 5.000, 10.000, 50.000, 100.000, 500.000 e 1.000.000. Para cada tamanho e cenário realizam-se três repetições por algoritmo. A ordem de execução dos algoritmos é alternada entre as repetições, e as medições são sequenciais. O CSV registra as sementes e o tempo individual de cada execução.'),p('<b>Aleatório:</b> valores produzidos por SplitMix64 e reduzidos módulo K. Isso fornece uma distribuição pseudoaleatória aproximadamente uniforme; a redução modular pode introduzir viés discreto desprezível neste domínio, e não representa todos os padrões de dados possíveis.'),p('<b>Melhor para Bucket Sort:</b> chaves 10i + 5, para i de 0 a n − 1, embaralhadas. Cada balde recebe exatamente um elemento. <b>Pior para Bucket Sort:</b> metade de valores 1 seguida de metade de valores 0; todos ficam no primeiro balde.'),p('Os nomes “melhor” e “pior” designam cenários construídos para Bucket Sort. Para Counting Sort, com a faixa K fixada, todos eles conservam Θ(n + K); os tempos medidos ainda podem variar por acesso à memória, cache e custos do sistema.'),p('As tabelas seguintes apresentam médias aritméticas de três execuções em segundos. Os tempos individuais e as medidas de dispersão estão na planilha e no CSV. Não se somam tempos de execuções distintas. Medidas muito pequenas são mais sensíveis à resolução e ao ruído do ambiente.'),PageBreak()]
    for scenario,section,description in [('aleatorio','C. Entradas aleatórias','Valores pseudoaleatórios no domínio comum [0, 10n). Os dois algoritmos recebem exatamente os mesmos valores em cada repetição.'),('melhor','D. Cenário de melhor caso','Um elemento por balde, com entrada embaralhada. Counting Sort percorre a faixa de 10n chaves e Bucket Sort não realiza deslocamentos internos.'),('pior','D. Cenário de pior caso','Todos os valores pertencem ao primeiro balde, com todos os 1 antes dos 0. No Bucket Sort, o Insertion Sort executa n²/4 deslocamentos; Counting Sort mantém sua estrutura linear em n + K.')]:
        story += [title(section),p(description),table(scenario),Spacer(1,12),chart(scenario),p('Fonte: medições reais em db-resultados/comparacao_medicoes.csv; média de três repetições por ponto. Escalas logarítmicas nos dois eixos, para permitir a leitura conjunta de tamanhos e tempos com ordens de grandeza diferentes.',True)]
        if scenario!='aleatorio': story += [p('O tamanho 1.000.000 complementa os oito tamanhos obrigatórios deste cenário, atendendo à possibilidade prevista no item F.',True)]
        story += [PageBreak()]
    worst_c=avg(ALGS[0],'pior',1000000); worst_b=avg(ALGS[1],'pior',1000000)
    random_c=avg(ALGS[0],'aleatorio',1000000); random_b=avg(ALGS[1],'aleatorio',1000000)
    winner=LABELS[0] if random_c<random_b else LABELS[1]
    conclusions=[
        'Counting Sort apresenta Θ(n + K) tanto no melhor quanto no pior caso da versão implementada. Com K = 10n, o crescimento assintótico é linear, embora os tempos variem entre entradas por efeitos de acesso à memória.',
        'Bucket Sort depende da ocupação dos baldes e da ordenação interna. Um elemento por balde evita deslocamentos; a concentração de 1 e 0 em um balde produz n²/4 deslocamentos e pior caso Θ(n²) com Insertion Sort.',
        f'Para 1.000.000 de entradas aleatórias, as médias foram {fmt(random_c)} s para Counting Sort e {fmt(random_b)} s para Bucket Sort. Nesse ponto, {winner} apresentou o menor tempo médio; o resultado vale para esta implementação, máquina e domínio.',
        f'No cenário concentrado com 1.000.000 de elementos, Counting Sort levou em média {fmt(worst_c)} s e Bucket Sort {fmt(worst_b)} s. A diferença evidencia a importância da distribuição e do custo da ordenação interna.',
        'Os algoritmos receberam cópias idênticas das entradas e todas as 162 execuções tiveram saída ordenada e igual à referência qsort. A correção foi verificada fora do tempo medido.',
        'O experimento fixa a faixa em dez vezes o tamanho da entrada. Não demonstra vantagem universal: uma faixa muito maior penaliza tempo e memória do Counting Sort; outra ordenação interna ou outro mapeamento pode alterar o comportamento do Bucket Sort.'
    ]
    story += [title('Máquina e interpretação'),h('E. Computador utilizado'),p('CPU: Intel Core i5-13400F, 13ª geração, 10 núcleos físicos e 16 processadores lógicos. RAM instalada: 16 GiB, um módulo, velocidade informada de 2.666 MHz. Fabricante do computador: ASUS; modelo informado pelo firmware: “System Product Name”. Placa-mãe: ASUSTeK PRIME H610M-E D4. Sistema: Windows 11 Pro, 64 bits, versão 10.0.26100.'),p('Dados coletados via PowerShell/CIM e preservados em doc-referencia/pc-utilizado.txt. A frequência de 2.500 MHz informada por Win32_Processor não representa o limite de turbo. Compilador: GCC 15.2.0 (MSYS2), linguagem C11, otimização -O2.',True),h('F. Testes adicionais'),p('Foram executados também os cenários de melhor e pior caso com 1.000.000 de elementos, além do teste aleatório obrigatório nesse tamanho. O conjunto final contém 2 algoritmos × 3 cenários × 9 tamanhos × 3 repetições = 162 medições.'),h('G. Conclusões dos experimentos')]
    for c in conclusions[:4]: story.append(p(c))
    story += [PageBreak(),title('Discussão e referências'),h('Limitações e questões para discussão')]
    for c in conclusions[4:]: story.append(p(c))
    story += [p('Três repetições fornecem uma descrição inicial da variação; não sustentam uma caracterização estatística ampla. Não foram controladas afinidade de CPU, frequência, cache, serviços do sistema ou paginação. A ordem alternada reduz um viés simples de ordem, mas não elimina interferências. A taxa de crescimento teórica não é comprovada apenas por uma curva de tempos.'),p('O uso de uint32_t permite comparar os algoritmos no mesmo domínio. Os resultados históricos de Bucket Sort com double foram preservados separadamente e não foram combinados com as novas médias, gráficos e conclusões comparativas. Os custos de memória são analisados teoricamente; não foi medido o pico real de RAM.'),p('Questões para a discussão em sala: como muda o resultado se K crescer muito além de n? O que ocorre ao reduzir a quantidade de baldes? E se os dados se concentrarem em poucos intervalos? Qual seria o efeito de substituir Insertion Sort por uma ordenação com pior caso O(n log n)?'),h('Referências bibliográficas'),p('[1] MORIN, Pat. <b>Open Data Structures (in C++)</b>. Edição 0.1Gβ. Capítulo 11, subseção 11.2.1, “Counting Sort”, p. 239-241; posições 253-255 do PDF. Disponível em: https://opendatastructures.org/ods-cpp.pdf. Acesso em: 22 out. 2026.',True),p('[2] KRAHETS e colaboradores. <b>Hello Algo</b>. Versão 1.3.0, edição em inglês com exemplos em C. Seção 11.8, “Bucket Sort”, p. 266-269; posições 273-276 do PDF. Discussão do pior caso: seção 11.11, p. 279, posição 286 do PDF. Disponível em: https://www.hello-algo.com/en/chapter_sorting/bucket_sort/. Acesso em: 22 out. 2026.',True),h('Arquivos que acompanham a entrega'),p('cod-implementacao/: fontes C, validação e roteiro de execução.<br/>db-resultados/comparacao_medicoes.csv: 162 medições individuais.<br/>db-resultados/comparacao_resultados.xlsx: planilha, resumos e gráficos.<br/>doc-referencia/: livros, enunciado e configuração do computador.<br/>doc-entrega/conclusoes.pdf: material para impressão e distribuição.<br/>web-apresentacao/: apresentação para dispositivos móveis.',True),p('Apresentação: https://greenbalding.github.io/CountingSort_BucketSort/',True)]
    build(OUT/'relatorio_final.pdf',story)
    # Markdown registra o conteúdo textual e todas as tabelas sem depender do PDF.
    md='\n\n'.join(narrative)+'\n\n## Tabelas de médias (segundos)\n'
    for scenario in ['aleatorio','melhor','pior']:
        md+=f'\n### {scenario}\n\n| n | Counting Sort | Bucket Sort |\n|---:|---:|---:|\n'
        for n in SIZES: md+=f'| {n} | {fmt(avg(ALGS[0],scenario,n))} | {fmt(avg(ALGS[1],scenario,n))} |\n'
    (OUT/'relatorio_final.md').write_text(md.replace('<br/>','\n'),encoding='utf-8')
    sheet=[title('Conclusões para discussão'),p('Counting Sort x Bucket Sort<br/>'+NAMES,True),p('Projeto e Análise de Algoritmos 1 | Experimentos de 22/10/2026',True)]
    for i,c in enumerate(conclusions,1): sheet.append(p(f'<b>{i}.</b> '+c))
    sheet += [h('Condições da comparação'),p('Inteiros uint32_t, faixa conhecida K = 10n, b = n baldes, Insertion Sort interno, mesmos vetores para os dois algoritmos. Três repetições por cenário e tamanho. Tempo da chamada completa de ordenação; geração e verificação excluídas. Intel Core i5-13400F, 16 GiB de RAM, Windows 11 Pro, GCC 15.2.0 com -O2.',True),p('Três repetições e uma máquina limitam a generalização; a escolha deve considerar distribuição, faixa das chaves, memória e algoritmo interno. Para discussão: o que muda se aumentarmos K ou substituirmos Insertion Sort?',True),p('Fundamentação: Morin, Open Data Structures, seção 11.2.1, p. 239-241; Krahets e colaboradores, Hello Algo 1.3.0, seção 11.8, p. 266-269, e p. 279. Dados: comparacao_medicoes.csv.',True)]
    build(OUT/'conclusoes.pdf',sheet)
    for name in ['relatorio_final.pdf','conclusoes.pdf']:
        reader=PdfReader(OUT/name)
        text='\n'.join(page.extract_text() for page in reader.pages)
        assert '\ufffd' not in text
        print(f'{name}: {len(reader.pages)} páginas, {len(text)} caracteres')


if __name__ == '__main__':
    main()
