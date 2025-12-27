import { Modal, Row, Col, Typography } from 'antd';
import { LoginForm } from '../forms/LoginForm';
import { RegisterForm } from '../forms/RegisterForm';

export function AuthModal({ open, onCancel }) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={null}
      width={1200}
      styles={{ body: { padding: 0, borderRadius: 12, overflow: 'hidden' } }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      destroyOnHidden
    >
      <Row style={{ minHeight:  500, width: 1024 }}>
        <Col span={12} style={{ background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Typography.Title level={3} style={{ marginBottom: 24 }}>Sign In</Typography.Title>
          <LoginForm />
        </Col>
        <Col span={12} style={{ background: '#f7f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, borderLeft: '1px solid #eee' }}>
          <Typography.Title level={3} style={{ marginBottom: 24 }}>Register</Typography.Title>
          <RegisterForm />
        </Col>
      </Row>
    </Modal>
  );
}

