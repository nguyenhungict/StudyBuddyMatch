import api from './api';
import Cookies from 'js-cookie';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export const authService = {
  // Đăng ký
  register: async (data: RegisterData) => {
    return await api.post('/auth/register', data);
  },

  // Đăng nhập
  login: async (data: LoginData) => {
    const res = await api.post('/auth/login', data);
    if (res.data.accessToken) {
      Cookies.set('accessToken', res.data.accessToken, { expires: 7 });
      Cookies.set('user', JSON.stringify(res.data.user), { expires: 7 });
    }
    return res.data;
  },

  // Quên mật khẩu
  forgotPassword: async (email: string) => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Đặt lại mật khẩu
  resetPassword: async (token: string, newPassword: string) => {
    return await api.post('/auth/reset-password', { token, newPassword });
  },

  // --- [MỚI] ĐỔI MẬT KHẨU ---
  changePassword: async (currentPassword: string, newPassword: string) => {
    // Gọi API PATCH /auth/change-password
    return await api.patch('/auth/change-password', { currentPassword, newPassword });
  },

  // Đăng xuất
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('user');
      // Không redirect ở đây - để AuthContext.logout() xử lý redirect
    }
  },

  // Lấy user hiện tại
  getCurrentUser: () => {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};