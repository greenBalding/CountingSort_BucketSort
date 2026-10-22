/** Gera a planilha a partir das medições reais do benchmark em C.
 * Uso: node cod-implementacao/gerar_planilha.mjs [arquivo.csv]
 * Requer @oai/artifact-tool no runtime do Codex ou ARTIFACT_NODE_MODULES.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(process.argv[2] || path.join(root, 'db-resultados/bucket_sort_medicoes.csv'));
const outputDir = path.join(root, 'db-resultados');
const modules = process.env.ARTIFACT_NODE_MODULES || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'bucket-sort-planilha-'));
await fs.symlink(modules, path.join(temporary, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
const requireRuntime = createRequire(path.join(temporary, 'package.json'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(requireRuntime.resolve('@oai/artifact-tool')).href);

// O benchmark gera campos simples sem aspas, delimitados por ponto e vírgula.
const lines = (await fs.readFile(input, 'utf8')).replace(/^\uFEFF/, '').trim().split(/\r?\n/);
const expected = ['algoritmo', 'cenario', 'n', 'baldes', 'repeticao', 'semente', 'tempo_segundos', 'ordenado', 'permutacao_correta'];
if (lines.shift() !== expected.join(';')) throw Error('Cabeçalho CSV diferente do contrato esperado.');
const rows = lines.map((line, index) => {
  const fields = line.split(';');
  if (fields.length !== expected.length) throw Error(`Linha CSV ${index + 2} inválida.`);
  const row = fields.map((v, i) => i < 2 ? v : Number(v));
  if (row.slice(2).some(v => !Number.isFinite(v)) || row[6] < 0) throw Error(`Número inválido na linha ${index + 2}.`);
  if (row[7] !== 1 || row[8] !== 1) throw Error(`Verificação de ordenação/permutação falhou na linha ${index + 2}.`);
  return row;
});
if (!rows.length) throw Error('Nenhuma medição disponível.');
const scenarios = [...new Set(rows.map(r => r[1]))];
if (scenarios.length !== 3) throw Error(`Esperados três cenários; encontrados: ${scenarios.join(', ')}.`);
const findScenario = fragment => scenarios.find(s => s.toLowerCase().includes(fragment));
const cases = [
  { key: findScenario('aleat'), label: 'Entradas aleatórias', start: 5, color: '#2563EB', count: 9 },
  { key: findScenario('melhor'), label: 'Melhor caso', start: 23, color: '#15803D', count: 8 },
  { key: findScenario('pior'), label: 'Pior caso', start: 41, color: '#B45309', count: 8 },
];
if (cases.some(c => !c.key)) throw Error('Use cenários aleatorio, melhor e pior.');
const sizes = [10, 100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
const workbook = Workbook.create();
const summary = workbook.worksheets.add('Resumo');
const raw = workbook.worksheets.add('Medições');
summary.tabColor = '#1E3A5F';
for (const sheet of [summary, raw]) sheet.showGridLines = false;
summary.getRange('A1:R65').format.font = { name: 'Arial', size: 10, color: '#172033' };
summary.getRange('A1:R65').format.columnWidth = 15;
summary.getRange('A2').values = [['Bucket Sort — resultados experimentais']];
summary.getRange('A2').format.font = { name: 'Arial', size: 15, bold: true };
summary.getRange('A3').values = [['Tempo de ordenação em segundos; três repetições por tamanho e cenário.']];
summary.getRange('A3').format.font.italic = true;
raw.getRange('A1:I1').values = [['Fonte: ' + path.basename(input), null, null, null, null, null, null, null, null]];
raw.getRange('A2').values = [['Cada linha representa uma execução real. 1 = verificação satisfeita.']];
raw.getRange('A4:I4').values = [expected];
raw.getRange(`A5:I${rows.length + 4}`).values = rows;
raw.getRange(`A4:I${rows.length + 4}`).format.font = { name: 'Arial', size: 10, color: '#172033' };
raw.getRange(`A4:I${rows.length + 4}`).format.rowHeight = 21;
raw.getRange('A4:I4').format = { fill: '#1E3A5F', font: { name: 'Arial', size: 10, color: '#FFFFFF', bold: true }, wrapText: true, rowHeight: 32 };
raw.getRange('A4:I4').format.horizontalAlignment = 'center';
raw.getRange('A:I').format.columnWidth = 19;
raw.getRange('G:G').format.columnWidth = 24;
raw.getRange('I:I').format.columnWidth = 26;
raw.getRange(`C5:F${rows.length + 4}`).setNumberFormat('#,##0');
raw.getRange(`G5:G${rows.length + 4}`).setNumberFormat('0.000000E+00');
raw.freezePanes.freezeRows(4);
const sourceRows = rows.map((r, i) => ({ row: r, excelRow: i + 5 }));
const independent = [];
for (const c of cases) {
  const titleRow = c.start;
  const headerRow = c.start + 1;
  summary.getRange(`A${titleRow}`).values = [[c.label]];
  summary.getRange(`A${titleRow}`).format.font.bold = true;
  summary.getRange(`A${headerRow}:F${headerRow}`).values = [['Elementos (n)', 'Média (s)', 'Mediana (s)', 'Mínimo (s)', 'Máximo (s)', 'Repetições']];
  summary.getRange(`A${headerRow}:F${headerRow}`).format = { fill: '#1E3A5F', font: { name: 'Arial', size: 10, color: '#FFFFFF', bold: true }, rowHeight: 26, horizontalAlignment: 'center' };
  const ns = sizes.slice(0, c.count);
  for (let i = 0; i < ns.length; i++) {
    const n = ns[i];
    const matching = sourceRows.filter(x => x.row[1] === c.key && x.row[2] === n);
    if (matching.length !== 3) throw Error(`Esperadas três medições: ${c.key}, n=${n}; recebidas ${matching.length}.`);
    const destination = headerRow + i + 1;
    const refs = matching.map(x => `'Medições'!G${x.excelRow}`).join(',');
    summary.getRange(`A${destination}`).values = [[n]];
    summary.getRange(`B${destination}:F${destination}`).formulas = [[`=AVERAGE(${refs})`, `=MEDIAN(${refs})`, `=MIN(${refs})`, `=MAX(${refs})`, `=COUNT(${refs})`]];
    const values = matching.map(x => x.row[6]).sort((a, b) => a - b);
    independent.push({ row: destination, expected: [values.reduce((a, b) => a + b, 0) / values.length, values[1], values[0], values[2], 3] });
  }
  const first = headerRow + 1, last = headerRow + ns.length;
  summary.getRange(`A${first}:A${last}`).setNumberFormat('#,##0');
  summary.getRange(`B${first}:E${last}`).setNumberFormat('0.000000E+00');
  summary.getRange(`F${first}:F${last}`).setNumberFormat('0');
  summary.getRange(`A${first}:F${last}`).format.rowHeight = 23;
  const chart = summary.charts.add('line', summary.getRange(`A${headerRow}:B${last}`));
  chart.title = `${c.label}: tempo médio (s)`;
  chart.titleTextStyle.typeface = 'Arial';
  chart.titleTextStyle.fontSize = 13;
  chart.hasLegend = false;
  chart.xAxis = { axisType: 'textAxis', textStyle: { typeface: 'Arial', fontSize: 10 } };
  chart.yAxis = { numberFormatCode: '0.000000', numberFormatSourceLinked: false, textStyle: { typeface: 'Arial', fontSize: 10 } };
  chart.xAxis.title.text = 'Quantidade de elementos (n)';
  chart.yAxis.title.text = 'Tempo médio (s)';
  chart.series.items[0].line = { fill: c.color, style: 'solid', width: 2 };
  chart.setPosition(`H${titleRow}`, `R${titleRow + 15}`);
}
summary.getRange('A59').values = [['Gráficos de linhas com eixo horizontal por categorias, na ordem crescente de n.']];
summary.getRange('A59').format.font.italic = true;
summary.getRange('A61:A65').values = [
  ['Implementação: n baldes, valores em [0,1) e Insertion Sort dentro de cada balde.'],
  ['Medição: QueryPerformanceCounter; inclui alocações, distribuição, ordenação interna, reunião e liberações.'],
  ['Geração das entradas e verificações de ordenação e permutação não integram o tempo medido.'],
  ['Melhor caso: um elemento por balde. Pior caso: elementos distintos decrescentes, todos no primeiro balde.'],
  ['Entradas aleatórias: SplitMix64; sementes e verificações preservadas na aba Medições.'],
];
// Verifica a atualização das fórmulas ao alterar uma observação e restaura o dado.
const testCase = cases.find(c => c.key === rows[0][1]);
const testRow = testCase.start + 2 + sizes.indexOf(rows[0][2]);
const originalTime = rows[0][6];
const originalMean = summary.getRange(`B${testRow}`).values[0][0];
raw.getRange('G5').values = [[originalTime + 1]];
const changedMean = summary.getRange(`B${testRow}`).values[0][0];
raw.getRange('G5').values = [[originalTime]];
if (Math.abs(changedMean - originalMean - 1 / 3) > 1e-9) throw Error('A média não atualizou com a alteração da fonte.');
workbook.recalculate();
for (const check of independent) {
  const actual = summary.getRange(`B${check.row}:F${check.row}`).values[0];
  actual.forEach((v, i) => {
    if (typeof v !== 'number' || Math.abs(v - check.expected[i]) > Math.max(1e-12, Math.abs(check.expected[i]) * 1e-10)) throw Error(`Resultado divergente em linha ${check.row}, coluna ${i + 2}: ${v}.`);
  });
}
console.log((await workbook.inspect({ kind: 'table', range: 'Resumo!A6:F15', include: 'values,formulas', tableMaxRows: 10, tableMaxCols: 6, maxChars: 3500 })).ndjson);
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 50 }, summary: 'Erros de fórmulas' });
console.log(errors.ndjson);
const previewDir = path.join(temporary, 'previas');
await fs.mkdir(previewDir);
for (const [name, range, file] of [['Resumo', 'A1:R21', 'aleatorio'], ['Resumo', 'A23:R39', 'melhor'], ['Resumo', 'A41:R65', 'pior'], ['Medições', 'A1:I16', 'medicoes']]) {
  const rendered = await workbook.render({ sheetName: name, range, scale: 1.4, format: 'png' });
  await fs.writeFile(path.join(previewDir, file + '.png'), new Uint8Array(await rendered.arrayBuffer()));
}
await fs.mkdir(outputDir, { recursive: true });
await (await SpreadsheetFile.exportXlsx(workbook)).save(path.join(outputDir, 'bucket_sort_resultados.xlsx'));
await fs.rm(path.join(outputDir, 'bucket_sort_resultados.xlsx.inspect.ndjson'), { force: true });
console.log(JSON.stringify({ output: path.join(outputDir, 'bucket_sort_resultados.xlsx'), previews: previewDir, measurements: rows.length, groups: independent.length, charts: summary.charts.items.length }));
