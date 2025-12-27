import React from 'react';
import { Modal } from 'antd';
import { EmployeeLoginForm } from '../forms/EmployeeLoginForm';

export function EmployeeModal({ open, onCancel }) {
	return (
		<Modal
			open={open}
			onCancel={onCancel}
			footer={null}
			title="Employee Login"
			destroyOnClose
			bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '00px' }}
			style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
		>
			<EmployeeLoginForm />
		</Modal>
	);
}
