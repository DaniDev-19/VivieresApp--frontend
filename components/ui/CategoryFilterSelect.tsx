"use client";

import { Category } from "@/types";
import { ChevronDown, Filter } from "lucide-react";
import { clsx } from "clsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
                "w-full sm:w-44 md:w-48 shrink-0 p-2",
                className
            )}>
                <Select
                    value={value != null ? value.toString() : undefined}
                    onValueChange={(selectedValue) =>
                        onChange(selectedValue === "all" ? null : parseInt(selectedValue, 10))
                    }
                >
                    <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                        <Filter className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                        <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent align="end" position="popper">
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                <Select
                    value={value != null ? value.toString() : undefined}
                    onValueChange={(selectedValue) =>
                        onChange(selectedValue === "none" ? null : parseInt(selectedValue, 10))
                    }
                >
                    <SelectTrigger className="w-full min-w-0 cursor-pointer rounded-none bg-transparent px-0 py-0 text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none pr-6">
                        <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent align="end" position="popper">
                        <SelectItem value="none">Todas las categorías</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
        </div>
    );
}

