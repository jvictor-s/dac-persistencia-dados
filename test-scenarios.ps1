param(
    [string]$BaseUrl = "http://localhost:3333"
)

function Write-Section {
    param([string]$Title)
    Write-Host "" 
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Method,

        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [object]$Body = $null,

        [switch]$NoThrow
    )

    $params = @{
        Method = $Method
        Uri = $Uri
        ContentType = "application/json"
    }

    if ($null -ne $Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($NoThrow) {
            Write-Host "[ERRO] $errorMessage" -ForegroundColor Red
            return $null
        }

        throw "API falhou [$Method $Uri]: $errorMessage"
    }
}

function Test-ScenarioOne {
    Write-Section "Cenario 1: PostgreSQL -> MongoDB"

    $payload = @{ name = "Ana Teste"; email = "ana.teste.$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))@example.com" }
    $result = Invoke-Api -Method Post -Uri "$BaseUrl/users/scenario1" -Body $payload
    $result | ConvertTo-Json -Depth 10
}

function Test-ScenarioTwo {
    Write-Section "Cenario 2: MongoDB -> PostgreSQL"

    $payload = @{ name = "Bruno Teste"; email = "bruno.teste.$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))@example.com" }
    $result = Invoke-Api -Method Post -Uri "$BaseUrl/users/scenario2" -Body $payload
    $result | ConvertTo-Json -Depth 10
}

function Test-ScenarioOneFailure {
    Write-Section "Cenario 1 com falha simulada no MongoDB"

    $payload = @{ name = "Falha Mongo"; email = "falha.mongo.$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))@example.com"; failureAt = "mongodb" }
    $result = Invoke-Api -Method Post -Uri "$BaseUrl/users/scenario1" -Body $payload -NoThrow

    if ($null -eq $result) {
        Write-Host "Rollback executado com sucesso no PostgreSQL." -ForegroundColor Green
    }
    else {
        $result | ConvertTo-Json -Depth 10
    }
}

function Test-ScenarioTwoFailure {
    Write-Section "Cenário 2 com falha simulada no PostgreSQL"

    $payload = @{ name = "Falha Postgres"; email = "falha.postgres.$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))@example.com"; failureAt = "postgres" }
    $result = Invoke-Api -Method Post -Uri "$BaseUrl/users/scenario2" -Body $payload -NoThrow

    if ($null -eq $result) {
        Write-Host "Rollback executado com sucesso no MongoDB." -ForegroundColor Green
    }
    else {
        $result | ConvertTo-Json -Depth 10
    }
}

function Test-ScenarioThree {
    Write-Section "Cenario 3: Atualizacao em MongoDB e PostgreSQL"

    $email = "ana.consistente@example.com"

    $existing = Invoke-Api -Method Get -Uri "$BaseUrl/users/consistent" -NoThrow
    $hasUser = $existing -and ($existing | Where-Object { $_.email -eq $email })

    if (-not $hasUser) {
        $seed = Invoke-Api -Method Post -Uri "$BaseUrl/users/scenario1" -Body @{ name = "Ana Consistente"; email = $email } -NoThrow
        if ($null -eq $seed) {
            throw "Não foi possível criar o usuário de teste do cenário 3."
        }
    }

    $payload = @{ name = "Ana Atualizada" }
    $result = Invoke-Api -Method Put -Uri "$BaseUrl/users/scenario3/$email" -Body $payload
    $result | ConvertTo-Json -Depth 10

    Write-Section "Consulta de consistência"
    $consistency = Invoke-Api -Method Get -Uri "$BaseUrl/users/consistent"
    $consistency | ConvertTo-Json -Depth 10

    Write-Section "Monitor de 10ms"
    $monitor = Invoke-Api -Method Get -Uri "$BaseUrl/users/monitor"
    $monitor | ConvertTo-Json -Depth 10
}

try {
    Write-Host "Testando API em $BaseUrl" -ForegroundColor Yellow
    $health = Invoke-Api -Method Get -Uri "$BaseUrl/users/consistent" -NoThrow
    if ($null -eq $health) {
        throw "A API não respondeu em $BaseUrl. Inicie o projeto com 'npm start' antes de rodar este script."
    }

    Test-ScenarioOne
    Test-ScenarioTwo
    Test-ScenarioOneFailure
    Test-ScenarioTwoFailure
    Test-ScenarioThree
}
catch {
    Write-Host "" 
    Write-Host "[FALHA] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
