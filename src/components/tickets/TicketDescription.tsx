
import { supabase } from '@/integrations/supabase/client';

interface TicketDescriptionProps {
  description: string;
}

export function TicketDescription({ description }: TicketDescriptionProps) {
  const renderDescription = (text: string) => {
    // Look for image references in format [IMAGEN:path] or [IMAGEN:id]
    const imageRegex = /\[IMAGEN:([^\]]+)\]/g;
    const parts = text.split(imageRegex);
    
    return parts.map((part, index) => {
      // If index is odd, it's an image ID or path
      if (index % 2 === 1) {
        // Check if it's a server path (contains slashes) or just an ID
        if (part.includes('/')) {
          // It's a server path, get the public URL
          const { data } = supabase.storage
            .from('company-assets')
            .getPublicUrl(part);
          
          return (
            <div key={index} className="my-4">
              <img 
                src={data.publicUrl} 
                alt="Imagen adjunta" 
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: '400px' }}
              />
            </div>
          );
        } else {
          // It's just an ID (fallback for old format)
          return (
            <div key={index} className="my-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center text-gray-500">
                <span className="text-sm">Imagen pegada (ID: {part})</span>
              </div>
            </div>
          );
        }
      }
      
      // If it's normal text, return as-is
      return part;
    });
  };

  return (
    <div className="whitespace-pre-wrap">
      {renderDescription(description)}
    </div>
  );
}
