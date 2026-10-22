/** Gera dados verificáveis e trechos reais de C para a apresentação. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>(await fs.readFile(path.join(root,p),'utf8')).replace(/\r\n/g,'\n');
const csv=await read('db-resultados/comparacao_medicoes.csv');
const [header,...lines]=csv.trim().split('\n');
if(header!=='algoritmo;cenario;n;faixa;baldes;repeticao;semente;tempo_segundos;ordenado;permutacao_correta')throw Error('Cabeçalho inesperado.');
const names=['counting_sort','bucket_sort_insertion_int'], scenarios=['aleatorio','melhor','pior'],sizes=[10,100,1000,5000,10000,50000,100000,500000,1000000];
const measurements=lines.map(line=>{const [algorithm,scenario,n,range,buckets,repetition,seed,seconds,sorted,permutation]=line.split(';');if(!names.includes(algorithm)||!scenarios.includes(scenario)||sorted!=='1'||permutation!=='1')throw Error('Medição inválida.');return {algorithm,scenario,n:Number(n),range:Number(range),buckets:Number(buckets),repetition:Number(repetition),seed:Number(seed),seconds:Number(seconds)};});
if(measurements.length!==162)throw Error('Esperadas 162 medições completas.');
for(const name of names)for(const scenario of scenarios)for(const n of sizes){const rows=measurements.filter(r=>r.algorithm===name&&r.scenario===scenario&&r.n===n);if(rows.length!==3||new Set(rows.map(r=>r.repetition)).size!==3||rows.some(r=>![1,2,3].includes(r.repetition)||!Number.isFinite(r.seconds)||r.seconds<=0||r.range!==10*n||r.buckets!==(name==='counting_sort'?0:n)))throw Error(`Grupo inválido: ${name}/${scenario}/${n}`);for(const row of rows){const pair=measurements.find(r=>r.algorithm!==name&&r.scenario===scenario&&r.n===n&&r.repetition===row.repetition);if(!pair||pair.seed!==row.seed)throw Error('Entradas não pareadas.');}}
const counting=await read('cod-implementacao/counting_sort.c'),bucket=await read('cod-implementacao/bucket_sort_int.c'),benchmark=await read('cod-implementacao/benchmark_comparacao.c');
function excerpt(source,from,to){const start=source.indexOf(from),end=source.indexOf(to,start);if(start<0||end<0)throw Error('Trecho não encontrado: '+from);const lines=source.slice(start,end).trimEnd().split('\n');const indent=Math.min(...lines.slice(1).filter(l=>l.trim()).map(l=>l.match(/^ */)[0].length));return lines.map((l,i)=>i?l.slice(indent):l).join('\n');}
const timing=excerpt(benchmark,'                double inicio = agora();','\n                int ordenado');
const data={source:'db-resultados/comparacao_medicoes.csv',measurements,code:{counting_sort:{distribuir:excerpt(counting,'for (size_t i = 0; i < n; ++i) {','    /* 2.'),ordenar:excerpt(counting,'for (size_t chave = 1;','    memcpy(valores'),medir:timing},bucket_sort_insertion_int:{distribuir:excerpt(bucket,'for (size_t i = 0; i < n; ++i) {\n        size_t b = indice_balde','    /* Insertion Sort'),ordenar:excerpt(bucket,'for (size_t b = 0; b < k; ++b) {\n        for (size_t i = inicio[b] + 1;','    memcpy(valores'),medir:timing}}};
await fs.writeFile(path.join(root,'web-apresentacao/dados.js'),'// Gerado de medições verificadas e fontes em C.\nconst EXPERIMENT_DATA = '+JSON.stringify(data)+';\n','utf8');
console.log('Apresentação: 162 medições pareadas verificadas e trechos reais de C.');
