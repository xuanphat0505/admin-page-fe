import axios from 'axios'

// Tạo instance Axios: gửi kèm cookie (HttpOnly) cho phiên đăng nhập
// và CSRF token (nếu có) trong header
const api = axios.create({
  baseURL: 'http://localhost:5000', // có thể đổi sang biến môi trường khi deploy
  timeout: 10000,                   
  withCredentials: true,            // gửi/nhận cookie cùng request
  xsrfCookieName: 'csrfToken',      // tên cookie CSRF do server cấp
  xsrfHeaderName: 'X-CSRF-Token',   // header FE gửi lại cho server
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // để server nhận biết request từ AJAX
  },
})

// Chuyển hướng về /login khi gặp lỗi 401 (chưa đăng nhập/hết hạn)
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
