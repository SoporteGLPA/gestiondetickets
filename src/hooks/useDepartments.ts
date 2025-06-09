
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCategory {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Department[];
    },
  });
}

export function useDepartmentCategories(departmentId?: string) {
  return useQuery({
    queryKey: ['department-categories', departmentId],
    queryFn: async () => {
      let query = supabase
        .from('department_categories')
        .select('*')
        .eq('is_active', true);

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data as DepartmentCategory[];
    },
    enabled: !!departmentId,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from('departments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Departamento creado",
        description: "El departamento ha sido creado exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el departamento",
      });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Departamento actualizado",
        description: "El departamento ha sido actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el departamento",
      });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (departmentId: string) => {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: false })
        .eq('id', departmentId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Departamento eliminado",
        description: "El departamento ha sido eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el departamento",
      });
    },
  });
}

export function useCreateDepartmentCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { 
      department_id: string; 
      name: string; 
      description?: string; 
      color?: string; 
    }) => {
      const { data: result, error } = await supabase
        .from('department_categories')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-categories'] });
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la categoría",
      });
    },
  });
}
