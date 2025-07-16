
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Download, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketAttachmentsProps {
  ticketId: string;
}

export function TicketAttachments({ ticketId }: TicketAttachmentsProps) {
  const { data: attachments, isLoading } = useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select(`
          *,
          profiles:uploaded_by(full_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string | null) => {
    if (mimeType?.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('company-assets')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Archivos Adjuntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Archivos Adjuntos ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.mime_type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{attachment.file_size ? formatFileSize(attachment.file_size) : 'Tamaño desconocido'}</span>
                    <span>•</span>
                    <span>
                      Subido {formatDistanceToNow(new Date(attachment.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                    {attachment.profiles && (
                      <>
                        <span>•</span>
                        <span>por {attachment.profiles.full_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(attachment.file_path, attachment.file_name)}
                className="flex-shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
