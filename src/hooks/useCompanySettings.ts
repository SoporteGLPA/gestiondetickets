
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanySettings {
  id: string;
  project_name: string;
  logo_url: string | null;
  auth_background_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      // Obtener el ID de la configuración actual
      const { data: current } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single();

      if (!current) throw new Error('No company settings found');

      const { data, error } = await supabase
        .from('company_settings')
        .update(updates)
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: "Configuración actualizada",
        description: "La configuración de la empresa ha sido actualizada exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración de la empresa",
      });
    },
  });
}
