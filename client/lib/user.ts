import api from './api';

export interface UserProfile {
  fullName?: string;
  school?: string;
  age?: number;
  gender?: string;
  gradeLevel?: string;
  bio?: string;
  subjects?: string[];
  studySchedule?: any;
  studyStyle?: string;
  learningGoals?: string[];
  recentAchievement?: string;
  avatar?: string;
}

export const userService = {
  // Lấy thông tin profile hiện tại từ Backend
  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data;
  },

  // Cập nhật profile
  updateProfile: async (data: UserProfile) => {
    const res = await api.patch('/users/profile', data);
    return res.data;
  },

  // Lấy profile công khai của user theo ID (không cần auth)
  getPublicProfile: async (userId: string) => {
    const res = await api.get(`/users/${userId}/public-profile`);
    return res.data;
  }
};