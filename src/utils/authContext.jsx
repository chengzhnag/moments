import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api';
import { 
  saveAuthInfo, 
  getAuthInfo, 
  clearAuthCache, 
  isAuthExpired,
  canAutoLogin,
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
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 检查是否有有效的认证信息
        if (canAutoLogin()) {
          const authInfo = getAuthInfo();
          const credentials = authInfo.credentials;
          
          // 恢复API认证状态
          authApi.restoreAuth(credentials.account, credentials.password);
          
          // 直接使用缓存的用户信息，避免额外的API调用
          setUser(authInfo.user);
        } else {
          // 认证已过期或不存在，清除缓存
          if (getAuthInfo()) {
            clearAuthCache();
            authApi.clearAuth();
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        clearAuthCache();
        authApi.clearAuth();
      } finally {
        setLoading(false);
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
    canAutoLogin: canAutoLogin()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 