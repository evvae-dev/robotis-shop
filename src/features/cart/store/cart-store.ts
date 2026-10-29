"use client";

import { create } from "zustand";

interface CartState {
  items: Record<string, number>;
  wishes: string[];
  addItem: (id: string, quantity?: number) => void;
  toggleWish: (id: string) => void;
}

/** 모의 장바구니·관심상품만 관리하며 실제 주문이나 결제 요청은 전송하지 않습니다. */
export const useCartStore = create<CartState>((set) => ({
  items: {}, wishes: [],
  addItem: (id, quantity = 1) => set((state) => ({ items: { ...state.items, [id]: (state.items[id] || 0) + quantity } })),
  toggleWish: (id) => set((state) => ({ wishes: state.wishes.includes(id) ? state.wishes.filter((item) => item !== id) : [...state.wishes, id] })),
}));
