
-- Agregar columnas para nombres separados y fecha de vencimiento a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Agregar columna de fecha de vencimiento a la tabla tickets
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Actualizar los nombres existentes dividiendo full_name en first_name y last_name
UPDATE public.profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 
    THEN SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;
