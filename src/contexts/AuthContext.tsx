import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  location?: string;
  teachSkills: Skill[];
  learnSkills: Skill[];
}

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  experienceLevel?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  addSkill: (skill: Omit<Skill, 'id'>, type: 'teach' | 'learn') => Promise<void>;
  removeSkill: (skillId: string, type: 'teach' | 'learn') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/users/me`);
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`${API_URL}/api/users/me`, userData);
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (skill: Omit<Skill, 'id'>, type: 'teach' | 'learn') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/users/skills`, { 
        skill, 
        type 
      });
      
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add skill');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeSkill = async (skillId: string, type: 'teach' | 'learn') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.delete(`${API_URL}/api/users/skills/${skillId}?type=${type}`);
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove skill');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      updateProfile,
      addSkill,
      removeSkill
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};