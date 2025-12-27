import { client } from './client';

export const employeeApi = {
  // keys for TanStack Query
  keys: {
    all: ['employee', 'all'],
    detail: (id) => ['employee', 'detail', id],
  },

  // Auth (Public routes)
  login: (credentials) => client('/employees/login', { body: credentials }),

  // Employee Management (Protected routes - admin/staff only)
  register: (employeeData) => client('/employees/register', { body: employeeData }),

  getAllEmployees: () => client('/employees'),

  getEmployeeById: (id) => client(`/employees/${id}`),

  updateEmployee: (id, data) => client(`/employees/${id}`, { method: 'PUT', body: data }),

  deleteEmployee: (id) => client(`/employees/${id}`, { method: 'DELETE' }),

  verifyEmployee: (id) => client(`/employees/${id}/verify`, { method: 'PATCH' }),
};