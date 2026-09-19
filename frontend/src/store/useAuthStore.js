import { create } from 'zustand';

const STORAGE_KEY_AUTH_TOKEN = 'resto_staff_token';
const STORAGE_KEY_AUTH_USER = 'resto_staff_user';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(STORAGE_KEY_AUTH_TOKEN) || null,
  user: JSON.parse(localStorage.getItem(STORAGE_KEY_AUTH_USER) || 'null'),

  login: (token, user) => {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    set({ token: null, user: null });
  },
}));
