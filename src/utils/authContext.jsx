import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStorage, useAutoLogin, useLogin, useLogout } from './authUtils';
import { authApi } from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  
  // 使用认证存储Hook
  const { 
    user, 
    credentials, 
    clearAuthCache, 
    isAuthExpired 
  } = useAuthStorage();

  // 使用自动登录Hook
  const { 
    autoLoginLoading, 
    runAutoLogin, 
    canAutoLogin 
  } = useAutoLogin();

  // 使用登录Hook
  const { 
    loginLoading, 
    runLogin, 
    loginError 
  } = useLogin();

  // 使用登出Hook
  const { logout } = useLogout();

  // 检查初始认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 如果有缓存的认证信息且未过期，尝试自动登录
        if (canAutoLogin) {
          await runAutoLogin();
        } else if (credentials && isAuthExpired()) {
          // 认证已过期，清除缓存
          clearAuthCache();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuthCache();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录方法
  const login = async (account, password) => {
    try {
      const result = await runLogin(account, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // 登出方法
  const handleLogout = () => {
    logout();
  };

  const value = {
    user,
    loading: loading || autoLoginLoading || loginLoading,
    login,
    logout: handleLogout,
    isAuthenticated: !!user,
    loginError,
    canAutoLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 