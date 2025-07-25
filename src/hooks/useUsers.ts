
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUsers() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los usuarios",
        });
        throw error;
      }

      return data as User[];
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: {
      full_name: string;
      email: string;
      password: string;
      role: UserRole;
      department?: string;
      is_active: boolean;
    }) => {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
            department: userData.department,
            is_active: userData.is_active,
          }
        }
      });

      if (authError) throw authError;

      // If user was created successfully, update the profile with the correct role
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: userData.role,
            department: userData.department,
            is_active: userData.is_active,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el usuario",
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: {
      id: string;
      full_name: string;
      email: string;
      role: UserRole;
      department?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          is_active: userData.is_active,
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el usuario",
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuario desactivado",
        description: "El usuario ha sido desactivado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error deactivating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo desactivar el usuario",
      });
    },
  });
}
