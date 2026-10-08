/**
 * SEVASNAP Centralized API Service
 * All frontend-to-backend communication flows through this module.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request helper with error handling & token attachment
 */
const request = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('sevasnap_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    // If uploading FormData, delete Content-Type to let browser set boundary
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${endpoint}]:`, error.message);
    throw error;
  }
};

// ==========================================
// AUTHENTICATION APIs
// ==========================================

export const registerCitizen = async (data) => {
  return await request('/auth/register-citizen', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const loginCitizen = async (data) => {
  return await request('/auth/login-citizen', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const registerAuthority = async (data) => {
  return await request('/auth/register-authority', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const loginAuthority = async (data) => {
  return await request('/auth/login-authority', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getMe = async () => {
  return await request('/auth/me');
};

// ==========================================
// ISSUES & CIVIC APIs
// ==========================================

export const getIssues = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.priority) query.append('priority', params.priority);
  if (params.lat && params.lng) {
    query.append('lat', params.lat);
    query.append('lng', params.lng);
    if (params.radiusInMeters) query.append('radiusInMeters', params.radiusInMeters);
  }

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await request(`/issues${queryString}`);
  return response.data || [];
};

export const getNearbyIssues = async (lat, lng, radiusInMeters = 5000, category = 'all') => {
  const query = new URLSearchParams({ lat, lng, radius: radiusInMeters });
  if (category && category !== 'all') query.append('category', category);
  const response = await request(`/issues/nearby?${query.toString()}`);
  return response.data || [];
};

export const checkDuplicateIssue = async (lat, lng, category) => {
  const response = await request('/issues/check-duplicate', {
    method: 'POST',
    body: JSON.stringify({ lat, lng, category }),
  });
  return response;
};


export const getIssueById = async (id) => {
  const response = await request(`/issues/${id}`);
  return response.data;
};

export const createIssue = async (issueData) => {
  const response = await request('/issues', {
    method: 'POST',
    body: JSON.stringify(issueData),
  });
  return response;
};

export const updateIssue = async (id, updateData) => {
  const response = await request(`/issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
  return response.data;
};

export const deleteIssue = async (id) => {
  return await request(`/issues/${id}`, {
    method: 'DELETE',
  });
};

// Status Lifecycle API (Forward only: reported -> assigned -> in_progress -> resolved)
export const updateIssueStatus = async (id, statusData) => {
  const response = await request(`/issues/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(statusData),
  });
  return response.data;
};

// Upvote API (One vote per user/device)
export const upvoteIssue = async (id, deviceId) => {
  const response = await request(`/issues/${id}/upvote`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
  return response;
};

// Image Upload (Multer)
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  return response;
};

// AI Sentinel Triage Analysis
export const analyzeIssue = async ({ image, location, description, presetKey }) => {
  const response = await request('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ image, location, description, presetKey }),
  });
  return response.data;
};

// Authority Statistics & Telemetry
export const getAuthorityStats = async () => {
  const response = await request('/authority/stats');
  return response.data;
};
