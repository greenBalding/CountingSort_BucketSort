"use strict";

const $ = id => document.getElementById(id);
const slides = Array.from(document.querySelectorAll('.slide'));
const integer = value => value.toLocaleString('pt-BR', {maximumFractionDigits: 0});
const decimal = (value, digits = 3) => value.toLocaleString('pt-BR', {maximumFractionDigits: digits});
const menu = $('chapter-menu');
let current = 0;
let algorithm = new URLSearchParams(location.search).get('algoritmo') === 'counting_sort' ? 'counting_sort' : 'bucket_sort_insertion_int';
const isCounting = () => algorithm === 'counting_sort';
const algorithmName = () => isCounting() ? 'Counting Sort' : 'Bucket Sort';
let groups;

function showSlide(index, focus = false, updateUrl = true) {
  current = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  $('algorithm-switch').hidden = current < 2 || current > 8;
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
  const requested = new URLSearchParams(location.search).get('algoritmo') === 'counting_sort' ? 'counting_sort' : 'bucket_sort_insertion_int';
  if (requested !== algorithm) selectAlgorithm(requested);
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
  showSlide(index < 0 ? 0 : index, false, false);
}
function pressed(selector, attribute, value) {
  document.querySelectorAll(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[attribute] === value)));
}
$('previous').addEventListener('click', () => showSlide(current - 1, true));
$('next').addEventListener('click', () => showSlide(current + 1, true));
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); go('inicio'); });
$('choose-bucket').addEventListener('click', () => { selectAlgorithm('bucket_sort_insertion_int'); go('analise'); });
$('choose-counting').addEventListener('click', () => { selectAlgorithm('counting_sort'); go('analise'); });
$('active-algorithm').addEventListener('change', () => selectAlgorithm($('active-algorithm').value));
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
  const worst = scenario === 'pior', counting = isCounting();
  $('theory-intro').textContent = counting ? 'Counting Sort estável, com contagens acumuladas e vetor auxiliar. n é a quantidade de elementos; K é a quantidade de chaves possíveis.' : 'Bucket Sort com n baldes por intervalos e Insertion Sort em cada balde. Nesta implementação, K = 10n e cada balde cobre dez chaves.';
  $('complexity-value').textContent = counting ? 'Θ(n + K)' : worst ? 'Θ(n²)' : 'Θ(n)';
  $('complexity-name').textContent = counting ? 'mesmo custo nos dois casos' : worst ? 'crescimento quadrático' : 'crescimento linear';
  $('theory-buckets').replaceChildren(...Array.from({length: 8}, (_, index) => {
    const bucket = document.createElement('div'); bucket.className = `theory-bin${worst && !counting && index === 0 ? ' crowded' : ''}`;
    const count = counting ? 1 : worst ? (index === 0 ? 8 : 0) : 1;
    bucket.setAttribute('aria-label', counting ? `Posição ${index} do vetor de contagem` : `Balde ${index}: ${count} elementos`);
    if (counting) bucket.textContent = index === 0 || index === 1 ? '4' : '0';
    else bucket.innerHTML = '<span class="dot" aria-hidden="true"></span>'.repeat(count);
    return bucket;
  }));
  $('theory-explanation').textContent = counting ? 'Inicializar e acumular K contagens custa Θ(K). Contar e posicionar n elementos custa Θ(n), independentemente da ordem de entrada.' : worst ? 'Metade dos valores são 1; depois chegam os valores 0. Todos entram no primeiro balde. Cada zero atravessa todos os uns no Insertion Sort.' : 'As chaves 10i + 5, para i de 0 a n − 1, são embaralhadas: cada balde recebe um elemento. Inicializar, distribuir e reunir custa Θ(n).';
  $('theory-formula').textContent = counting ? 'Θ(K) + Θ(n) = Θ(n + K); com K = 10n, Θ(n)' : worst ? '(n/2) × (n/2) = n²/4 deslocamentos' : 'n baldes + n elementos: trabalho proporcional a n';
  $('theory-note').textContent = counting ? 'Mantidos n e K, melhor e pior caso têm a mesma complexidade. Uma faixa muito grande pode tornar a contagem cara mesmo com poucos elementos.' : 'Concentrar valores em um balde não basta: a ordem precisa produzir muitas inversões. Não é necessário que todos os valores sejam distintos.';
  $('memory-cost').textContent = counting ? 'Θ(n + K)' : 'Θ(n)';
}
document.querySelectorAll('[data-theory]').forEach(button => button.addEventListener('click', () => drawTheory(button.dataset.theory)));
const demoInputs = {exemplo: [22,11,43,11,4,35], melhor: [35,5,45,15,25], pior: [1,1,1,0,0,0]};
let demoCase = 'exemplo', demoStep = 0;
function insertionSort(values) {
  const result = values.slice();
  for (let i = 1; i < result.length; i++) { const key = result[i]; let j = i; while (j > 0 && result[j - 1] > key) { result[j] = result[j - 1]; j--; } result[j] = key; }
  return result;
}
function chip(value, className = '') { const element = document.createElement('span'); element.className = `number-chip ${className}`; element.textContent = integer(value); return element; }
function drawDemo() {
  const input = demoInputs[demoCase], count = input.length, counting = isCounting();
  $('demo-intro').textContent = counting ? 'Conte as ocorrências de cada chave, acumule as contagens e posicione os valores de trás para frente. Só exibimos as chaves presentes; as demais têm contagem zero.' : 'Cinco baldes de dez chaves para visualizar a distribuição. Depois, Insertion Sort em cada intervalo e reunião da saída.';
  $('demo-input').replaceChildren(...input.map((value, i) => chip(value, i < demoStep ? 'processed' : i === demoStep ? 'active' : '')));
  const buckets = Array.from({length: 5}, () => []);
  input.slice(0, Math.min(count, demoStep)).forEach(value => buckets[Math.floor(value / 10)].push(value));
  if (demoStep > count) buckets.forEach((values, i) => { buckets[i] = insertionSort(values); });
  let rows, output = insertionSort(input), placed = 0, lastPlacement = '';
  if (counting) {
    const keys = [...new Set(input)].sort((a,b) => a-b);
    let cumulative = 0;
    const counts = new Map(keys.map(key => [key, input.slice(0,Math.min(count,demoStep)).filter(v=>v===key).length]));
    if (demoStep > count) for (const key of keys) { cumulative += counts.get(key); counts.set(key,cumulative); }
    output = Array(count).fill(null);
    placed = Math.max(0,Math.min(count,demoStep-count-1));
    for(let i=count-1;i>=count-placed;i--) { const key=input[i], position=counts.get(key)-1;counts.set(key,position);output[position]=key;lastPlacement=`A chave ${key} da posição ${i} foi para a posição ${position} da saída. A contagem foi decrementada.`; }
    rows = keys.map(key=>[`Chave ${key}`,[counts.get(key)]]);
  } else rows = buckets.map((values,i) => [`${i*10} a ${i*10+9}`, values]);
  $('demo-buckets').replaceChildren(...rows.map(([label, values]) => { const row=document.createElement('div');row.className='demo-bucket'; const range=document.createElement('span');range.className='bucket-range';range.textContent=label;const contents=document.createElement('div');contents.className='bucket-content';contents.replaceChildren(...values.map(v=>chip(v)));row.append(range,contents);return row; }));
  $('demo-message').textContent = demoStep === 0 ? (counting ? 'Cada chave começa com contagem zero. Conte um elemento por toque.' : 'Distribua um número por toque.') : demoStep <= count ? (counting ? `Contada a chave ${input[demoStep-1]}. ${demoStep} de ${count} elementos.` : `${input[demoStep-1]} foi para o balde ${Math.floor(input[demoStep-1]/10)}.`) : demoStep === count+1 ? (counting ? 'Contagens acumuladas: cada número indica o fim do trecho reservado às chaves até este valor.' : 'Cada balde está ordenado com Insertion Sort.') : (counting ? lastPlacement : 'Reunir os baldes em ordem produz a saída crescente.');
  const completed = counting ? demoStep >= count*2+1 : demoStep >= count+2;
  $('demo-step').textContent = completed ? 'Concluído' : demoStep < count ? (counting ? 'Contar próximo' : 'Distribuir próximo') : demoStep === count ? (counting ? 'Acumular contagens' : 'Ordenar baldes') : (counting ? 'Posicionar próximo' : 'Reunir resultado');
  $('demo-step').disabled = completed;
  $('demo-output').hidden = demoStep < count+2;
  $('demo-output-values').replaceChildren(...output.map(v=>v===null?Object.assign(document.createElement('span'),{className:'number-chip',textContent:'vazio'}):chip(v)));
}
$('demo-step').addEventListener('click',()=>{demoStep++;drawDemo();});
$('demo-reset').addEventListener('click',()=>{demoStep=0;drawDemo();});
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => { demoCase = button.dataset.demo; demoStep = 0; pressed('[data-demo]', 'demo', demoCase); drawDemo(); }));

const codeNotes = {distribuir: 'Primeiro trecho da implementação usada no experimento. Counting Sort registra frequências; Bucket Sort distribui os valores nos intervalos.', ordenar: 'Counting Sort usa contagens acumuladas para posicionar a saída estável. Bucket Sort usa Insertion Sort em cada trecho.', medir: 'O relógio é lido antes e depois da chamada completa. Geração, cópia da entrada e validação ficam fora do intervalo.'};
function drawCode(key) {
  pressed('[data-code]', 'code', key);
  const code = EXPERIMENT_DATA.code[algorithm][key];
  $('code-excerpt').textContent = code;
  $('code-explanation').textContent = codeNotes[key];
  $('code-file').textContent = key === 'medir' ? 'benchmark_comparacao.c' : isCounting() ? 'counting_sort.c' : 'bucket_sort_int.c';
  $('code-intro').textContent = isCounting() ? 'Contagens acumuladas e percurso inverso preservam a ordem relativa das chaves iguais. O vetor auxiliar tem n posições e a contagem tem K posições.' : 'Os baldes são trechos de um vetor auxiliar. As contagens organizam os trechos; a ordenação interna é feita com Insertion Sort.';
  $('source-code-link').href = 'https://github.com/greenBalding/CountingSort_BucketSort/blob/main/cod-implementacao/' + (isCounting() ? 'counting_sort.c' : 'bucket_sort_int.c');
}
document.querySelectorAll('[data-code]').forEach(button => button.addEventListener('click', () => drawCode(button.dataset.code)));
const records = EXPERIMENT_DATA.measurements;
function buildGroups(name) {
  return Object.fromEntries(['aleatorio','melhor','pior'].map(scenario => [scenario,
    [...new Set(records.filter(row => row.algorithm===name && row.scenario===scenario).map(row=>row.n))].sort((a,b)=>a-b).map(n=>{
      const rows=records.filter(row=>row.algorithm===name && row.scenario===scenario && row.n===n), values=rows.map(row=>row.seconds).sort((a,b)=>a-b);
      return {n,rows,mean:values.reduce((sum,value)=>sum+value,0)/values.length,median:values[Math.floor(values.length/2)]};
    })]));
}
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
  $(containerId).innerHTML = `<svg viewBox="0 0 375 245" role="group" aria-label="Tempo ${statistic==='mean'?'médio':'mediano'} por quantidade de elementos, em ${unit}"><text x="${left}" y="13">Tempo (${unit})</text>${grid}<polyline class="curve" points="${values.map((v,i)=>point(v,i).join(',')).join(' ')}"/>${ticks}${points}<text x="${(left+right)/2}" y="237" text-anchor="middle">Elementos - tamanhos testados</text></svg>`;
}
function drawResult(prefix, scenario) {
  const n = Number($(prefix === 'random' ? 'random-n' : 'cases-n').value);
  const statistic = $(`${prefix}-stat`).value;
  const group = groups[scenario].find(group => group.n === n);
  const t = time(group[statistic]);
  $(`${prefix}-value`).textContent = t.value; $(`${prefix}-unit`).textContent = t.unit;
  $(`${prefix}-caption`).textContent = `${statistic === 'mean' ? 'Média' : 'Mediana'} de 3 execuções - ${integer(n)} elementos`;
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
    $('compare-ratio').textContent = ratio >= 1 ? `Nesta amostra, o pior caso levou ${decimal(ratio,1)} vezes o tempo do melhor caso.` : 'Nesta amostra pequena, o tempo do pior caso ficou abaixo do melhor. A variação da medição não altera a análise teórica.';
    $('cases-description').textContent = scenario === 'melhor' ? 'Chaves 10i + 5 embaralhadas: um elemento por balde. Counting Sort recebe a mesma entrada.' : 'Primeira metade: valores 1. Segunda metade: valores 0. Todos no primeiro balde. São n²/4 inversões. Counting Sort recebe os mesmos dois blocos.';
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
  $('growth-value').textContent = integer(n*n/4);
  $('growth-note').textContent = n===500000 ? 'Este tamanho obrigatório foi medido no pior caso.' : 'Dobrar a entrada multiplica os deslocamentos por quatro. O teste opcional também foi executado.';
}
document.querySelectorAll('[data-growth]').forEach(button=>button.addEventListener('click',()=>drawGrowth(Number(button.dataset.growth))));
document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
  pressed('[data-answer]','answer',button.dataset.answer);
  $('quiz-feedback').textContent = button.dataset.answer==='depende' ? 'Isso! A ordem também importa. Valores crescentes no mesmo balde exigem pouco esforço do Insertion Sort; dois blocos de uns e zeros produzem uma quantidade quadrática de inversões.' : 'Falta uma condição: a ordem. Se os valores já chegam crescentes, o Insertion Sort tem custo linear mesmo com todos no mesmo balde.';
}));
$('print-conclusions').addEventListener('click',()=>window.print());

function drawComparison() {
  const scenario=$('comparison-case').value, n=Number($('comparison-n').value);
  const c=buildGroups('counting_sort')[scenario].find(r=>r.n===n).mean, b=buildGroups('bucket_sort_insertion_int')[scenario].find(r=>r.n===n).mean;
  $('comparison-counting').textContent=formattedTime(c);$('comparison-bucket').textContent=formattedTime(b);
  const faster=c<=b?'Counting Sort':'Bucket Sort', ratio=Math.max(c,b)/Math.min(c,b);
  $('comparison-summary').textContent=`Nesta amostra de ${integer(n)} elementos, ${faster} apresentou a menor média. A razão entre os tempos é ${decimal(ratio,2)}. Isso descreve este cenário e esta implementação, sem estabelecer superioridade universal.`;
}
function selectAlgorithm(name) {
  algorithm=name; $('active-algorithm').value=name;
  const url=new URL(location.href);url.searchParams.set('algoritmo',name);history.replaceState(null,'',url);
  groups=buildGroups(name);demoStep=0;
  drawTheory(document.querySelector('[data-theory][aria-pressed="true"]').dataset.theory);drawDemo();drawCode(document.querySelector('[data-code][aria-pressed="true"]').dataset.code);
  fillSelect('random-n','aleatorio');fillSelect('cases-n',resultCase);drawResult('random','aleatorio');drawResult('cases',resultCase);
  $('optional-results').textContent=`${algorithmName()}, n = 1.000.000: média de ${formattedTime(groups.melhor.at(-1).mean)} no melhor cenário para baldes e ${formattedTime(groups.pior.at(-1).mean)} no pior. Faixa K = 10.000.000.`;
}
$('comparison-n').replaceChildren(...[10,100,1000,5000,10000,50000,100000,500000,1000000].map(n=>{const o=document.createElement('option');o.value=n;o.textContent=integer(n);return o;}));
$('comparison-n').value=1000000;
['comparison-case','comparison-n'].forEach(id=>$(id).addEventListener('change',drawComparison));
selectAlgorithm(algorithm);drawGrowth(500000);drawComparison();followHash();
