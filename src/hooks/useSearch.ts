
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
      
      const { data, error } = await supabase
        .rpc('search_tickets_and_articles', { search_term: searchTerm });

      if (error) throw error;
      return data as SearchResult[];
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
  });
}
