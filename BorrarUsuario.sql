-- ============================================================================
-- ELIMINACIÓN SEGURA Y DEFINITIVA DE USUARIO
-- Elimina: usuario, perfil, tickets, comentarios, historial, auditoría, notificaciones
-- ADVERTENCIA: Esta operación es IRREVERSIBLE
-- ============================================================================
-- 
-- USO: Reemplazar 'EMAIL_DEL_USUARIO' con el email real del usuario a eliminar
-- 
-- ============================================================================

-- 1. Desactivar temporalmente RLS para limpieza
SET session_replication_role = replica;

-- 2. Obtener el user_id del usuario (guardarlo para referencia)
DO $$ 
DECLARE
    v_user_id uuid;
    v_email text := 'EMAIL_DEL_USUARIO'; -- ⚠️ CAMBIAR ESTE EMAIL
BEGIN
    -- Obtener el user_id
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuario con email % no encontrado', v_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Eliminando usuario: % (ID: %)', v_email, v_user_id;
    
    -- 3. Eliminar notificaciones del usuario
    DELETE FROM notifications WHERE user_id = v_user_id;
    RAISE NOTICE '✓ Notificaciones eliminadas';
    
    -- 4. Eliminar adjuntos subidos por el usuario (del storage)
    DELETE FROM storage.objects 
    WHERE bucket_id = 'ticket-attachments' 
      AND owner = v_user_id;
    RAISE NOTICE '✓ Archivos del storage eliminados';
    
    -- 5. Eliminar adjuntos de tickets (metadata)
    DELETE FROM ticket_attachments WHERE uploaded_by = v_user_id;
    RAISE NOTICE '✓ Adjuntos de tickets eliminados';
    
    -- 6. Eliminar comentarios del usuario
    DELETE FROM ticket_comments WHERE author_id = v_user_id;
    RAISE NOTICE '✓ Comentarios eliminados';
    
    -- 7. Eliminar historial de tickets donde el usuario fue actor
    DELETE FROM ticket_status_history WHERE actor_id = v_user_id;
    RAISE NOTICE '✓ Historial de tickets eliminado';
    
    -- 8. Eliminar tickets creados por el usuario
    DELETE FROM tickets WHERE requester_id = v_user_id;
    RAISE NOTICE '✓ Tickets eliminados';
    
    -- 9. Eliminar tickets asignados al usuario (set null)
    UPDATE tickets SET assigned_agent_id = NULL WHERE assigned_agent_id = v_user_id;
    RAISE NOTICE '✓ Asignaciones de tickets removidas';
    
    -- 10. Eliminar auditoría del usuario (como actor y como entidad)
    DELETE FROM audit_log WHERE actor_id = v_user_id OR entity_id = v_user_id;
    RAISE NOTICE '✓ Auditoría eliminada';
    
    -- 11. Eliminar ubicaciones del usuario (user_locations)
    DELETE FROM user_locations WHERE user_id = v_user_id;
    RAISE NOTICE '✓ Ubicaciones de usuario eliminadas';
    
    -- 12. Eliminar activos asignados al usuario (set null)
    UPDATE assets SET assigned_to = NULL WHERE assigned_to = v_user_id;
    RAISE NOTICE '✓ Asignaciones de activos removidas';
    
    -- 13. Eliminar perfil del usuario (profiles)
    DELETE FROM profiles WHERE id = v_user_id;
    RAISE NOTICE '✓ Perfil eliminado';
    
    -- 14. Eliminar usuario de auth.users (DEFINITIVO)
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE '✓ Usuario eliminado de auth.users';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓✓✓ Usuario % eliminado completamente', v_email;
    RAISE NOTICE '========================================';
END $$;

-- 15. Reactivar RLS
SET session_replication_role = DEFAULT;

-- 16. Verificar eliminación
SELECT 
  'usuarios' as tabla, COUNT(*) as total FROM profiles
UNION ALL SELECT 'auth.users', COUNT(*) FROM auth.users
UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'comentarios', COUNT(*) FROM ticket_comments;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ⚠️  Esta operación es IRREVERSIBLE
-- ⚠️  Cambia 'EMAIL_DEL_USUARIO' en la línea 18 antes de ejecutar
-- ⚠️  El usuario será eliminado completamente de Supabase Auth
-- ⚠️  Todos los datos relacionados serán eliminados
-- ⚠️  Los tickets asignados al usuario quedarán sin asignar
-- ⚠️  Los activos asignados al usuario quedarán sin asignar
-- ============================================================================
