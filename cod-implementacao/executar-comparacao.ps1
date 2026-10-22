param([ValidateRange(1,100)][int]$Repeticoes = 3, [switch]$SomenteValidar)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $PSScriptRoot 'build'
$resultsDir = Join-Path $projectRoot 'db-resultados'
New-Item -ItemType Directory -Force -Path $buildDir,$resultsDir | Out-Null
$compiler = (Get-Command gcc -ErrorAction Stop).Source
$commonArgs = @('-std=c11','-O2','-Wall','-Wextra','-Wpedantic')
$sources = @((Join-Path $PSScriptRoot 'counting_sort.c'),(Join-Path $PSScriptRoot 'bucket_sort_int.c'))
$testExe = Join-Path $buildDir 'test_comparacao.exe'
$benchmarkExe = Join-Path $buildDir 'comparacao.exe'
& $compiler @commonArgs @sources (Join-Path $PSScriptRoot 'test_comparacao.c') '-o' $testExe
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar validacao.' }
& $testExe
if ($LASTEXITCODE -ne 0) { throw 'Falha na validacao.' }
& $compiler @commonArgs @sources (Join-Path $PSScriptRoot 'benchmark_comparacao.c') '-o' $benchmarkExe
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar benchmark.' }
& $benchmarkExe --demo
if ($LASTEXITCODE -ne 0) { throw 'Falha na demonstracao.' }
if ($SomenteValidar) { return }
$csvPath = Join-Path $resultsDir 'comparacao_medicoes.csv'
if (Test-Path -LiteralPath $csvPath) { throw 'CSV ja existe. Preserve os resultados anteriores antes de executar nova rodada.' }
$version = & $compiler --version | Select-Object -First 1
$metadataPath = Join-Path $resultsDir 'execucao_comparacao.txt'
@(
    'EXPERIMENTO COMPARATIVO COUNTING SORT E BUCKET SORT'
    ('Inicio: ' + (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz'))
    ('Compilador: ' + $version)
    'Compilacao: gcc -std=c11 -O2 -Wall -Wextra -Wpedantic counting_sort.c bucket_sort_int.c benchmark_comparacao.c'
    ('Repeticoes por algoritmo/cenario/tamanho: ' + $Repeticoes)
    'Tipos: uint32_t nos dois algoritmos. Mesmas entradas copiadas para cada algoritmo.'
    'Faixa global conhecida K = 10*n, chaves [0,K); b = n baldes. O Counting Sort nao usa baldes (coluna baldes = 0).'
    'Counting Sort estavel por contagens acumuladas; Bucket Sort com Insertion Sort interno.'
    'Aleatorio: SplitMix64 modulo K; semente registrada. Melhor: 10*i+5 embaralhado, um elemento por balde.'
    'Pior para Bucket: n/2 valores 1 seguidos de n/2 valores 0, todos no primeiro balde; n^2/4 deslocamentos.'
    'No Counting Sort, os nomes melhor/pior identificam os mesmos cenarios; com n e K fixos, ambos custam Theta(n+K).'
    'Relogio QueryPerformanceCounter: chamada completa incluindo alocacoes, ordenacao, copia final e liberacao.'
    'Fora do tempo: geracao, copia da entrada para comparacao justa, qsort de referencia, validacao e CSV.'
    'Ordem dos algoritmos alternada por repeticao. Medicoes sequenciais.'
    'Aquecimento: chamada com 1000 elementos em cada algoritmo, fora do CSV.'
    'Validacao: ordem crescente e igualdade exata com qsort em todas as medicoes.'
    'Tamanhos: 10,100,1000,5000,10000,50000,100000,500000,1000000 em todos os cenarios.'
    'Item f: melhor e pior com 1.000.000 incluidos (opcionais).'
    'Experimento historico bucket_sort_medicoes.csv usa double e nao integra esta comparacao.'
) | Set-Content -LiteralPath $metadataPath -Encoding UTF8
& $benchmarkExe --output $csvPath $Repeticoes
if ($LASTEXITCODE -ne 0) { throw 'Benchmark interrompido; CSV pode estar incompleto.' }
('Fim: ' + (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')) | Add-Content -LiteralPath $metadataPath -Encoding UTF8
'Status: concluido; todas as medicoes passaram na verificacao de corretude.' | Add-Content -LiteralPath $metadataPath -Encoding UTF8
