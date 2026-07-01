const API_BASE_URL = 'http://localhost:5001/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginApi(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getMeApi() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function createTicketApi(ticketData) {
  const res = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(ticketData)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getTicketsApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/tickets${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getTicketByIdApi(id) {
  const res = await fetch(`${API_BASE_URL}/tickets/${id}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function updateTicketApi(id, updates) {
  const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function closeTicketApi(id, closureReason) {
  const res = await fetch(`${API_BASE_URL}/tickets/${id}/close`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ closureReason })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function addCommentApi(id, text) {
  const res = await fetch(`${API_BASE_URL}/tickets/${id}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// Admin APIs
export async function getUsersApi() {
  const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function updateUserApi(id, updates) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function assignTicketApi(ticketId, agentEmail) {
  const res = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/assign`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ agentEmail })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getConfigApi() {
  const res = await fetch(`${API_BASE_URL}/admin/config`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function updateConfigApi(config) {
  const res = await fetch(`${API_BASE_URL}/admin/config`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(config)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getReportsApi() {
  const res = await fetch(`${API_BASE_URL}/admin/reports`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getNotificationsApi() {
  const res = await fetch(`${API_BASE_URL}/notifications`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}
