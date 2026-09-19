import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [], // [{ dish, quantity, note }]
  
  addItem: (dish, quantity = 1, note = '') => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.dish.id === dish.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          note: note || updated[existingIndex].note,
        };
        return { items: updated };
      }
      return { items: [...state.items, { dish, quantity, note }] };
    });
  },

  updateQuantity: (dishId, delta) => {
    set((state) => {
      const updated = state.items
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
      return { items: updated };
    });
  },

  updateNote: (dishId, note) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.dish.id === dishId ? { ...item, note } : item
      ),
    }));
  },

  removeItem: (dishId) => {
    set((state) => ({
      items: state.items.filter((item) => item.dish.id !== dishId),
    }));
  },

  clearCart: () => set({ items: [] }),

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.dish.price * item.quantity, 0);
  },
}));
