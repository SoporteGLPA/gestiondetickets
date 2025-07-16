
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, folder: string = 'ticket-attachments'): Promise<UploadedFile | null> => {
    try {
      setIsUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      return {
        id: fileName,
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir el archivo",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[], folder: string = 'ticket-attachments'): Promise<UploadedFile[]> => {
    const uploadPromises = files.map(file => uploadFile(file, folder));
    const results = await Promise.all(uploadPromises);
    return results.filter(result => result !== null) as UploadedFile[];
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading
  };
}
