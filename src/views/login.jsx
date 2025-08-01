import React, { useState } from "react";
import { 
  Form, 
  Input, 
  Button, 
  Toast, 
  Card
} from "antd-mobile";
import { EyeInvisibleOutline, EyeOutline, UserOutline, LockOutline } from "antd-mobile-icons";
import { useRequest } from "ahooks";
import { useAuth } from "../utils/authContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // 使用 ahooks 的 useRequest 处理登录请求
  const { loading, run: login } = useRequest(
    async (values) => {
      const result = await authLogin(values.account, values.password);
      return result;
    },
    {
      manual: true,
      onSuccess: (data) => {
        Toast.show({
          icon: 'success',
          content: '登录成功！',
        });
        // 登录成功后跳转到主页
        navigate('/');
      },
      onError: (error) => {
        Toast.show({
          icon: 'fail',
          content: error.message || '登录失败，请重试',
        });
      },
    }
  );

  // 处理表单提交
  const onFinish = (values) => {
    login(values);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '614px',
        margin: '0 auto'
      }}>
        <Card 
          style={{ 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            background: '#fff'
          }}
        >
          <div style={{ padding: '12px' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '40px',
              color: '#333'
            }}>
              <h2 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '28px',
                fontWeight: '500',
                color: '#1a1a1a'
              }}>
                登录
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#666',
                fontSize: '14px'
              }}>
                请输入您的账号和密码
              </p>
            </div>

            <Form
              form={form}
              onFinish={onFinish}
              layout="vertical"
              footer={
                <Button
                  block
                  color="primary"
                  size="large"
                  loading={loading}
                  style={{
                    borderRadius: '8px',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '500',
                    marginTop: '32px'
                  }}
                  type="submit"
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
              }
            >
              <Form.Item
                name="account"
                label="账号"
                rules={[
                  { required: true, message: '请输入账号' },
                  { min: 3, message: '账号至少3个字符' }
                ]}
              >
                <Input
                  placeholder="请输入账号"
                  prefix={<UserOutline />}
                  style={{
                    borderRadius: '8px',
                    height: '48px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input
                  placeholder="请输入密码"
                  type={visible ? 'text' : 'password'}
                  prefix={<LockOutline />}
                  extra={
                    <div onClick={() => setVisible(!visible)}>
                      {visible ? <EyeOutline /> : <EyeInvisibleOutline />}
                    </div>
                  }
                  style={{
                    borderRadius: '8px',
                    height: '48px'
                  }}
                />
              </Form.Item>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;