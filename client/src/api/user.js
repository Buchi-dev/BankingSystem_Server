import { client } from './client';

export const userApi = {
  // keys for TanStack Query
  keys: {
    profile: ['user', 'profile'],
    all: ['user', 'all'],
    detail: (id) => ['user', 'detail', id],
  },

  // Auth
  login: (credentials) => client('/users/login', { body: credentials }),
  
  register: (userData) => client('/users/register', { body: userData }),

  // Profile
  getProfile: () => client('/users/profile'),

  // Admin Only
  getAllUsers: () => client('/users'),
  getUserById: (id) => client(`/users/${id}`),
  updateUser: (id, data) => client(`/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id) => client(`/users/${id}`, { method: 'DELETE' }),
};
