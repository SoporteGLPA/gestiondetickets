
import { useRef, useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface PastedImage {
  id: string;
  file: File;
  url: string;
  uploaded?: boolean;
  serverPath?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const { uploadFile, isUploading } = useFileUpload();

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          const id = Math.random().toString(36).substring(7);
          const url = URL.createObjectURL(file);
          
          const newImage: PastedImage = { id, file, url, uploaded: false };
          setPastedImages(prev => [...prev, newImage]);
          
          // Add image reference to text
          const imageRef = `[IMAGEN:${id}]`;
          const currentValue = textareaRef.current?.value || '';
          const newValue = currentValue + (currentValue ? '\n' : '') + imageRef;
          onChange(newValue);

          // Upload to server
          try {
            const uploadedFile = await uploadFile(file, 'ticket-attachments/images');
            if (uploadedFile) {
              setPastedImages(prev => 
                prev.map(img => 
                  img.id === id 
                    ? { ...img, uploaded: true, serverPath: uploadedFile.path }
                    : img
                )
              );
              
              // Update the text with server path
              const updatedValue = newValue.replace(
                `[IMAGEN:${id}]`, 
                `[IMAGEN:${uploadedFile.path}]`
              );
              onChange(updatedValue);
            }
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      }
    }
  };

  const removeImage = (imageId: string) => {
    setPastedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });

    // Remove reference from text
    const imageRef = `[IMAGEN:${imageId}]`;
    const newValue = value.replace(new RegExp(`\\n?\\[IMAGEN:${imageId}\\]\\n?`, 'g'), '');
    onChange(newValue.replace(/\n\n+/g, '\n\n'));
  };

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      pastedImages.forEach(image => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        className="min-h-[100px] resize-y"
      />
      
      {pastedImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Image className="h-4 w-4" />
            Imágenes pegadas:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {pastedImages.map((image) => (
              <div key={image.id} className="relative border rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt="Imagen pegada"
                  className="w-full h-24 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                  {image.file.name}
                  {!image.uploaded && (
                    <span className="text-yellow-300"> (Subiendo...)</span>
                  )}
                  {image.uploaded && (
                    <span className="text-green-300"> ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Puede pegar imágenes directamente desde el portapapeles (Ctrl+V)
        {isUploading && <span className="text-yellow-600"> - Subiendo archivos...</span>}
      </p>
    </div>
  );
}
