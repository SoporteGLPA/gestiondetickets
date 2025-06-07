
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CollaborationArea {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCollaborationArea {
  id: string;
  user_id: string;
  area_id: string;
  assigned_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  collaboration_areas: {
    name: string;
  };
}

export function useCollaborationAreas() {
  return useQuery({
    queryKey: ['collaboration-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_areas')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as CollaborationArea[];
    },
  });
}

export function useUserCollaborationAreas() {
  return useQuery({
    queryKey: ['user-collaboration-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_collaboration_areas')
        .select(`
          *,
          profiles:user_id(full_name, email),
          collaboration_areas:area_id(name)
        `);

      if (error) throw error;
      return data as UserCollaborationArea[];
    },
  });
}

export function useCreateCollaborationArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from('collaboration_areas')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration-areas'] });
      toast({
        title: "Área creada",
        description: "El área de colaboración ha sido creada exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el área de colaboración",
      });
    },
  });
}

export function useAssignUserToArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { user_id: string; area_id: string }) => {
      const { data: result, error } = await supabase
        .from('user_collaboration_areas')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-collaboration-areas'] });
      toast({
        title: "Usuario asignado",
        description: "El usuario ha sido asignado al área exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo asignar el usuario al área",
      });
    },
  });
}
