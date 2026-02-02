import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages?: number;
    hasNextPage?: boolean;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export function Pagination({
    page,
    totalPages,
    hasNextPage,
    onPageChange,
    isLoading
}: PaginationProps) {
    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex w-full justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1 || isLoading}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={(totalPages ? page >= totalPages : !hasNextPage) || isLoading}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Siguiente
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                        Página <span className="font-medium">{page}</span>
                        {totalPages && (
                            <>
                                {" "}de <span className="font-medium">{totalPages}</span>
                            </>
                        )}
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1 || isLoading}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                        >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>


                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={(totalPages ? page >= totalPages : !hasNextPage) || isLoading}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                        >
                            <span className="sr-only">Siguiente</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}
