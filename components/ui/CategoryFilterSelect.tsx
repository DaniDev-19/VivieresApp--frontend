"use client";

import { Category } from "@/types";
import { ChevronDown, Filter } from "lucide-react";
import { clsx } from "clsx";

interface CategoryFilterSelectProps {
    categories: Category[];
    value: number | null;
    onChange: (categoryId: number | null) => void;
    className?: string;
    compact?: boolean;
}

export function CategoryFilterSelect({
    categories,
    value,
    onChange,
    className = "",
    compact = false,
}: CategoryFilterSelectProps) {
    if (!categories.length) return null;

    if (compact) {
        return (
            <div className={clsx(
                "flex min-w-0 items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 focus-within:shadow-indigo-500/5",
                className
            )}>
                <Filter className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <div className="relative min-w-0 flex-1">
                    <select
                        value={value ?? ""}
                        onChange={(e) =>
                            onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        title="Filtrar por categoría"
                        className="w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none pr-6 sm:text-sm"
                    >
                        <option value="" className="bg-white dark:bg-gray-900">Todas las categorías</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id} className="bg-white dark:bg-gray-900">
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={clsx(
                "flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15",
                className
            )}
        >
            <Filter className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <div className="relative min-w-0 flex-1">
                <select
                    value={value ?? ""}
                    onChange={(e) =>
                        onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    title="Filtrar por categoría"
                    className="w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none pr-6"
                >
                    <option value="" className="bg-white dark:bg-gray-900">Todas las categorías</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-white dark:bg-gray-900">
                            {cat.name}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
        </div>
    );
}

