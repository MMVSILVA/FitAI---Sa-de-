import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase, auth } from './services/supabase';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import ProjectDetail from './screens/ProjectDetail';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockUserStr = localStorage.getItem('mock_user');
    if (mockUserStr) {
      try {
        const mockUser = JSON.parse(mockUserStr);
        setUser(mockUser);
        auth.currentUser = mockUser;
        setLoading(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      auth.currentUser = session?.user ?? null;
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('mock_user')) {
        setUser(session?.user ?? null);
        auth.currentUser = session?.user ?? null;
      }
    });

    // Custom event listener for mock logout
    const handleStorageChange = () => {
      if (!localStorage.getItem('mock_user')) {
        setUser(null);
        auth.currentUser = null;
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mock_logout', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mock_logout', handleStorageChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-neon-purple animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/project/:id" 
          element={user ? <ProjectDetail /> : <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
