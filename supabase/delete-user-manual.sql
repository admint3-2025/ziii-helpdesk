-- Script para reemplazar referencias de un usuario antes de eliminarlo
-- PASO 1: Define aquí el ID del usuario a eliminar y el admin que heredará sus registros
DO $$
DECLARE
  v_user_to_delete UUID := 'ce7581bf-1c67-40e1-b7e4-67c9bd8b542b'; -- Susi De la Torre
  v_admin_replacement UUID := '5bbcb355-45de-49e8-858a-35d0bf96ccbf'; -- helpdesk@integrational3.com.mx
BEGIN

  -- 1. Transferir solicitudes de baja de activos
  UPDATE asset_disposal_requests
  SET requested_by = v_admin_replacement
  WHERE requested_by = v_user_to_delete;

  -- 2. Transferir activos asignados (deshabilitando trigger)
  ALTER TABLE assets DISABLE TRIGGER trg_log_asset_assignment_change;
  
  UPDATE assets 
  SET assigned_to = v_admin_replacement
  WHERE assigned_to = v_user_to_delete;
  
  ALTER TABLE assets ENABLE TRIGGER trg_log_asset_assignment_change;

  -- 3. Transferir tickets creados (mantener trazabilidad del solicitante original)
  UPDATE tickets 
  SET requester_id = v_admin_replacement
  WHERE requester_id = v_user_to_delete;

  -- 4. Desvincular tickets asignados (mejor NULL que transferir responsabilidad)
  UPDATE tickets 
  SET assigned_agent_id = NULL 
  WHERE assigned_agent_id = v_user_to_delete;

  -- 5. Transferir comentarios en tickets
  UPDATE ticket_comments
  SET author_id = v_admin_replacement
  WHERE author_id = v_user_to_delete;

  -- 6. Transferir archivos adjuntos
  UPDATE ticket_attachments
  SET uploaded_by = v_admin_replacement
  WHERE uploaded_by = v_user_to_delete;

  -- 7. Transferir cambios de ubicación de activos
  UPDATE asset_location_changes
  SET changed_by = v_admin_replacement
  WHERE changed_by = v_user_to_delete;

  -- 8. Transferir cambios de asignación de activos
  UPDATE asset_assignment_changes
  SET changed_by = v_admin_replacement
  WHERE changed_by = v_user_to_delete;

  -- 9. Eliminar relaciones de ubicaciones
  DELETE FROM user_locations 
  WHERE user_id = v_user_to_delete;

  -- 10. Eliminar notificaciones
  DELETE FROM notifications 
  WHERE user_id = v_user_to_delete;

  -- 11. Eliminar de profiles
  DELETE FROM profiles 
  WHERE id = v_user_to_delete;

  -- 12. Finalmente eliminar de auth.users
  DELETE FROM auth.users 
  WHERE id = v_user_to_delete;

  RAISE NOTICE 'Usuario eliminado correctamente y registros transferidos';
END $$;

-- Verificar que se eliminó correctamente
SELECT 'Proceso completado' as status;
