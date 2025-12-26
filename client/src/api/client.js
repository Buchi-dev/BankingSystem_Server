const API_URL = 'http://localhost:5000/api'; // Your Node Backend URL

export const client = async (endpoint, { body, ...customConfig } = {}) => {
  const token = localStorage.getItem('token'); // Get the real JWT token
  
  const headers = { 
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // Auto-attach Token
  };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // This allows React Query to see the error and show it on screen
    throw new Error(data.message || 'Server Error');
  }

  return data;
};
