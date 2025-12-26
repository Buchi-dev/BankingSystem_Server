const API_BASE = 'http://localhost:5000/api/v1'; // Matches your base path

export const client = async (endpoint, { body, ...customConfig } = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = { 
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: { ...headers, ...customConfig.headers },
  };

  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // Standardizes your "Standard Error Response Format"
    throw new Error(data.message || 'Something went wrong');
  }

  return data.data; // Unwraps the "data" object automatically
};
