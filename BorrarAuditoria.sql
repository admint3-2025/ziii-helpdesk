-- ============================================================================
-- LIMPIEZA COMPLETA DE AUDITORÍA
-- Elimina: TODOS los registros de audit_log
-- Preserva: usuarios, tickets, activos, sedes, categorías, estructura de BD
-- ADVERTENCIA: Esta operación es IRREVERSIBLE - Se perderá el historial de auditoría
-- ============================================================================

-- 1. Desactivar temporalmente RLS para limpieza
SET session_replication_role = replica;

-- 2. Mostrar estadísticas antes de eliminar
DO $$ 
DECLARE
    v_count bigint;
    v_oldest timestamptz;
    v_newest timestamptz;
BEGIN
    SELECT COUNT(*), MIN(created_at), MAX(created_at) 
    INTO v_count, v_oldest, v_newest
    FROM audit_log;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUDITORÍA A ELIMINAR:';
    RAISE NOTICE '  Total registros: %', v_count;
    RAISE NOTICE '  Más antiguo: %', v_oldest;
    RAISE NOTICE '  Más reciente: %', v_newest;
    RAISE NOTICE '========================================';
END $$;

-- 3. Eliminar todos los registros de auditoría
DELETE FROM audit_log;

-- 4. Reactivar RLS
SET session_replication_role = DEFAULT;

-- 5. Verificar eliminación
SELECT 
  'audit_log' as tabla, COUNT(*) as registros FROM audit_log
UNION ALL SELECT 'usuarios', COUNT(*) FROM profiles
UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'activos', COUNT(*) FROM assets
UNION ALL SELECT 'categorías', COUNT(*) FROM categories
UNION ALL SELECT 'sedes', COUNT(*) FROM locations;

-- Resultado esperado: 
-- - 0 en audit_log
-- - >0 en usuarios, tickets, activos, categorías, sedes (preservados)

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ⚠️  Esta operación es IRREVERSIBLE
-- ⚠️  Se eliminará TODA la auditoría del sistema
-- ⚠️  No se eliminarán usuarios, tickets, activos ni otros datos
-- ⚠️  Útil para limpiar auditoría antes de pasar a producción o después de pruebas
-- ⚠️  La tabla audit_log quedará vacía pero funcional
-- ============================================================================
