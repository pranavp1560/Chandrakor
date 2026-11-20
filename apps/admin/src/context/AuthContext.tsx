import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@chandrakor/supabase-client';
import { AdminProfile, Role } from '@chandrakor/shared-types';

interface AuthContextType {
  admin: AdminProfile | null;
  role: Role | null;
  permissions: string[];
  session: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
  isSuperAdmin: boolean;
  bootstrapFirstAdmin: (fullName: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminProfile = async (userId: string) => {
    try {
      // 1. Fetch admin profile
      const { data: profile, error } = await supabase
        .from('admin_profiles')
        .select('*, role:roles(*)')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !profile) {
        console.warn('User has no active admin profile in admin_profiles table.');
        setAdmin(null);
        setRole(null);
        setPermissions([]);
        return null;
      }

      setAdmin(profile as AdminProfile);
      setRole(profile.role as Role);

      // 2. Fetch role permissions
      if (profile.role_id) {
        const { data: perms } = await supabase
          .from('role_permissions')
          .select('permission:permissions(permission_key)')
          .eq('role_id', profile.role_id);

        if (perms) {
          const permKeys = perms
            .map((p: any) => p.permission?.permission_key)
            .filter(Boolean);
          setPermissions(permKeys);
        }
      }

      return profile;
    } catch (e) {
      console.error('Error fetching admin profile:', e);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        if (initialSession?.user) {
          await fetchAdminProfile(initialSession.user.id);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await fetchAdminProfile(newSession.user.id);
      } else {
        setAdmin(null);
        setRole(null);
        setPermissions([]);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed: No user returned.' };
      }

      // Check whether this user has an active admin profile
      const profile = await fetchAdminProfile(data.user.id);
      if (!profile) {
        // Sign out unauthorized user
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Access Denied: This account is not registered as an authorized Chandrakor administrator.',
        };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred during login.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setAdmin(null);
      setRole(null);
      setPermissions([]);
    } catch (e) {
      console.error('Error logging out:', e);
    }
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!admin) return false;
    if (role?.name === 'Super Admin') return true;
    return permissions.includes(permissionKey);
  };

  const isSuperAdmin = role?.name === 'Super Admin';

  const bootstrapFirstAdmin = async (fullName: string): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user) {
      return { success: false, error: 'Must be logged in to bootstrap admin.' };
    }

    try {
      const { data, error } = await supabase.rpc('bootstrap_super_admin', {
        p_user_id: session.user.id,
        p_full_name: fullName.trim(),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await fetchAdminProfile(session.user.id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to bootstrap super admin' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        role,
        permissions,
        session,
        isLoading,
        login,
        logout,
        hasPermission,
        isSuperAdmin,
        bootstrapFirstAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
