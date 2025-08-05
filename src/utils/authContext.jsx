import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api';
import {
  saveAuthInfo,
  getAuthInfo,
  clearAuthCache,
  isAuthExpired,
  getCurrentUser
} from './authUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const authInfo = getAuthInfo();
      if (authInfo) {
        if (isAuthExpired()) {
          login(authInfo.credentials.account, authInfo.credentials.password);
        } else {
          authApi.saveAuth(authInfo.credentials.account, authInfo.credentials.password, authInfo.user);
          setUser(authInfo.user);
        }
      }
    };
    initAuth();
  }, []);

  // 登录方法
  const login = async (account, password) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const result = await authApi.login(account, password);

      // 保存认证信息到本地存储
      saveAuthInfo(result.user, account, password);

      // 更新状态
      setUser(result.user);

      return result;
    } catch (error) {
      setLoginError(error.message);
      throw error;
    } finally {
      setLoginLoading(false);
    }
  };

  // 登出方法
  const logout = () => {
    authApi.logout();
    clearAuthCache();
    setUser(null);
    setLoginError(null);
  };

  const value = {
    user,
    loading: loading || loginLoading,
    login,
    logout,
    isAuthenticated: !!user,
    loginError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 