import React from 'react'
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Input, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { employeeApi } from '../../api/employee';

export function EmployeeLoginForm() {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: employeeApi.login,
    onSuccess: (data) => {
      // Store token
      localStorage.setItem('token', data.token);
      // Store employee info if needed
      localStorage.setItem('employee', JSON.stringify(data.employee));
      message.success('Employee login successful!');
      // Navigate to employee dashboard
      navigate({ to: '/employee/dashboard' }); // Adjust the route as needed
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
      name="employee-login"
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
        <Button block type="primary" htmlType="submit" loading={loginMutation.isPending}>
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
}