
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Ticket, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SearchResultsProps {
  searchTerm: string;
  onClose: () => void;
}

export function SearchResults({ searchTerm, onClose }: SearchResultsProps) {
  const navigate = useNavigate();
  const { data: results, isLoading } = useSearch(searchTerm);

  const handleResultClick = (result: any) => {
    if (result.item_type === 'ticket') {
      navigate(`/tickets/${result.id}`);
    } else {
      navigate(`/knowledge/article/${result.id}`);
    }
    onClose();
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baja': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'abierto': return 'destructive';
      case 'en_progreso': return 'default';
      case 'pendiente': return 'secondary';
      case 'resuelto': return 'default';
      case 'cerrado': return 'outline';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Buscando...</span>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50">
        <CardContent className="p-4 text-center text-muted-foreground">
          No se encontraron resultados para "{searchTerm}"
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
      <CardContent className="p-2">
        <div className="space-y-2">
          {results.map((result) => (
            <div
              key={`${result.item_type}-${result.id}`}
              className="p-3 rounded-lg hover:bg-accent cursor-pointer border"
              onClick={() => handleResultClick(result)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {result.item_type === 'ticket' ? (
                    <Ticket className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{result.title}</h4>
                    {result.priority && (
                      <Badge variant={getPriorityColor(result.priority)} className="text-xs">
                        {result.priority.toUpperCase()}
                      </Badge>
                    )}
                    {result.status && (
                      <Badge variant={getStatusColor(result.status)} className="text-xs">
                        {result.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(result.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
