import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    toggleSidebarCollapsed: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: false,
            isSidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            toggleSidebarCollapsed: () =>
                set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            closeSidebar: () => set({ isSidebarOpen: false }),
            openSidebar: () => set({ isSidebarOpen: true }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
        }
    )
);
