import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface PublicStore {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalUSD: () => number;
}

export const usePublicStore = create<PublicStore>()(
    persist(
        (set, get) => ({
            cart: [],
            addToCart: (product: Product) => set((state: PublicStore) => {
                const existing = state.cart.find(i => i.id === product.id);
                if (existing) {
                    return {
                        cart: state.cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
                    };
                }
                return {
                    cart: [...state.cart, {
                        id: product.id,
                        name: product.name,
                        price: product.price_usd,
                        quantity: 1,
                        image_url: product.image_url
                    }]
                };
            }),
            removeFromCart: (id: number) => set((state: PublicStore) => ({
                cart: state.cart.filter(i => i.id !== id)
            })),
            updateQuantity: (id: number, quantity: number) => set((state: PublicStore) => ({
                cart: state.cart.map(i => i.id === id ? { ...i, quantity } : i)
            })),
            clearCart: () => set({ cart: [] }),
            totalItems: () => get().cart.reduce((acc, item) => acc + item.quantity, 0),
            totalUSD: () => get().cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        }),
        {
            name: 'public-cart-storage',
        }
    )
);
