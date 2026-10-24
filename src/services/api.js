import axios from 'axios'

// Shared Axios client for all frontend-to-PHP API calls used by the library portal.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// If the backend session expires, force the app back to the login screen.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      window.dispatchEvent(new Event('session-expired'))
    }
    return Promise.reject(error)
  },
)

// Centralized request wrapper: all API endpoints must return { success: true/false }.
export const request = async (url, config) => {
  const response = await api(url, config)
  if (!response.data?.success) throw new Error(response.data?.message || 'The request could not be completed.')
  return response.data
}

export const authApi = {
  me: () => request('/auth/me.php'),
  login: (credentials) => request('/auth/login.php', { method: 'POST', data: credentials }),
  changePassword: (credentials) => request('/auth/change-password.php', { method: 'POST', data: credentials }),
  logout: () => request('/auth/logout.php', { method: 'POST' }),
}

export const studentsApi = {
  list: (params = {}) => request('/students/list.php', { params }),
  get: (id) => request(`/students/get.php?id=${encodeURIComponent(id)}`),
  create: (student) => request('/students/create.php', { method: 'POST', data: student }),
  update: (student) => request('/students/update.php', { method: 'POST', data: student }),
  remove: (id, action = 'delete') => request('/students/delete.php', { method: 'POST', data: { id, action } }),
}

export const visitsApi = {
  create: (payload) => request('/visitor-logs/create.php', { method: 'POST', data: payload }),
  list: (params = {}) => request('/visitor-logs/list.php', { params }),
}

export const reportsApi = {
  dashboard: () => request('/reports/dashboard.php'),
  analytics: (params = {}) => request('/reports/analytics.php', { params }),
  exportUrl: (params = {}) => {
    const search = new URLSearchParams(params).toString()
    return `${import.meta.env.VITE_API_BASE_URL || '/api'}/reports/export.php${search ? `?${search}` : ''}`
  },
}

export default api
