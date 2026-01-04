# Script para aplicar la migración de auditoría de cambios de sede
# Requiere que migration-assets-location-control.sql esté aplicada primero

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Migracion: Auditoria de Cambios de Sede" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Leer configuración de Supabase
$supabaseUrl = "http://192.168.31.238:8000"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Yellow
Write-Host ""

# Leer el archivo SQL
$sqlFile = ".\supabase\migration-asset-location-audit.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: No se encontro el archivo $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Archivo encontrado: $sqlFile" -ForegroundColor Green

$sqlContent = Get-Content $sqlFile -Raw

Write-Host ""
Write-Host "📝 Resumen de la migracion:" -ForegroundColor Yellow
Write-Host "   - Tabla: asset_location_changes (registro de auditoria)" -ForegroundColor White
Write-Host "   - Trigger: validate_asset_location_change" -ForegroundColor White
Write-Host "   - Funciones: get_location_supervisors, get_all_admins" -ForegroundColor White
Write-Host "   - RLS Policies para auditoria" -ForegroundColor White
Write-Host "   - Vista: asset_location_changes_report" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "¿Desea aplicar esta migracion? (s/n)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Migracion cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Aplicando migracion..." -ForegroundColor Cyan

try {
    # Ejecutar SQL via API REST
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
    }

    $body = @{
        query = $sqlContent
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop

    Write-Host ""
    Write-Host "✅ Migracion aplicada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " CONFIGURACION COMPLETADA" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Proximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. La tabla asset_location_changes registra todos los cambios" -ForegroundColor White
    Write-Host "   2. El trigger valida y requiere justificacion (minimo 10 caracteres)" -ForegroundColor White
    Write-Host "   3. Las notificaciones se envian a admins y supervisores" -ForegroundColor White
    Write-Host "   4. Ningun usuario (ni admin) puede cambiar sede sin justificacion" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Vista de auditoria:" -ForegroundColor Yellow
    Write-Host "   SELECT * FROM asset_location_changes_report;" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error al aplicar la migracion:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Intente ejecutar el SQL manualmente en Supabase Studio:" -ForegroundColor Yellow
    Write-Host "1. Abra http://192.168.31.238:8000" -ForegroundColor Gray
    Write-Host "2. Vaya a SQL Editor" -ForegroundColor Gray
    Write-Host "3. Copie y pegue el contenido de migration-asset-location-audit.sql" -ForegroundColor Gray
    Write-Host "4. Ejecute el script" -ForegroundColor Gray
    exit 1
}
