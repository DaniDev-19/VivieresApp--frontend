import { useState, useEffect } from "react";

/**
 * Hook que retorna un valor con debounce.
 * Útil para retrasar búsquedas y evitar llamadas excesivas a la API.
 *
 * @param value - El valor a aplicar debounce
 * @param delay - Tiempo de espera en milisegundos (por defecto 300ms)
 * @returns El valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
