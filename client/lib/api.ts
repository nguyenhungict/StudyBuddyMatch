import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:8888/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Tự động thêm Token vào Header
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Xử lý lỗi (Đã sửa logic chặn reload)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu là lỗi 401 (Hết hạn token hoặc Sai pass)
    if (error.response?.status === 401) {
      // [FIX] Chỉ logout/redirect nếu ĐÂY KHÔNG PHẢI LÀ REQUEST LOGIN
      // Nếu đang login mà bị 401 (sai pass), ta không muốn redirect, ta muốn hiện lỗi đỏ.
      if (!error.config.url.includes('/auth/login')) {
        Cookies.remove('accessToken');
        Cookies.remove('user');
        if (typeof window !== 'undefined') {
          // Kiểm tra xem có đang ở admin routes không
          const isAdminRoute = window.location.pathname.startsWith('/admin');
          // Redirect về trang login phù hợp
          window.location.href = isAdminRoute ? '/admin/signin' : '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;