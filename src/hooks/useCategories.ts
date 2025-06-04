
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export function useCategories() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .select('*')
        .order('name');

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las categorías",
        });
        throw error;
      }

      return data as Category[];
    },
  });
}
