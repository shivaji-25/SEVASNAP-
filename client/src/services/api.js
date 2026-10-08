/**
 * SEVASNAP Centralized API Service
 * All frontend-to-backend communication flows through this module.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request helper with error handling
 */
const request = async (endpoint, options = {}) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
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

// 1. Issues CRUD & queries
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

// 2. Status Lifecycle API (Forward only: reported -> assigned -> in_progress -> resolved)
export const updateIssueStatus = async (id, statusData) => {
  const response = await request(`/issues/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(statusData),
  });
  return response.data;
};

// 3. Upvote API (One vote per user/device)
export const upvoteIssue = async (id, deviceId) => {
  const response = await request(`/issues/${id}/upvote`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
  return response;
};

// 4. Image Upload (Multer)
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  return response; // contains { success, imageUrl, filename }
};

// 5. AI Sentinel Triage Analysis
export const analyzeIssue = async ({ image, location, description, presetKey }) => {
  const response = await request('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ image, location, description, presetKey }),
  });
  return response.data;
};

// 6. Authority Statistics & Telemetry
export const getAuthorityStats = async () => {
  const response = await request('/authority/stats');
  return response.data;
};
