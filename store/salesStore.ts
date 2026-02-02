import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    product_id: number;
    barcode: string;
    name: string;
    price: number; // Unit price (USD)
    quantity: number;
    tax_rate: number;
    profit_margin: number;
    priceBasis?: 'USD' | 'BCV' | 'USDT' | 'COP';
}

export interface ExchangeRates {
    BCV: number;
    USDT: number;
    COP: number;
}

interface SalesState {
    cart: CartItem[];
    rates: ExchangeRates;
    displayCurrency: 'USD' | 'BCV' | 'USDT' | 'COP';
    deliveryUSD: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addToCart: (product: any) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    updateItemBasis: (productId: number, basis: CartItem['priceBasis']) => void;
    clearCart: () => void;

    setRates: (rates: ExchangeRates) => void;
    setDisplayCurrency: (currency: SalesState['displayCurrency']) => void;
    setDeliveryUSD: (amount: number) => void;

    // Computed
    totalUSD: () => number;
    totalTax: () => number;
    totalConverted: () => number;
    totalItems: () => number;
}

export const useSalesStore = create<SalesState>()(
    persist(
        (set, get) => ({
            cart: [],
            rates: { BCV: 0, USDT: 0, COP: 0 },
            displayCurrency: 'USD',
            deliveryUSD: 0,

            addToCart: (product) => {
                const { cart, displayCurrency } = get();
                const existing = cart.find((item) => item.product_id === product.id);

                if (existing) {
                    set({
                        cart: cart.map((item) =>
                            item.product_id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                } else {
                    set({
                        cart: [
                            ...cart,
                            {
                                product_id: product.id,
                                barcode: product.barcode,
                                name: product.name,
                                price: product.price_usd,
                                quantity: 1,
                                tax_rate: product.tax_rate,
                                profit_margin: product.profit_margin,
                                priceBasis: displayCurrency === 'USD' ? 'USD' : displayCurrency as any
                            },
                        ],
                    });
                }
            },

            removeFromCart: (productId) => {
                set({ cart: get().cart.filter((item) => item.product_id !== productId) });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeFromCart(productId);
                    return;
                }
                set({
                    cart: get().cart.map((item) =>
                        item.product_id === productId ? { ...item, quantity } : item
                    ),
                });
            },

            updateItemBasis: (productId, basis) => {
                set({
                    cart: get().cart.map((item) =>
                        item.product_id === productId ? { ...item, priceBasis: basis } : item
                    ),
                });
            },

            clearCart: () => set({ cart: [] }),

            setRates: (rates) => set({ rates }),
            setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
            setDeliveryUSD: (deliveryUSD) => set({ deliveryUSD: Number(deliveryUSD) || 0 }),

            // Total en USD (sin IVA)
            totalUSD: () => {
                const state = get();
                return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            },

            // Total de IVA
            totalTax: () => {
                const state = get();
                return state.cart.reduce((sum, item) => {
                    const itemSubtotal = item.price * item.quantity;
                    const itemTax = itemSubtotal * (item.tax_rate || 0);
                    return sum + itemTax;
                }, 0);
            },

            // Total convertido a la moneda de visualización (incluyendo IVA y Delivery)
            totalConverted: () => {
                const { displayCurrency, rates, deliveryUSD } = get();
                const totalUSD = get().totalUSD() + get().totalTax() + deliveryUSD;

                if (displayCurrency === 'USD') return totalUSD;

                const rate = rates[displayCurrency as keyof ExchangeRates] || 1;
                return Number((totalUSD * rate).toFixed(2));
            },

            totalItems: () => {
                return get().cart.reduce((total, item) => total + item.quantity, 0);
            }
        }),
        {
            name: 'sales-storage',
        }
    )
);
