param(
    [ValidateRange(1, 100)][int]$Repeticoes = 3,
    [switch]$SomenteValidar
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $PSScriptRoot 'build'
$resultsDir = Join-Path $projectRoot 'db-resultados'
New-Item -ItemType Directory -Force -Path $buildDir, $resultsDir | Out-Null
$compiler = (Get-Command gcc -ErrorAction Stop).Source
$commonArgs = @('-std=c11', '-O2', '-Wall', '-Wextra', '-Wpedantic')
$coreSource = Join-Path $PSScriptRoot 'bucket_sort.c'
$testExe = Join-Path $buildDir 'test_bucket_sort.exe'
$benchmarkExe = Join-Path $buildDir 'bucket_sort.exe'
& $compiler @commonArgs $coreSource (Join-Path $PSScriptRoot 'test_bucket_sort.c') '-o' $testExe '-lm'
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar a validacao.' }
& $testExe
if ($LASTEXITCODE -ne 0) { throw 'Falha na validacao de corretude.' }
& $compiler @commonArgs $coreSource (Join-Path $PSScriptRoot 'benchmark.c') '-o' $benchmarkExe '-lm'
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o benchmark.' }
& $benchmarkExe --demo
if ($LASTEXITCODE -ne 0) { throw 'Falha na demonstracao.' }
if ($SomenteValidar) { return }
$csvPath = Join-Path $resultsDir 'bucket_sort_medicoes.csv'
if (Test-Path -LiteralPath $csvPath) {
    throw 'O CSV de medicoes ja existe. Renomeie-o para preservar o experimento anterior antes de executar novamente.'
}
$compilerVersion = (& $compiler --version | Select-Object -First 1)
$started = Get-Date
$metadata = @(
    'EXPERIMENTO BUCKET SORT'
    ('Inicio: ' + $started.ToString('yyyy-MM-ddTHH:mm:sszzz'))
    ('Compilador: ' + $compilerVersion)
    'Compilacao: gcc -std=c11 -O2 -Wall -Wextra -Wpedantic bucket_sort.c benchmark.c -lm'
    ('Repeticoes por cenario/tamanho: ' + $Repeticoes)
    'Tipo: double; faixa global fixa [0, 1); k = n baldes; Insertion Sort interno.'
    'Relogio: QueryPerformanceCounter (Windows), tempo decorrido em segundos.'
    'Trecho medido: chamada completa bucket_sort, incluindo alocacao, distribuicao, ordenacao interna, copia de saida e liberacao.'
    'Fora do tempo: geracao, qsort de referencia, verificacao e gravacao dos resultados.'
    'Corretude: ordem crescente e igualdade exata da saida com qsort em cada medicao.'
    'Aquecimento: uma chamada com 1000 valores aleatorios, nao registrada no CSV.'
    'Aleatorio: SplitMix64 com 53 bits; semente registrada por repeticao.'
    'Melhor: um valor no centro de cada balde; entrada embaralhada.'
    'Pior: n valores distintos decrescentes no intervalo [0, 1/n), todos no primeiro balde.'
    '1.000.000 de elementos: executado somente no aleatorio; melhor/pior opcionais nao executados.'
    'Execucao sequencial das medicoes para evitar concorrencia entre benchmarks.'
)
$metadataPath = Join-Path $resultsDir 'execucao_bucket_sort.txt'
$metadata | Set-Content -LiteralPath $metadataPath -Encoding UTF8
& $benchmarkExe --output $csvPath $Repeticoes
if ($LASTEXITCODE -ne 0) { throw 'Benchmark interrompido ou com erro. Consulte a saida do terminal; CSV pode estar incompleto.' }
('Fim: ' + (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')) | Add-Content -LiteralPath $metadataPath -Encoding UTF8
'Status: concluido; todas as medicoes passaram na verificacao de corretude.' | Add-Content -LiteralPath $metadataPath -Encoding UTF8
