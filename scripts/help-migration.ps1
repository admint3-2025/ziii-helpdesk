# Script simple para copiar y ejecutar migración en servidor remoto

$SUPABASE_HOST = "192.168.31.240"
$MIGRATION_FILE = "supabase\migration-add-locations.sql"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MIGRACIÓN: Funcionalidad Multisede" -ForegroundColor Cyan  
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Instrucciones para aplicar la migración:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opción 1: Desde el servidor Supabase (192.168.31.240)" -ForegroundColor Green
Write-Host "-------------------------------------------------------" -ForegroundColor Gray
Write-Host "1. Conéctate al servidor: ssh root@192.168.31.240"
Write-Host "2. Navega a: cd /opt/helpdesk"  
Write-Host "3. Ejecuta:" -ForegroundColor Yellow
Write-Host "   docker exec supabase-db psql -U postgres -f supabase/migration-add-locations.sql"
Write-Host ""

Write-Host "Opción 2: Desde Supabase Studio (Panel Web)" -ForegroundColor Green
Write-Host "-------------------------------------------------------" -ForegroundColor Gray
Write-Host "1. Abre: http://192.168.31.240:8000"
Write-Host "2. Ve a: SQL Editor"
Write-Host "3. Copia y pega el contenido de: $MIGRATION_FILE"
Write-Host "4. Click en 'Run'"
Write-Host ""

Write-Host "Opción 3: Aplicar automáticamente desde aquí" -ForegroundColor Green
Write-Host "-------------------------------------------------------" -ForegroundColor Gray
$confirm = Read-Host "¿Abrir el archivo SQL para copiar? (S/N)"

if ($confirm -eq 'S' -or $confirm -eq 's') {
    notepad $MIGRATION_FILE
    Write-Host ""
    Write-Host "✓ Archivo abierto en Notepad" -ForegroundColor Green
    Write-Host "  Copia el contenido y pégalo en el SQL Editor de Supabase" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
