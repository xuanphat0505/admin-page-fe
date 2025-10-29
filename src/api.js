import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 10000,
  withCredentials: true,
  xsrfCookieName: 'csrfToken',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const skipRedirect = error?.config?.skipAuthRedirect

    if (status === 401 && !skipRedirect) {
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api

