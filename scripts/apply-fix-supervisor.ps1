# Script para aplicar fix-supervisor-location-access.sql
# Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Aplicando fix-supervisor-location-access.sql" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Leer variables del archivo .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: No se encuentra .env.local" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env.local" -Raw
$SUPABASE_URL = if ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)') { $matches[1].Trim() } else { $null }
$SERVICE_ROLE_KEY = if ($envContent -match 'SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)') { $matches[1].Trim() } else { $null }

if (-not $SUPABASE_URL -or -not $SERVICE_ROLE_KEY) {
    Write-Host "❌ Error: Variables de entorno no configuradas" -ForegroundColor Red
    exit 1
}

Write-Host "✓ URL: $SUPABASE_URL" -ForegroundColor Green

# Leer archivo SQL
$sqlFile = "supabase/fix-supervisor-location-access.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: No se encuentra $sqlFile" -ForegroundColor Red
    exit 1
}

$sql = Get-Content $sqlFile -Raw -Encoding UTF8

# Preparar el cuerpo de la solicitud
$body = @{
    query = $sql
} | ConvertTo-Json -Depth 10

# Construir URL del endpoint
$endpoint = "$SUPABASE_URL/rest/v1/rpc/exec_sql"

try {
    Write-Host "`nEjecutando SQL..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers @{
            "apikey" = $SERVICE_ROLE_KEY
            "Authorization" = "Bearer $SERVICE_ROLE_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "`n✅ Migración aplicada exitosamente" -ForegroundColor Green
    
    if ($response) {
        Write-Host "`nRespuesta:" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 5
    }
    
} catch {
    Write-Host "`n❌ Error al ejecutar SQL:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Intentar aplicar directamente sin RPC
    Write-Host "`n⚠️  Intenta copiar y pegar el SQL directamente en Supabase SQL Editor" -ForegroundColor Yellow
    Write-Host "URL: $SUPABASE_URL/project/_/sql" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IMPORTANTE: Refresca el navegador (Ctrl+Shift+R)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
