# Script para aplicar migración de Multisede
# Ejecutar desde la raíz del proyecto: .\scripts\apply-locations-migration.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MIGRACIÓN: Funcionalidad Multisede" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cargar variables de entorno
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✓ Variables de entorno cargadas" -ForegroundColor Green
} else {
    Write-Host "✗ Archivo .env.local no encontrado" -ForegroundColor Red
    exit 1
}

$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SERVICE_ROLE_KEY) {
    Write-Host "✗ Variables SUPABASE_URL o SERVICE_ROLE_KEY no configuradas" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Conectando a Supabase..." -ForegroundColor Green
Write-Host "  URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

# Leer el archivo SQL
$sqlFile = "supabase\migration-add-locations.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "✗ Archivo $sqlFile no encontrado" -ForegroundColor Red
    exit 1
}

$sql = Get-Content $sqlFile -Raw

# Ejecutar la migración
Write-Host "Ejecutando migración..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "apikey" = $SERVICE_ROLE_KEY
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    }

    $body = @{
        query = $sql
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✓ Migración aplicada exitosamente" -ForegroundColor Green
    Write-Host ""
    
} catch {
    # Si falla la ejecución via API, intentar con psql si está disponible
    Write-Host "! Intentando ejecutar con psql directo..." -ForegroundColor Yellow
    
    $DB_URL = $env:DATABASE_URL
    if ($DB_URL) {
        psql $DB_URL -f $sqlFile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Migración aplicada exitosamente" -ForegroundColor Green
        } else {
            Write-Host "✗ Error aplicando migración" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✗ Error aplicando migración via API y DATABASE_URL no está configurado" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SIGUIENTES PASOS:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Crear sedes iniciales:" -ForegroundColor Yellow
Write-Host "   - Acceder al panel de Supabase" -ForegroundColor Gray
Write-Host "   - Ir a Table Editor > locations" -ForegroundColor Gray
Write-Host "   - Insertar las sedes de tu organización" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Asignar sedes a usuarios existentes:" -ForegroundColor Yellow
Write-Host "   - Ir a Table Editor > profiles" -ForegroundColor Gray
Write-Host "   - Actualizar el campo location_id de cada usuario" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Asignar sede a tickets existentes (opcional):" -ForegroundColor Yellow
Write-Host "   - Ejecutar el script de ejemplo al final de la migración" -ForegroundColor Gray
Write-Host "   - O hacerlo manualmente desde el panel" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Verificar filtrado por sede:" -ForegroundColor Yellow
Write-Host "   - Iniciar sesión como usuario no-admin" -ForegroundColor Gray
Write-Host "   - Verificar que solo vea tickets de su sede" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
