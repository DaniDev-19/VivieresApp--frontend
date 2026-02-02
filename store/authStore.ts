import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'admin' | 'worker' | 'inventory_manager' | 'delivery';

interface User {
    id: number;
    username: string;
    role: UserRole;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isHydrated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isHydrated: false,
            login: (token, user) => set({ token, user, isAuthenticated: true }),
            logout: () => set({ token: null, user: null, isAuthenticated: false }),
            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
