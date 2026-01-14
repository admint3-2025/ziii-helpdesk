-- ============================================================================
-- LIMPIEZA COMPLETA DE ACTIVOS (ASSETS)
-- Elimina: activos, imágenes de activos, catálogos, auditoría de activos
-- Preserva: usuarios, categorías, tickets, sedes (locations), estructura de BD
-- ============================================================================

-- 1. Desactivar temporalmente RLS para limpieza
SET session_replication_role = replica;

-- 2. Eliminar imágenes de activos del storage (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DELETE FROM storage.objects WHERE bucket_id = 'asset-images';
    END IF;
END $$;

-- 3. Eliminar imágenes de activos de la tabla (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_images') THEN
        DELETE FROM asset_images;
    END IF;
END $$;

-- 4. Eliminar catálogos de activos (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_catalogs') THEN
        DELETE FROM asset_catalogs;
    END IF;
END $$;

-- 5. Eliminar registros de auditoría relacionados con activos
DELETE FROM audit_log 
WHERE entity_type = 'asset' 
   OR entity_type = 'asset_image' 
   OR entity_type = 'asset_catalog'
   OR action LIKE '%asset%';

-- 6. Eliminar todos los activos
DELETE FROM assets;

-- 7. Reiniciar secuencias (si existen)
DO $$ 
BEGIN
    -- Reiniciar secuencia de assets si existe
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'assets_id_seq') THEN
        ALTER SEQUENCE assets_id_seq RESTART WITH 1;
    END IF;
    
    -- Reiniciar secuencia de asset_images si existe
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'asset_images_id_seq') THEN
        ALTER SEQUENCE asset_images_id_seq RESTART WITH 1;
    END IF;
    
    -- Reiniciar secuencia de asset_catalogs si existe
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'asset_catalogs_id_seq') THEN
        ALTER SEQUENCE asset_catalogs_id_seq RESTART WITH 1;
    END IF;
END $$;

-- 8. Reactivar RLS
SET session_replication_role = DEFAULT;

-- 9. Verificar limpieza
SELECT 
  'assets' as tabla, COUNT(*) as registros FROM assets
UNION ALL 
SELECT 'audit_log_assets', COUNT(*) 
FROM audit_log 
WHERE entity_type IN ('asset', 'asset_image', 'asset_catalog')
UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'usuarios', COUNT(*) FROM profiles
UNION ALL SELECT 'categorías', COUNT(*) FROM categories
UNION ALL SELECT 'sedes', COUNT(*) FROM locations;

-- Resultado esperado: 
-- - 0 en assets, asset_images, asset_catalogs, archivos_storage_assets, audit_log_assets
-- - >0 en tickets, usuarios, categorías, sedes (preservados)

-- ============================================================================
-- NOTAS IMPORTANTES:
-- - Este script elimina TODOS los activos de forma irreversible
-- - La auditoría de activos también se elimina
-- - Los tickets, usuarios, categorías y sedes se preservan
-- - Ejecutar solo cuando se necesite reiniciar el módulo de activos completamente
-- ============================================================================
