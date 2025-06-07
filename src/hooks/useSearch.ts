
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  item_type: 'ticket' | 'article';
  id: string;
  title: string;
  content: string;
  created_at: string;
  status?: string;
  priority?: string;
}

export function useSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      try {
        // Buscar en tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            id,
            title,
            description,
            created_at,
            status,
            priority,
            ticket_number
          `)
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,ticket_number.ilike.%${searchTerm}%`)
          .limit(10);

        if (ticketsError) throw ticketsError;

        // Buscar en artículos
        const { data: articlesData, error: articlesError } = await supabase
          .from('knowledge_articles')
          .select(`
            id,
            title,
            content,
            created_at,
            summary
          `)
          .eq('is_published', true)
          .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)
          .limit(10);

        if (articlesError) throw articlesError;

        // Combinar resultados
        const results: SearchResult[] = [];

        // Agregar tickets
        if (ticketsData) {
          ticketsData.forEach(ticket => {
            results.push({
              item_type: 'ticket',
              id: ticket.id,
              title: ticket.title,
              content: ticket.description,
              created_at: ticket.created_at,
              status: ticket.status,
              priority: ticket.priority
            });
          });
        }

        // Agregar artículos
        if (articlesData) {
          articlesData.forEach(article => {
            results.push({
              item_type: 'article',
              id: article.id,
              title: article.title,
              content: article.content,
              created_at: article.created_at
            });
          });
        }

        // Ordenar por fecha de creación
        return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } catch (error) {
        console.error('Error searching:', error);
        return [];
      }
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
  });
}
