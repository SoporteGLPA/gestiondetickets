
-- Crear políticas para el bucket company-assets para manejar archivos de tickets
CREATE POLICY "Users can upload ticket files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-assets' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'ticket-attachments'
);

CREATE POLICY "Users can view ticket files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'company-assets' AND 
  (storage.foldername(name))[1] = 'ticket-attachments'
);

CREATE POLICY "Users can update ticket files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-assets' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'ticket-attachments'
);

CREATE POLICY "Users can delete ticket files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-assets' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'ticket-attachments'
);
