import { create } from 'zustand';
import axios from 'axios';

const STORAGE_KEY_TOKEN = 'resto_guest_session_token';
const STORAGE_KEY_TABLE = 'resto_guest_table_no';

export const useSessionStore = create((set, get) => ({
  sessionToken: localStorage.getItem(STORAGE_KEY_TOKEN) || null,
  tableNo: parseInt(localStorage.getItem(STORAGE_KEY_TABLE) || '1', 10),
  isLoading: false,

  setTableNo: (tableNo) => {
    localStorage.setItem(STORAGE_KEY_TABLE, tableNo.toString());
    set({ tableNo });
    // Sync with backend if session token exists
    const token = get().sessionToken;
    if (token) {
      axios.post('/api/session', { table_no: tableNo }, {
        headers: { 'X-Session-Token': token }
      }).catch(console.error);
    }
  },

  initSession: async (preferredTable = null) => {
    const currentTable = preferredTable || get().tableNo || 1;
    const currentToken = get().sessionToken;

    set({ isLoading: true });
    try {
      const headers = currentToken ? { 'X-Session-Token': currentToken } : {};
      const res = await axios.post('/api/session', { table_no: currentTable }, { headers });
      const { session_token, table_no } = res.data;
      
      localStorage.setItem(STORAGE_KEY_TOKEN, session_token);
      localStorage.setItem(STORAGE_KEY_TABLE, table_no.toString());
      set({ sessionToken: session_token, tableNo: table_no, isLoading: false });
      return session_token;
    } catch (err) {
      console.error('Failed to initialize session:', err);
      set({ isLoading: false });
      return null;
    }
  },
}));
