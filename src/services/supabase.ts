/// <reference types="vite/client" />
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  currentUser: null as User | null,
};

supabase.auth.onAuthStateChange((event, session) => {
  auth.currentUser = session?.user ?? null;
});

export const loginWithGoogle = () => supabase.auth.signInWithOAuth({ provider: 'google' });
const isMock = supabaseUrl.includes('placeholder');

export const loginWithEmail = async (email: string, pass: string) => {
  if (isMock) {
    const mockUser = { id: email, email } as User;
    auth.currentUser = mockUser;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    return { data: { user: mockUser, session: {} as any }, error: null };
  }
  return supabase.auth.signInWithPassword({ email, password: pass });
};

export const registerWithEmail = async (email: string, pass: string) => {
  if (isMock) {
    const mockUser = { id: email, email } as User;
    auth.currentUser = mockUser;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    return { data: { user: mockUser, session: {} as any }, error: null };
  }
  return supabase.auth.signUp({ email, password: pass });
};

export const logout = async () => {
  if (isMock) {
    auth.currentUser = null;
    localStorage.removeItem('mock_user');
    window.dispatchEvent(new Event('mock_logout'));
    return { error: null };
  }
  return supabase.auth.signOut();
};

export const saveUserProfile = async (uid: string, data: { name: string, matricula: string, telefone?: string, photoURL?: string, email: string }) => {
  try {
    localStorage.setItem(`user_profile_${uid}`, JSON.stringify(data));
    if (!isMock) {
      const { error } = await supabase.from('users').upsert({ id: uid, ...data });
      if (error) console.error("Error saving user profile to Supabase:", error);
    }
  } catch (e) {
    console.error("Error saving profile:", e);
  }
};

export const getUserProfile = async (uid: string) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
    if (!error && data) {
      localStorage.setItem(`user_profile_${uid}`, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.error("Supabase fetch failed:", e);
  }
  
  // Fallback to localStorage
  const localData = localStorage.getItem(`user_profile_${uid}`);
  if (localData) {
    return JSON.parse(localData);
  }
  return null;
};
