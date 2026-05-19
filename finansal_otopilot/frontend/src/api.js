const API_BASE = 'http://194.36.85.222:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('otopilot_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handle = async (res) => {
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('otopilot_token');
    window.dispatchEvent(new Event('auth_error')); // To trigger redirect to login
  }
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
};

const get = (p) => fetch(`${API_BASE}${p}`, { headers: getHeaders() }).then(handle);
const post = (p, b) => fetch(`${API_BASE}${p}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(b) }).then(handle);
const put = (p, b) => fetch(`${API_BASE}${p}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(b) }).then(handle);
const del = (p) => fetch(`${API_BASE}${p}`, { method: 'DELETE', headers: getHeaders() }).then(handle);

export const api = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (name, email, password) => post('/auth/register', { name, email, password }),

  listTransactions: () => get('/transactions'),
  createTransaction: (d) => post('/transactions', d),
  deleteTransaction: (id) => del(`/transactions/${id}`),

  parseText: (text) => post('/ai/parse-text', { text }),
  parseReceipt: (image, mimeType) => post('/ai/parse-receipt', { image, mimeType }),
  getInsight: () => get('/ai/insight'),
  chatNiko: (message, history) => post('/ai/chat', { message, history }),
  goalReminder: () => get('/ai/goal-reminder'),

  getProfile: () => get('/profile'),
  updateProfile: (d) => put('/profile', d),

  listSubscriptions: () => get('/subscriptions'),
  createSubscription: (d) => post('/subscriptions', d),
  deleteSubscription: (id) => del(`/subscriptions/${id}`),

  listFixedExpenses: () => get('/fixed-expenses'),
  createFixedExpense: (d) => post('/fixed-expenses', d),
  deleteFixedExpense: (id) => del(`/fixed-expenses/${id}`),

  resetAll: () => del('/reset'),

  listGoals: () => get('/goals'),
  createGoal: (d) => post('/goals', d),
  updateGoal: (id, d) => put(`/goals/${id}`, d),
  deleteGoal: (id) => del(`/goals/${id}`),
};

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      const c = r.indexOf(',');
      resolve(c >= 0 ? r.slice(c + 1) : r);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
