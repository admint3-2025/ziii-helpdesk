# Aplicar migracion de control de activos por sede
# Ejecutar: .\scripts\apply-assets-location-migration.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Migracion: Control de Activos por Sede" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Leer archivo de migracion
$migrationFile = "supabase/migration-assets-location-control.sql"
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
Write-Host "5. Esta migracion crea:" -ForegroundColor Cyan
Write-Host "   - Campo location_id en assets" -ForegroundColor White
Write-Host "   - Tabla user_locations (asignacion usuarios-sedes)" -ForegroundColor White
Write-Host "   - Funciones can_access_location y get_accessible_locations" -ForegroundColor White
Write-Host "   - RLS policies para control por sede" -ForegroundColor White
Write-Host "   - Trigger auto-asignacion de sede a activos" -ForegroundColor White
Write-Host ""
Write-Host "6. Despues de ejecutar, asigna tecnicos a sedes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   -- Ver tecnicos" -ForegroundColor Gray
Write-Host "   SELECT id, email, full_name, role FROM profiles" -ForegroundColor Gray
Write-Host "   WHERE role IN ('agent_l1', 'agent_l2', 'supervisor');" -ForegroundColor Gray
Write-Host ""
Write-Host "   -- Ver sedes" -ForegroundColor Gray
Write-Host "   SELECT id, code, name FROM locations WHERE is_active = true;" -ForegroundColor Gray
Write-Host ""
Write-Host "   -- Asignar tecnico a sede" -ForegroundColor Gray
Write-Host "   INSERT INTO user_locations (user_id, location_id)" -ForegroundColor Gray
Write-Host "   VALUES ('uuid-del-tecnico', 'uuid-de-la-sede');" -ForegroundColor Gray
Write-Host ""
Write-Host "Listo! Los activos se controlan por sede ahora." -ForegroundColor Green
