import React, { useState } from 'react';
import { Button, Form, Input, Select, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ShopOutlined, GlobalOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { userApi } from '../../api/user';

const { Option } = Select;

const businessTypes = [
  { value: 'food', label: 'Food & Beverage' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Services' },
  { value: 'transport', label: 'Transport' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

export function RegisterForm() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('personal');

  const registerMutation = useMutation({
    mutationFn: userApi.register,
    onSuccess: () => {
      message.success('Registration successful! Please login.');
      navigate({ to: '/' });
    },
    onError: (error) => {
      message.error(error.message || 'Registration failed');
    },
  });

  const onFinish = (values) => {
    const { firstName, lastName, middleInitial, email, password, businessName, businessType, protocol, websiteUrl: urlPart } = values;

    const payload = {
      fullName: { firstName, lastName, middleInitial },
      email,
      password,
      accountType,
    };

    if (accountType === 'business') {
      payload.businessInfo = {
        businessName,
        businessType,
        websiteUrl: `${protocol}://${urlPart}`,
      };
    }

    registerMutation.mutate(payload);
  };

  return (
    <Form
      name="register"
      onFinish={onFinish}
      initialValues={{ accountType: 'personal', protocol: 'https' }}
      style={{ maxWidth: 360 }}
    >
      <Form.Item
        name="accountType"
        rules={[{ required: true, message: 'Please select account type!' }]}
      >
        <Select placeholder="Select account type" onChange={setAccountType}>
          <Option value="personal">Personal Account</Option>
          <Option value="business">Business Account</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="firstName"
        rules={[
          { required: true, message: 'Please input your first name!' },
          { pattern: /^[A-Za-z ]+$/, message: 'First name must contain only letters!' }
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="First Name" />
      </Form.Item>

      <Form.Item
        name="lastName"
        rules={[
          { required: true, message: 'Please input your last name!' },
          { pattern: /^[A-Za-z ]+$/, message: 'Last name must contain only letters!' }
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="Last Name" />
      </Form.Item>

      <Form.Item
        name="middleInitial"
        rules={[
          { pattern: /^[A-Za-z]$/, message: 'Middle initial must be a single letter!' }
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="Middle Initial" maxLength={1} />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' },
          { pattern: /@smu\.edu\.ph$/, message: 'Email must be from smu.edu.ph domain!' }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { min: 10, message: 'Password must be at least 10 characters!' }
        ]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="Password" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your password!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match!'));
            },
          }),
        ]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="Confirm Password" />
      </Form.Item>

      {accountType === 'business' && (
        <>
          <Form.Item
            name="businessName"
            rules={[{ required: true, message: 'Please input your business name!' }]}
          >
            <Input prefix={<ShopOutlined />} placeholder="Business Name" />
          </Form.Item>

          <Form.Item
            name="businessType"
            rules={[{ required: true, message: 'Please select your business type!' }]}
          >
            <Select placeholder="Select business type">
              {businessTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            rules={[
              { required: true, message: 'Website URL is required for business accounts!' }
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="protocol"
                noStyle
                rules={[{ required: true, message: 'Please select protocol!' }]}
              >
                <Select style={{ width: '25%' }}>
                  <Option value="https">https://</Option>
                  <Option value="http">http://</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="websiteUrl"
                noStyle
                rules={[
                  { required: true, message: 'Please enter website URL!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const protocol = getFieldValue('protocol');
                      const fullUrl = `${protocol}://${value}`;
                      const urlPattern = /^https?:\/\/[\w.-]+(:\d+)?(\/.*)?$/;
                      if (!urlPattern.test(fullUrl)) {
                        return Promise.reject(new Error('Please enter a valid URL!'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input
                  style={{ width: '70%' }}
                  placeholder="example.com"
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        </>
      )}

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={registerMutation.isPending}
          block
        >
          Register
        </Button>
      </Form.Item>
    </Form>
  );
}

