import React from 'react'
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Input, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { userApi } from '../../api/user';


export function LoginForm() {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: userApi.login,
    onSuccess: (data) => {
      // Store token
      localStorage.setItem('token', data.token);
      // Store user info if needed
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('Login successful!');
      // Navigate to dashboard or home
      navigate({ to: '/dashboard' }); // Adjust the route as needed
    },
    onError: (error) => {
      message.error(error.message || 'Login failed');
    },
  });

  const onFinish = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <Form
      name="login"
      initialValues={{ remember: true }}
      style={{ maxWidth: 360 }}
      onFinish={onFinish}
    >
      <Form.Item
        name="email"
        rules={[{ required: true, message: 'Please input your Email!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your Password!' }]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Flex justify="space-between" align="center">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <a href="">Forgot password</a>
        </Flex>
      </Form.Item>

      <Form.Item>
        <Button block type="primary" htmlType="submit" loading={loginMutation.isPending}>
          Log in
        </Button>
        or <a href="">Register now!</a>
      </Form.Item>
    </Form>
  )
}

