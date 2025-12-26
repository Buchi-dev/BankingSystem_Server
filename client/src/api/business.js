import { client } from './client';

export const businessApi = {
  keys: {
    profile: ['business', 'profile'],
    apiKeys: ['business', 'apiKeys'],
    origins: (keyId) => ['business', 'origins', keyId],
    pending: ['business', 'pending'], // Admin
    verified: ['business', 'verified'], // Admin
  },

  // Core Business
  register: (data) => client('/business/register', { body: data }),
  getProfile: () => client('/business/profile'),

  // API Key Management
  generateApiKey: (data) => client('/business/api-keys', { body: data }),
  listApiKeys: () => client('/business/api-keys'),
  revokeApiKey: (keyId) => client(`/business/api-keys/${keyId}`, { method: 'DELETE' }),

  // Origins (CORS)
  getOrigins: (keyId) => client(`/business/api-keys/${keyId}/origins`),
  addOrigin: (keyId, origin) => client(`/business/api-keys/${keyId}/origins`, { method: 'POST', body: { origin } }),
  removeOrigin: (keyId, origin) => client(`/business/api-keys/${keyId}/origins`, { method: 'DELETE', body: { origin } }),

  // Admin Verification
  getPending: () => client('/business/pending'),
  getVerified: () => client('/business/verified'),
  verifyBusiness: (id) => client(`/business/${id}/verify`, { method: 'PUT' }),
};
