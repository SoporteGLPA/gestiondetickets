-- Crear una función para preservar los comentarios cuando se fusionan tickets
CREATE OR REPLACE FUNCTION preserve_merged_ticket_comments()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza merged_ticket_info, preservar todos los comentarios de ambos tickets
  IF NEW.merged_ticket_info IS NOT NULL AND OLD.merged_ticket_info IS NULL THEN
    -- No hacer nada especial - los comentarios se mantienen por ticket_id
    -- Solo registrar la operación
    INSERT INTO ticket_operations (
      ticket_id,
      operation_type,
      performed_by,
      notes
    ) VALUES (
      NEW.id,
      'merge_preserve_comments',
      auth.uid(),
      'Comentarios preservados durante fusión de tickets'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para preservar comentarios
DROP TRIGGER IF EXISTS preserve_comments_on_merge ON tickets;
CREATE TRIGGER preserve_comments_on_merge
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION preserve_merged_ticket_comments();