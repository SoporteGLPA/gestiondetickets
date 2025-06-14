
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'agent' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  loading: boolean; // Alias for compatibility
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  const hasRole = (roles: string[]): boolean => {
    if (!profile?.role) return false;
    return roles.includes(profile.role);
  };

  useEffect(() => {
    if (initialCheckDone) return;

    const getSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setProfile(null);
        } else {
          setUser(session?.user ?? null);

          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
        setInitialCheckDone(true);
      }
    };

    getSession();
  }, [initialCheckDone]);

  useEffect(() => {
    if (!initialCheckDone) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        try {
          setUser(session?.user ?? null);

          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialCheckDone]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message || "Credenciales inválidas",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cerrar sesión",
        });
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      loading: isLoading, // Alias for compatibility
      signIn,
      signOut,
      updateProfile,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
