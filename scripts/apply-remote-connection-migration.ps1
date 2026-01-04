# Aplicar migracion de campos de conexion remota
# Ejecutar: .\scripts\apply-remote-connection-migration.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Migracion: Campos de Conexion Remota" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Leer archivo de migracion
$migrationFile = "supabase/migration-add-remote-connection.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: No se encontro el archivo de migracion" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content -Path $migrationFile -Raw -Encoding UTF8

Write-Host "Archivo de migracion cargado" -ForegroundColor Green
Write-Host ""
Write-Host "SQL a ejecutar:" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
Write-Host $sqlContent -ForegroundColor Gray
Write-Host "-------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  INSTRUCCIONES MANUALES" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abre Supabase Studio en:" -ForegroundColor Yellow
Write-Host "   http://192.168.31.238:8000" -ForegroundColor White
Write-Host ""
Write-Host "2. Ve a: SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Copia el SQL de arriba" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Pega y ejecuta en SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "Listo! Una vez ejecutado, los campos estaran disponibles." -ForegroundColor Green

