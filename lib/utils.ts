import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function getImageUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
}

/**
 * Formatea un número de teléfono y un mensaje para generar un enlace wa.me funcional.
 * Maneja el formato de Venezuela (0412... -> 58412...) eliminando el 0 inicial.
 */
export function formatWhatsAppLink(phone: string, message: string) {
  // 1. Limpiar el número de cualquier caracter no numérico
  let cleanNumber = phone.replace(/\D/g, "");

  // 2. Si empieza por 0 y tiene 11 dígitos (formato nacional Vzla: 04121234567)
  if (cleanNumber.startsWith("0") && cleanNumber.length === 11) {
    cleanNumber = "58" + cleanNumber.substring(1);
  }
  // 3. Si tiene 10 dígitos y empieza por 4... (formato sin el 0 inicial: 4121234567)
  else if (cleanNumber.length === 10 && (cleanNumber.startsWith("412") || cleanNumber.startsWith("414") || cleanNumber.startsWith("424") || cleanNumber.startsWith("416") || cleanNumber.startsWith("426"))) {
    cleanNumber = "58" + cleanNumber;
  }
  // 4. Si ya tiene el 58 al inicio pero tiene el 0 (ej: 580412...)
  else if (cleanNumber.startsWith("580")) {
    cleanNumber = "58" + cleanNumber.substring(3);
  }
  // 5. Caso por defecto: asegurar que tenga al menos algo, si no tiene 58 pero es largo tratar de usarlo
  else if (cleanNumber.length > 5 && !cleanNumber.startsWith("58")) {
    // Si parece un número local de 10-11 dígitos pero no capturamos el 0, intentar ponerle 58
    if (cleanNumber.length === 10) cleanNumber = "58" + cleanNumber;
  }

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
