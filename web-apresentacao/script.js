"use strict";

const $ = id => document.getElementById(id);
const slides = Array.from(document.querySelectorAll('.slide'));
const integer = value => value.toLocaleString('pt-BR', {maximumFractionDigits: 0});
const decimal = (value, digits = 3) => value.toLocaleString('pt-BR', {maximumFractionDigits: digits});
const menu = $('chapter-menu');
let current = 0;

function showSlide(index, focus = false, updateUrl = true) {
  current = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  $('previous').disabled = current === 0;
  $('next').disabled = current === slides.length - 1;
  $('current-slide').textContent = String(current + 1).padStart(2, '0');
  $('total-slides').textContent = String(slides.length).padStart(2, '0');
  $('slide-label').textContent = slides[current].dataset.label.toLocaleUpperCase('pt-BR');
  $('progress-fill').style.width = `${(current + 1) / slides.length * 100}%`;
  $('slide-status').textContent = `Tela ${current + 1} de ${slides.length}: ${slides[current].dataset.label}`;
  document.querySelectorAll('#chapter-links button').forEach(button => {
    if (button.dataset.go === slides[current].id) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  if (updateUrl && location.hash !== `#${slides[current].id}`) history.pushState(null, '', `#${slides[current].id}`);
  if (focus) {
    slides[current].querySelector('h1, h2').focus({preventScroll: true});
    window.scrollTo({top: 0, behavior: 'instant'});
  }
}
function go(id) {
  const index = slides.findIndex(slide => slide.id === id);
  if (index >= 0) showSlide(index, true);
}
function followHash() {
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
  showSlide(index < 0 ? 0 : index, false, false);
}
function pressed(selector, attribute, value) {
  document.querySelectorAll(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[attribute] === value)));
}
$('previous').addEventListener('click', () => showSlide(current - 1, true));
$('next').addEventListener('click', () => showSlide(current + 1, true));
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); go('inicio'); });
$('choose-bucket').addEventListener('click', () => go('analise'));
$('choose-counting').addEventListener('click', () => {
  const open = $('counting-note').hidden;
  $('counting-note').hidden = !open;
  $('choose-counting').setAttribute('aria-expanded', String(open));
});
$('chapter-links').replaceChildren(...slides.map(slide => {
  const button = document.createElement('button');
  button.dataset.go = slide.id;
  button.textContent = slide.dataset.label;
  return button;
}));
$('open-menu').addEventListener('click', () => menu.showModal());
$('close-menu').addEventListener('click', () => menu.close());
menu.addEventListener('click', event => { if (event.target === menu) { const rect = menu.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) menu.close(); } });
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => { if (menu.open) menu.close(); go(button.dataset.go); }));
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || menu.open || event.target.closest('input,select,textarea,button,a,summary,pre,[role="button"]')) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); showSlide(current + (event.key === 'ArrowRight' ? 1 : -1), true); }
});
window.addEventListener('popstate', followHash);
window.addEventListener('hashchange', followHash);

function drawTheory(scenario) {
  pressed('[data-theory]', 'theory', scenario);
  const worst = scenario === 'pior';
  $('complexity-value').textContent = worst ? 'Θ(n²)' : 'Θ(n)';
  $('complexity-name').textContent = worst ? 'crescimento quadrático' : 'crescimento linear';
  $('theory-buckets').replaceChildren(...Array.from({length: 8}, (_, index) => {
    const bucket = document.createElement('div');
    bucket.className = `theory-bin${worst && index === 0 ? ' crowded' : ''}`;
    const count = worst ? (index === 0 ? 8 : 0) : 1;
    bucket.setAttribute('aria-label', `Balde ${index + 1}: ${count} ${count === 1 ? 'elemento' : 'elementos'}`);
    bucket.innerHTML = '<span class="dot" aria-hidden="true"></span>'.repeat(count);
    return bucket;
  }));
  $('theory-explanation').textContent = worst ? 'Todos os valores distintos chegam em ordem decrescente ao mesmo balde. O Insertion Sort precisa deslocar os anteriores a cada inserção.' : 'Um elemento em cada balde. Inicializar, distribuir e reunir os valores responde pelo custo total.';
  $('theory-formula').textContent = worst ? '1 + 2 + … + (n − 1) = n(n − 1)/2 deslocamentos' : 'n elementos → trabalho proporcional a n';
}
document.querySelectorAll('[data-theory]').forEach(button => button.addEventListener('click', () => drawTheory(button.dataset.theory)));

const demoInputs = {exemplo: [.42,.15,.87,.33,.08,.71], melhor: [.7,.1,.9,.3,.5], pior: [.09,.08,.07,.06,.05,.04]};
let demoCase = 'exemplo', demoStep = 0;
function insertionSort(values) {
  const result = values.slice();
  for (let i = 1; i < result.length; i++) {
    const key = result[i]; let j = i;
    while (j > 0 && result[j - 1] > key) { result[j] = result[j - 1]; j--; }
    result[j] = key;
  }
  return result;
}
function chip(value, className = '') {
  const element = document.createElement('span');
  element.className = `number-chip ${className}`;
  element.textContent = value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  return element;
}
function drawDemo() {
  const input = demoInputs[demoCase], count = input.length;
  const buckets = Array.from({length: 5}, () => []);
  input.slice(0, Math.min(count, demoStep)).forEach(value => buckets[Math.min(4, Math.floor(value * 5))].push(value));
  if (demoStep > count) buckets.forEach((values, i) => { buckets[i] = insertionSort(values); });
  $('demo-input').replaceChildren(...input.map((value, i) => chip(value, i < demoStep ? 'processed' : (i === demoStep ? 'active' : ''))));
  $('demo-buckets').replaceChildren(...buckets.map((values, i) => {
    const row = document.createElement('div'); row.className = 'demo-bucket';
    const range = document.createElement('span'); range.className = 'bucket-range';
    range.textContent = `[${decimal(i / 5, 1)}; ${decimal((i + 1) / 5, 1)})`;
    const contents = document.createElement('div'); contents.className = 'bucket-content';
    contents.setAttribute('aria-label', `Balde ${i + 1}`);
    contents.replaceChildren(...values.map(value => chip(value)));
    row.append(range, contents); return row;
  }));
  const message = demoStep === 0 ? 'Toque abaixo para distribuir um número por vez.' : demoStep <= count ? `${chip(input[demoStep - 1]).textContent} foi para o balde ${Math.floor(input[demoStep - 1] * 5) + 1}. ${demoStep} de ${count} valores distribuídos.` : demoStep === count + 1 ? 'Cada balde foi ordenado com Insertion Sort. Agora podemos reunir os intervalos.' : 'Pronto: percorrer os baldes em ordem produz a saída crescente.';
  $('demo-message').textContent = message;
  $('demo-step').textContent = demoStep < count ? 'Distribuir próximo' : demoStep === count ? 'Ordenar baldes' : demoStep === count + 1 ? 'Reunir resultado' : 'Concluído ✓';
  $('demo-step').disabled = demoStep >= count + 2;
  $('demo-output').hidden = demoStep < count + 2;
  $('demo-output-values').replaceChildren(...buckets.flat().map(value => chip(value)));
}
$('demo-step').addEventListener('click', () => { demoStep++; drawDemo(); });
$('demo-reset').addEventListener('click', () => { demoStep = 0; drawDemo(); });
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => { demoCase = button.dataset.demo; demoStep = 0; pressed('[data-demo]', 'demo', demoCase); drawDemo(); }));

const codeNotes = {distribuir:'O índice identifica o intervalo do valor. A próxima posição livre desse balde recebe o elemento, preservando a ordem de chegada.', ordenar:'Cada trecho é ordenado separadamente. O laço while desloca os valores maiores que a chave: é aqui que o pior caso concentra o esforço.', medir:'O relógio é lido antes e depois da chamada completa ao Bucket Sort. A diferença é o tempo decorrido, em segundos.'};
function drawCode(key) {
  pressed('[data-code]', 'code', key);
  $('code-excerpt').textContent = EXPERIMENT_DATA.code[key];
  $('code-explanation').textContent = codeNotes[key];
  $('code-file').textContent = key === 'medir' ? 'benchmark.c' : 'bucket_sort.c';
}
document.querySelectorAll('[data-code]').forEach(button => button.addEventListener('click', () => drawCode(button.dataset.code)));

const records = EXPERIMENT_DATA.measurements;
const groups = Object.fromEntries(['aleatorio','melhor','pior'].map(scenario => [scenario,
  [...new Set(records.filter(row => row.scenario === scenario).map(row => row.n))].sort((a,b) => a-b).map(n => {
    const rows = records.filter(row => row.scenario === scenario && row.n === n);
    const values = rows.map(row => row.seconds).sort((a,b) => a-b);
    return {n, rows, mean: values.reduce((sum,value) => sum+value,0)/values.length, median: values[1]};
  })]));
function time(value) {
  const factor = value >= 1 ? 1 : value >= .001 ? 1000 : 1000000;
  return {value: decimal(value * factor), unit: factor === 1 ? 's' : factor === 1000 ? 'ms' : 'µs'};
}
function formattedTime(value) { const t = time(value); return `${t.value} ${t.unit}`; }
function shortN(n) { return n >= 1000000 ? '1 mi' : n >= 1000 ? `${decimal(n/1000,0)} mil` : String(n); }
let resultCase = 'melhor';
function fillSelect(id, scenario) {
  $(id).replaceChildren(...groups[scenario].map(group => {
    const option = document.createElement('option'); option.value = group.n; option.textContent = integer(group.n); return option;
  }));
  $(id).value = groups[scenario].at(-1).n;
}
function niceMax(value) { const power = 10 ** Math.floor(Math.log10(value || 1)); return [1,2,5,10].find(m => m*power >= value) * power; }
function drawChart(containerId, scenario, statistic, selectedN) {
  const data = groups[scenario], values = data.map(group => group[statistic]);
  const maxValue = Math.max(...values), factor = maxValue >= 1 ? 1 : maxValue >= .001 ? 1000 : 1000000;
  const unit = factor === 1 ? 's' : factor === 1000 ? 'ms' : 'µs';
  const max = niceMax(maxValue * factor), left = 46, right = 352, top = 26, bottom = 191;
  const point = (value, i) => [left + i/(data.length-1)*(right-left), bottom - value*factor/max*(bottom-top)];
  const grid = Array.from({length:5}, (_,i) => { const v=max*i/4,y=bottom-i/4*(bottom-top); return `<line class="grid" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text x="${left-7}" y="${y+4}" text-anchor="end">${decimal(v,2)}</text>`; }).join('');
  const ticks = [...new Set([0,2,4,data.length-1])].map(i => `<text x="${point(values[i],i)[0]}" y="212" text-anchor="middle">${shortN(data[i].n)}</text>`).join('');
  const points = data.map((group,i) => { const [x,y]=point(values[i],i); return `<g role="button" tabindex="0" data-point="${group.n}" aria-label="${integer(group.n)} elementos: ${formattedTime(group[statistic])}" aria-pressed="${group.n===selectedN}"><circle class="point ${group.n===selectedN?'selected':''}" cx="${x}" cy="${y}" r="${group.n===selectedN?6:4}"/><circle class="hit" cx="${x}" cy="${y}" r="17"/></g>`; }).join('');
  $(containerId).innerHTML = `<svg viewBox="0 0 375 245" role="group" aria-label="Tempo ${statistic==='mean'?'médio':'mediano'} por quantidade de elementos, em ${unit}"><text x="${left}" y="13">Tempo (${unit})</text>${grid}<polyline class="curve" points="${values.map((v,i)=>point(v,i).join(',')).join(' ')}"/>${ticks}${points}<text x="${(left+right)/2}" y="237" text-anchor="middle">Elementos · tamanhos testados</text></svg>`;
}
function drawResult(prefix, scenario) {
  const n = Number($(prefix === 'random' ? 'random-n' : 'cases-n').value);
  const statistic = $(`${prefix}-stat`).value;
  const group = groups[scenario].find(group => group.n === n);
  const t = time(group[statistic]);
  $(`${prefix}-value`).textContent = t.value; $(`${prefix}-unit`).textContent = t.unit;
  $(`${prefix}-caption`).textContent = `${statistic === 'mean' ? 'Média' : 'Mediana'} de 3 execuções · ${integer(n)} elementos`;
  $(`${prefix}-repetitions`).replaceChildren(...group.rows.map(row => {
    const div = document.createElement('div'); div.className = 'repetition';
    const label = document.createElement('span'); label.textContent = `Repetição ${row.repetition}`;
    const value = document.createElement('strong'); value.textContent = `${row.seconds.toLocaleString('pt-BR',{minimumFractionDigits:9,maximumFractionDigits:9})} s`;
    div.append(label,value); return div;
  }));
  drawChart(`${prefix}-chart`, scenario, statistic, n);
  if (prefix === 'cases') {
    const best = groups.melhor.find(row => row.n === n)[statistic], worst = groups.pior.find(row => row.n === n)[statistic];
    $('compare-best').textContent = formattedTime(best); $('compare-worst').textContent = formattedTime(worst);
    const ratio = worst/best;
    $('compare-ratio').textContent = ratio >= 1 ? `Nesta amostra, o pior caso levou ${decimal(ratio,1)}× o tempo do melhor caso.` : 'Nesta amostra pequena, o tempo do pior caso ficou abaixo do melhor. A variação da medição não altera a análise teórica.';
    $('cases-description').textContent = scenario === 'melhor' ? 'Um elemento por balde; a entrada foi embaralhada antes da ordenação.' : 'Valores distintos decrescentes, todos no primeiro balde. A faixa global permanece [0, 1).';
  }
}
['random-n','random-stat'].forEach(id => $(id).addEventListener('change',()=>drawResult('random','aleatorio')));
['cases-n','cases-stat'].forEach(id => $(id).addEventListener('change',()=>drawResult('cases',resultCase)));
document.querySelectorAll('[data-result-case]').forEach(button => button.addEventListener('click',()=>{resultCase=button.dataset.resultCase;pressed('[data-result-case]','resultCase',resultCase);drawResult('cases',resultCase);}));
for (const prefix of ['random','cases']) {
  const selectPoint = (event) => {
    const target = event.target.closest('[data-point]');
    if (!target || (event.type==='keydown' && !['Enter',' '].includes(event.key))) return;
    event.preventDefault();
    $(`${prefix}-n`).value = target.dataset.point;
    drawResult(prefix,prefix==='random'?'aleatorio':resultCase);
    if (event.type==='keydown') $(`${prefix}-chart`).querySelector(`[data-point="${target.dataset.point}"]`).focus();
  };
  $(`${prefix}-chart`).addEventListener('click',selectPoint);
  $(`${prefix}-chart`).addEventListener('keydown',selectPoint);
}
function drawGrowth(n) {
  pressed('[data-growth]','growth',String(n));
  $('growth-value').textContent = integer(n*(n-1)/2);
  $('growth-note').textContent = n===500000 ? 'Este tamanho foi medido no pior caso.' : 'Dobrar de 500 mil para 1 milhão aproxima o trabalho de quatro vezes o original. Esse teste opcional não foi executado.';
}
document.querySelectorAll('[data-growth]').forEach(button=>button.addEventListener('click',()=>drawGrowth(Number(button.dataset.growth))));
document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
  pressed('[data-answer]','answer',button.dataset.answer);
  $('quiz-feedback').textContent = button.dataset.answer==='depende' ? 'Isso! A ordem também importa. Valores crescentes no mesmo balde exigem pouco esforço do Insertion Sort; valores distintos decrescentes produzem o pior caso.' : 'Falta uma condição: a ordem. Se os valores já chegam crescentes, o Insertion Sort tem custo linear mesmo com todos no mesmo balde.';
}));
$('print-conclusions').addEventListener('click',()=>window.print());

drawTheory('melhor'); drawDemo(); drawCode('distribuir');
fillSelect('random-n','aleatorio'); fillSelect('cases-n','melhor');
drawResult('random','aleatorio'); drawResult('cases','melhor'); drawGrowth(500000);
$('conclusion-best').textContent = formattedTime(groups.melhor.at(-1).mean);
$('conclusion-worst').textContent = formattedTime(groups.pior.at(-1).mean);
followHash();
