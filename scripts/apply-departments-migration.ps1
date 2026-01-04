# Script para aplicar migración de departamentos
# Ejecutar desde: scripts/apply-departments-migration.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Aplicando Migración: Sistema de Departamentos  " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Cargar variables de entorno
$envPath = Join-Path $PSScriptRoot ".." ".env.local"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✓ Variables de entorno cargadas" -ForegroundColor Green
} else {
    Write-Host "⚠ Archivo .env.local no encontrado" -ForegroundColor Yellow
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host "✗ DATABASE_URL no encontrada en .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✓ DATABASE_URL configurada" -ForegroundColor Green
Write-Host ""

# Aplicar migración
$migrationFile = Join-Path $PSScriptRoot ".." "supabase" "migration-add-departments.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "✗ No se encontró el archivo de migración: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Aplicando migración desde: $migrationFile" -ForegroundColor Cyan

try {
    $env:PGPASSWORD = ""
    
    # Ejecutar con psql
    psql $dbUrl -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host "  ✓ Migración aplicada exitosamente              " -ForegroundColor Green
        Write-Host "==================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Tabla 'departments' creada con 20 departamentos predefinidos" -ForegroundColor Green
        Write-Host "Los formularios de usuarios y activos ahora pueden usar departamentos" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Error al aplicar la migración (código: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ Error ejecutando psql: $_" -ForegroundColor Red
    exit 1
}
