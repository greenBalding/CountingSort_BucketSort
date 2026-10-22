/** Atualiza os dados da apresentação a partir das medições e dos fontes em C. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csv = await fs.readFile(path.join(root, 'db-resultados/bucket_sort_medicoes.csv'), 'utf8');
const [header, ...lines] = csv.trim().split(/\r?\n/);
if (header !== 'algoritmo;cenario;n;baldes;repeticao;semente;tempo_segundos;ordenado;permutacao_correta') throw Error('Cabeçalho de medições inesperado.');
const measurements = lines.map(line => {
  const [algorithm, scenario, n, buckets, repetition, seed, seconds, sorted, permutation] = line.split(';');
  if (algorithm !== 'bucket_sort_insertion' || sorted !== '1' || permutation !== '1') throw Error('Medição não validada.');
  return { scenario, n: Number(n), buckets: Number(buckets), repetition: Number(repetition), seed: Number(seed), seconds: Number(seconds) };
});
const sizes = [10,100,1000,5000,10000,50000,100000,500000,1000000];
if (measurements.length !== 75) throw Error('Esperadas 75 medições.');
for (const scenario of ['aleatorio', 'melhor', 'pior']) {
  for (const n of sizes.slice(0, scenario === 'aleatorio' ? 9 : 8)) {
    const group = measurements.filter(row => row.scenario === scenario && row.n === n);
    if (group.length !== 3 || new Set(group.map(r => r.repetition)).size !== 3 || group.some(r => !Number.isFinite(r.seconds) || r.seconds < 0 || r.buckets !== n)) throw Error(`Grupo inválido: ${scenario}/${n}`);
  }
}
const core = await fs.readFile(path.join(root, 'cod-implementacao/bucket_sort.c'), 'utf8');
const benchmark = await fs.readFile(path.join(root, 'cod-implementacao/benchmark.c'), 'utf8');
function excerpt(source, from, to) {
  const start = source.indexOf(from), end = source.indexOf(to, start);
  if (start < 0 || end < 0) throw Error('Trecho de código não encontrado.');
  const text = source.slice(start, end).trimEnd();
  const lines = text.split('\n');
  const indent = Math.min(...lines.filter(line => line.trim()).slice(1).map(line => line.match(/^\s*/)[0].length));
  return lines.map((line, i) => i ? line.slice(indent) : line).join('\n');
}
const data = {
  date: '22/10/2026',
  source: 'db-resultados/bucket_sort_medicoes.csv',
  measurements,
  code: {
    distribuir: excerpt(core, 'for (size_t i = 0; i < n; ++i) {\n        size_t b = indice_balde', '\n\n    /* 3.'),
    ordenar: excerpt(core, 'for (size_t b = 0; b < k; ++b) {\n        for (size_t i = inicio[b] + 1;', '\n\n    /* 4.'),
    medir: excerpt(benchmark, 'double inicio = agora();\n                int resultado = bucket_sort(v, n, n);', '\n\n                int ordenado'),
  },
};
await fs.writeFile(path.join(root, 'web-apresentacao/dados.js'), `// Gerado por cod-implementacao/preparar-apresentacao.mjs; fonte: CSV de medições.\nconst EXPERIMENT_DATA = ${JSON.stringify(data)};\n`, 'utf8');
console.log('Apresentação atualizada: 75 medições verificadas e trechos extraídos do código em C.');
