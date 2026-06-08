import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle 401 (Logout) and 403 (Forbidden)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            toast.error("Sesión expirada o no autorizada. Por favor, inicia sesión.");
        } else if (error.response?.status === 403) {
            toast.error("Acceso denegado: No tienes permisos para realizar esta acción.");
        }
        return Promise.reject(error);
    }
);

export default api;
