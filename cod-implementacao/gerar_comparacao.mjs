/** Gera a comparação em Excel usando as medições reais do benchmark em C.
 * Uso: node cod-implementacao/gerar_comparacao.mjs [arquivo.csv]
 * Requer @oai/artifact-tool no runtime do Codex ou ARTIFACT_NODE_MODULES.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(process.argv[2] || path.join(root, 'db-resultados/comparacao_medicoes.csv'));
const modules = process.env.ARTIFACT_NODE_MODULES || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'comparacao-planilha-'));
await fs.symlink(modules, path.join(temporary, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
const requireRuntime = createRequire(path.join(temporary, 'package.json'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(requireRuntime.resolve('@oai/artifact-tool')).href);

// Contrato do benchmark: campos simples, sem aspas, separados por ponto e vírgula.
const headers = ['algoritmo','cenario','n','faixa','baldes','repeticao','semente','tempo_segundos','ordenado','permutacao_correta'];
const lines = (await fs.readFile(input, 'utf8')).replace(/^\uFEFF/, '').trim().split(/\r?\n/);
if (lines.shift() !== headers.join(';')) throw Error('Cabeçalho CSV diferente do contrato esperado.');
const rows = lines.map((line, i) => {
  const fields = line.split(';');
  if (fields.length !== headers.length) throw Error(`Linha CSV ${i + 2} inválida.`);
  const row = fields.map((v, j) => j < 2 ? v : Number(v));
  if (row.slice(2).some(v => !Number.isFinite(v)) || row[7] < 0 || row[8] !== 1 || row[9] !== 1) throw Error(`Medição ou validação inválida na linha ${i + 2}.`);
  return row;
});
const sizes = [10,100,1000,5000,10000,50000,100000,500000,1000000];
const algorithms = ['counting_sort', 'bucket_sort_insertion_int'];
const algorithmNames = ['Counting Sort', 'Bucket Sort'];
const scenarios = ['aleatorio','melhor','pior'];
const names = ['Entradas aleatórias','Melhor caso do Bucket Sort','Pior caso do Bucket Sort'];
if (rows.length !== 162) throw Error(`Esperadas 162 medições; recebidas ${rows.length}.`);
rows.forEach(r => {
  if (!algorithms.includes(r[0]) || !scenarios.includes(r[1]) || !sizes.includes(r[2]) || r[3] !== 10 * r[2] || r[4] !== (r[0] === algorithms[0] ? 0 : r[2])) throw Error('Algoritmo, cenário, tamanho ou parâmetros inesperados.');
});
const wb = Workbook.create();
const summary = wb.worksheets.add('Comparação');
const stats = wb.worksheets.add('Estatísticas');
const raw = wb.worksheets.add('Medições');
for (const s of [summary, stats, raw]) s.showGridLines = false;
summary.tabColor = '#1E3A5F';
const ink = '#172033', navy = '#1E3A5F', blue = '#2563EB', orange = '#B45309';
const font = { name:'Arial', size:10, color:ink };
function heading(sheet, range, labels) {
  sheet.getRange(range).values = [labels];
  sheet.getRange(range).format = { fill:navy, font:{...font,color:'#FFFFFF',bold:true}, horizontalAlignment:'center', verticalAlignment:'center', wrapText:true, rowHeight:34 };
}
summary.getRange('A1:O65').format.font = font;
summary.getRange('A1:O65').format.columnWidth = 13;
summary.getRange('A:A').format.columnWidth = 17;
summary.getRange('B:C').format.columnWidth = 23;
summary.getRange('D:D').format.columnWidth = 3;
summary.getRange('A2').values = [['Counting Sort e Bucket Sort']];
summary.getRange('A2').format.font = {...font,size:15,bold:true};
summary.getRange('A3').values = [['Tempos médios em segundos. Mesmas entradas, três repetições e ordem de execução alternada.']];
summary.getRange('A3').format.font.italic = true;

stats.getRange('A1:I59').format.font = font;
stats.getRange('A:I').format.columnWidth = 19;
stats.getRange('A:A').format.columnWidth = 20;
stats.getRange('B:B').format.columnWidth = 16;
stats.getRange('C:C').format.columnWidth = 15;
stats.getRange('I:I').format.columnWidth = 15;
stats.getRange('A2').values = [['Estatísticas dos tempos de ordenação']];
stats.getRange('A2').format.font = {...font,size:15,bold:true};
heading(stats,'A4:I4',['Algoritmo','Cenário','Elementos (n)','Média (s)','Mediana (s)','Mínimo (s)','Máximo (s)','Desvio padrão (s)','Repetições']);
stats.freezePanes.freezeRows(4);

raw.getRange(`A1:J${rows.length+4}`).format.font = font;
raw.getRange('A:J').format.columnWidth = 19;
raw.getRange('A:A').format.columnWidth = 31;
raw.getRange('H:H').format.columnWidth = 23;
raw.getRange('J:J').format.columnWidth = 27;
raw.getRange('A1').values = [['Fonte: ' + path.basename(input)]];
raw.getRange('A2').values = [['Uma execução por linha. Validação: 1 = satisfeita. Tempos medidos em C com QueryPerformanceCounter.']];
heading(raw,'A4:J4',headers);
raw.getRange(`A5:J${rows.length+4}`).values = rows;
raw.getRange(`A5:J${rows.length+4}`).format.rowHeight = 22;
raw.getRange(`C5:G${rows.length+4}`).setNumberFormat('#,##0');
raw.getRange(`H5:H${rows.length+4}`).setNumberFormat('0.000000E+00');
raw.freezePanes.freezeRows(4);

const independent = [], statRows = new Map();
let dest = 5;
for (const scenario of scenarios) for (const n of sizes) for (const [a, algorithm] of algorithms.entries()) {
  const matches = rows.map((r,i)=>({r,excel:i+5})).filter(x=>x.r[0]===algorithm && x.r[1]===scenario && x.r[2]===n);
  if (matches.length !== 3 || new Set(matches.map(x=>x.r[5])).size !== 3) throw Error(`Repetições inválidas: ${algorithm}/${scenario}/${n}.`);
  const peer = rows.filter(r=>r[0]!==algorithm && r[1]===scenario && r[2]===n);
  if (matches.some(x=>!peer.some(r=>r[5]===x.r[5] && r[6]===x.r[6]))) throw Error('Sementes distintas entre algoritmos.');
  stats.getRange(`A${dest}:C${dest}`).values = [[algorithmNames[a],scenario,n]];
  const refs = matches.map(x=>`'Medições'!H${x.excel}`).join(',');
  stats.getRange(`D${dest}:I${dest}`).formulas = [[`=AVERAGE(${refs})`,`=MEDIAN(${refs})`,`=MIN(${refs})`,`=MAX(${refs})`,`=STDEV(${refs})`,`=COUNT(${refs})`]];
  const values = matches.map(x=>x.r[7]).sort((a,b)=>a-b);
  const mean = values.reduce((a,b)=>a+b,0)/3;
  independent.push({row:dest, expected:[mean,values[1],values[0],values[2],Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/2),3]});
  statRows.set(`${algorithm}/${scenario}/${n}`,dest++);
}
stats.getRange('C5:C58').setNumberFormat('#,##0');
stats.getRange('D5:H58').setNumberFormat('0.000000E+00');
stats.getRange('I5:I58').setNumberFormat('0');
stats.getRange('A5:I58').format.rowHeight = 22;

for (const [i,scenario] of scenarios.entries()) {
  const top = 6 + i * 19, head = top + 1;
  summary.getRange(`A${top}`).values = [[names[i]]];
  summary.getRange(`A${top}`).format.font.bold = true;
  heading(summary,`A${head}:C${head}`,['Elementos (n)','Counting Sort (s)','Bucket Sort (s)']);
  for (const [j,n] of sizes.entries()) {
    const row = head+j+1;
    summary.getRange(`A${row}`).values = [[n]];
    summary.getRange(`B${row}:C${row}`).formulas = [algorithms.map(a=>`='Estatísticas'!D${statRows.get(`${a}/${scenario}/${n}`)}`)];
  }
  summary.getRange(`A${head+1}:A${head+9}`).setNumberFormat('#,##0');
  summary.getRange(`B${head+1}:C${head+9}`).setNumberFormat('0.000000E+00');
  summary.getRange(`A${head+1}:C${head+9}`).format.rowHeight = 25;
  const chart = summary.charts.add('line',summary.getRange(`A${head}:C${head+9}`));
  chart.title = names[i] + ': tempo médio (s)';
  chart.titleTextStyle.typeface = 'Arial';
  chart.titleTextStyle.fontSize = 13;
  chart.legend = { position:'top',textStyle:{typeface:'Arial',fontSize:11} };
  chart.xAxis = {axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:10}};
  chart.yAxis = {numberFormatCode:i===2?'0.0':'0.000',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:10}};
  chart.xAxis.title.text = 'Elementos (n), categorias em ordem crescente';
  chart.yAxis.title.text = 'Tempo médio (s)';
  if(chart.series.items.length!==2) throw Error('Gráfico sem duas séries.');
  chart.series.items.forEach((s,j)=>s.line={fill:j===0?blue:orange,style:'solid',width:2});
  chart.setPosition(`E${top}`,`O${top+15}`);
  summary.getRange(`A${top+16}`).values = [[i===0?'Inteiros uniformes em [0, K). K = 10n e n baldes.':i===1?'Um valor por balde. Counting Sort mantém Θ(n + K).':'Metade de valores 1, seguida de valores 0: todos no balde 0.']];
  summary.getRange(`A${top+17}`).values = [[i===2?'Insertion Sort realiza floor(n²/4) deslocamentos.':'Com K fixado em 10n, a ordem da entrada não altera a classe Θ do Counting Sort.']];
  summary.getRange(`A${top+16}:C${top+17}`).format.font.italic = true;
}
summary.getRange('A63').values = [['1 milhão no melhor e no pior caso: testes adicionais do item F. Escalas verticais ajustadas a cada cenário.']];
summary.getRange('A64').values = [['Medição inclui alocação e liberação internas. Geração, cópia da entrada e validação ficam fora do tempo.']];
summary.getRange('A65').values = [['O eixo horizontal é categórico; a distância entre pontos não representa a diferença numérica entre tamanhos.']];

// Verifica dependências e restaura a observação original antes da exportação.
const first = rows[0];
const stat = statRows.get(`${first[0]}/${first[1]}/${first[2]}`);
const originalMean = stats.getRange(`D${stat}`).values[0][0];
raw.getRange('H5').values = [[first[7]+1]];
const changed = stats.getRange(`D${stat}`).values[0][0];
raw.getRange('H5').values = [[first[7]]];
if (Math.abs(changed-originalMean-1/3)>1e-9) throw Error('As fórmulas não atualizaram após alterar a fonte.');
wb.recalculate();
for (const check of independent) stats.getRange(`D${check.row}:I${check.row}`).values[0].forEach((v,i)=>{
  if(typeof v!=='number'||Math.abs(v-check.expected[i])>Math.max(1e-12,Math.abs(check.expected[i])*1e-9)) throw Error(`Estatística divergente: linha ${check.row}, coluna ${i+4}.`);
});
const errors = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:50},summary:'Erros de fórmulas',maxChars:2000});
console.log(errors.ndjson);
console.log((await wb.inspect({kind:'table',range:'Estatísticas!A5:I7',include:'values,formulas',tableMaxRows:3,tableMaxCols:9,maxChars:3000})).ndjson);
await fs.mkdir(path.join(temporary,'previas'));
for(const [name,range,file] of [['Comparação','A1:O23','aleatorio'],['Comparação','A25:O42','melhor'],['Comparação','A44:O65','pior'],['Estatísticas','A1:I16','estatisticas'],['Medições','A1:J15','medicoes']]) {
  const png = await wb.render({sheetName:name,range,scale:1.2,format:'png'});
  await fs.writeFile(path.join(temporary,'previas',file+'.png'),new Uint8Array(await png.arrayBuffer()));
}
const output = path.join(root,'db-resultados/comparacao_resultados.xlsx');
await (await SpreadsheetFile.exportXlsx(wb)).save(output);
await fs.rm(output+'.inspect.ndjson',{force:true});
console.log(JSON.stringify({output,previews:path.join(temporary,'previas'),measurements:rows.length,groups:independent.length,charts:summary.charts.items.length}));
