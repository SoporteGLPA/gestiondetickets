
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
}

export function FileUpload({ 
  files, 
  onFilesChange, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = "*/*"
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validar número máximo de archivos
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Demasiados archivos",
        description: `Solo se pueden adjuntar máximo ${maxFiles} archivos`,
      });
      return;
    }

    // Validar tamaño de archivos
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: `Los archivos no pueden superar ${formatFileSize(maxSize)}`,
      });
      return;
    }

    // Agregar archivos válidos
    const validFiles = selectedFiles.filter(file => file.size <= maxSize);
    onFilesChange([...files, ...validFiles]);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    
    if (files.length + droppedFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Demasiados archivos",
        description: `Solo se pueden adjuntar máximo ${maxFiles} archivos`,
      });
      return;
    }

    const validFiles = droppedFiles.filter(file => file.size <= maxSize);
    const oversizedFiles = droppedFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: `Los archivos no pueden superar ${formatFileSize(maxSize)}`,
      });
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center gap-2">
          <Paperclip className="h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            <Button
              type="button"
              variant="link"
              onClick={() => fileInputRef.current?.click()}
              className="p-0 h-auto text-sm"
            >
              Seleccionar archivos
            </Button>
            {' '}o arrastrarlos aquí
          </div>
          <p className="text-xs text-gray-500">
            Máximo {maxFiles} archivos, {formatFileSize(maxSize)} cada uno
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Archivos adjuntos ({files.length}/{maxFiles}):</p>
          <div className="space-y-1">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
