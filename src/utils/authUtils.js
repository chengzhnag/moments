import { useLocalStorageState, useRequest, useUpdateEffect } from 'ahooks';
import { authApi } from './api';

/**
 * 认证状态管理Hook
 * 使用ahooks的useLocalStorageState来管理本地存储的认证状态
 */
export const useAuthStorage = () => {
  // 用户信息缓存
  const [user, setUser] = useLocalStorageState('auth_user', {
    defaultValue: null,
    serializer: (value) => JSON.stringify(value),
    deserializer: (value) => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  });

  // 认证凭据缓存
  const [credentials, setCredentials] = useLocalStorageState('auth_credentials', {
    defaultValue: null,
    serializer: (value) => JSON.stringify(value),
    deserializer: (value) => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  });

  // 登录时间缓存
  const [loginTime, setLoginTime] = useLocalStorageState('auth_login_time', {
    defaultValue: null,
    serializer: (value) => JSON.stringify(value),
    deserializer: (value) => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  });

  // 清除所有认证缓存
  const clearAuthCache = () => {
    setUser(null);
    setCredentials(null);
    setLoginTime(null);
    authApi.clearAuth();
  };

  // 保存认证信息
  const saveAuthInfo = (userInfo, account, password) => {
    setUser(userInfo);
    setCredentials({ account, password });
    setLoginTime(new Date().toISOString());
  };

  // 检查认证是否过期（默认24小时）
  const isAuthExpired = (expireHours = 24) => {
    if (!loginTime) return true;
    
    const loginDate = new Date(loginTime);
    const now = new Date();
    const diffHours = (now - loginDate) / (1000 * 60 * 60);
    
    return diffHours > expireHours;
  };

  return {
    user,
    credentials,
    loginTime,
    setUser,
    setCredentials,
    setLoginTime,
    clearAuthCache,
    saveAuthInfo,
    isAuthExpired
  };
};

/**
 * 自动登录Hook
 * 使用ahooks的useRequest来处理自动登录逻辑
 */
export const useAutoLogin = () => {
  const { 
    user, 
    credentials, 
    clearAuthCache, 
    saveAuthInfo, 
    isAuthExpired 
  } = useAuthStorage();

  // 自动登录请求
  const { 
    loading: autoLoginLoading, 
    run: runAutoLogin,
    data: autoLoginResult 
  } = useRequest(
    async () => {
      if (!credentials || isAuthExpired()) {
        throw new Error('认证已过期，请重新登录');
      }

      // 恢复认证状态
      authApi.restoreAuth(credentials.account, credentials.password);
      
      // 验证认证是否有效
      const isValid = await authApi.validateAuth();
      if (!isValid) {
        throw new Error('认证已失效，请重新登录');
      }

      // 获取最新用户信息
      const currentUser = authApi.getCurrentUser();
      if (currentUser) {
        saveAuthInfo(currentUser, credentials.account, credentials.password);
        return currentUser;
      }

      throw new Error('获取用户信息失败');
    },
    {
      manual: true,
      onError: (error) => {
        console.error('Auto login failed:', error);
        clearAuthCache();
      }
    }
  );

  return {
    autoLoginLoading,
    runAutoLogin,
    autoLoginResult,
    canAutoLogin: !!credentials && !isAuthExpired()
  };
};

/**
 * 登录Hook
 * 使用ahooks的useRequest来处理登录逻辑
 */
export const useLogin = () => {
  const { saveAuthInfo, clearAuthCache } = useAuthStorage();

  const { 
    loading: loginLoading, 
    run: runLogin,
    data: loginResult,
    error: loginError 
  } = useRequest(
    async (account, password) => {
      const result = await authApi.login(account, password);
      
      // 登录成功，保存认证信息
      saveAuthInfo(result.user, account, password);
      
      return result;
    },
    {
      manual: true,
      onError: (error) => {
        console.error('Login failed:', error);
        clearAuthCache();
      }
    }
  );

  return {
    loginLoading,
    runLogin,
    loginResult,
    loginError
  };
};

/**
 * 登出Hook
 */
export const useLogout = () => {
  const { clearAuthCache } = useAuthStorage();

  const logout = () => {
    authApi.logout();
    clearAuthCache();
  };

  return { logout };
};

/**
 * 认证状态监听Hook
 * 使用ahooks的useUpdateEffect来监听认证状态变化
 */
export const useAuthListener = (onAuthChange) => {
  const { user } = useAuthStorage();

  useUpdateEffect(() => {
    if (onAuthChange) {
      onAuthChange(!!user, user);
    }
  }, [user]);

  return { isAuthenticated: !!user, user };
};

/**
 * 认证工具函数
 */
export const authUtils = {
  /**
   * 检查认证状态
   */
  checkAuth: () => {
    const user = localStorage.getItem('auth_user');
    const credentials = localStorage.getItem('auth_credentials');
    const loginTime = localStorage.getItem('auth_login_time');
    
    if (!user || !credentials || !loginTime) {
      return false;
    }

    try {
      const loginDate = new Date(JSON.parse(loginTime));
      const now = new Date();
      const diffHours = (now - loginDate) / (1000 * 60 * 60);
      
      return diffHours <= 24; // 24小时内有效
    } catch {
      return false;
    }
  },

  /**
   * 获取缓存的用户信息
   */
  getCachedUser: () => {
    try {
      const userStr = localStorage.getItem('auth_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * 清除所有认证相关缓存
   */
  clearAllAuth: () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_credentials');
    localStorage.removeItem('auth_login_time');
    authApi.clearAuth();
  }
}; 