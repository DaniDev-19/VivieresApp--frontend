"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Form Data compatible con OAuth2PasswordRequestForm
            const params = new URLSearchParams();
            params.append("username", username.trim());
            params.append("password", password.trim());

            const response = await api.post("/login/access-token", params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const { access_token, token_type } = response.data;

            // Decodificar token o pedir datos de usuario (por simplicidad, mockeamos rol o lo leemos del token si fuera JWT legible en cliente sin lib extra, pero mejor pedimos /me o asumimos backend devuelve todo.
            // El backend actual solo devuelve token. Vamos a asumir éxito y rol user por defecto o necesitaríamos un endpoint /me.
            // UPDATE: Backend endpoint auth devuelve {"access_token": ..., "token_type": "bearer"}
            // Para tener el rol, deberíamos decodificar el JWT.
            // Solución rápida: Backend puede devolver el user y rol en el login o hacemos un fetch a /users/me.
            // Por ahora, guardamos el token y decodificamos payload básico manualmente o llamamos a una API.

            // Parse token basic payload
            const base64Url = access_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);

            login(access_token, {
                id: payload.sub,
                username: username,
                role: payload.role || 'worker'
            });

            router.push("/dashboard");

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
            >
                <div className="bg-indigo-600 p-8 text-center text-white">
                    <h2 className="text-3xl font-bold">ViveresApp</h2>
                    <p className="mt-2 text-indigo-100">Bienvenido de nuevo</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Usuario
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="admin"
                                />
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 pr-10 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 dark:focus:ring-indigo-800"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Iniciando...
                                </>
                            ) : (
                                "Iniciar Sesión"
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
