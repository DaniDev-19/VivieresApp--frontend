import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ImportProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DraftProduct {
    row_index: number;
    barcode: string;
    name: string;
    cost_price: number;
    profit_margin: number;
    stock_quantity: number;
    min_stock_level: number;
    description: string;
}

export function ImportProductsModal({ isOpen, onClose }: ImportProductsModalProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<1 | 2>(1);
    const [file, setFile] = useState<File | null>(null);
    const [drafts, setDrafts] = useState<DraftProduct[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep(1);
        setFile(null);
        setDrafts([]);
        setIsParsing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
            toast.error("Por favor selecciona un archivo Excel (.xlsx o .xls)");
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const { data } = await api.post("/products/import/parse", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setDrafts(data.drafts);
            setStep(2);
            toast.success("Archivo leído correctamente");
        } catch (error: any) {
            console.error("Error parsing Excel:", error);
            toast.error(error.response?.data?.detail || "Error al procesar el archivo Excel");
            setFile(null);
        } finally {
            setIsParsing(false);
        }
    };

    const handleDraftChange = (index: number, field: keyof DraftProduct, value: any) => {
        const newDrafts = [...drafts];
        newDrafts[index] = { ...newDrafts[index], [field]: value };
        setDrafts(newDrafts);
    };

    const removeDraft = (index: number) => {
        setDrafts(drafts.filter((_, i) => i !== index));
    };

    const importMutation = useMutation({
        mutationFn: async (products: any[]) => {
            const { data } = await api.post("/products/import/bulk", products);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success(`Importación completada: ${data.created} creados, ${data.updated} actualizados.`);
            if (data.errors && data.errors.length > 0) {
                toast.error(`Hubo ${data.errors.length} errores. Revisa la consola.`);
                console.error("Errores de importación:", data.errors);
            }
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al importar los productos");
        }
    });

    const handleImport = () => {
        // Validar filas
        const validDrafts = drafts.filter(d => d.barcode.trim() && d.name.trim());
        if (validDrafts.length === 0) {
            toast.error("No hay filas válidas para importar. Asegúrate de que tengan Código y Nombre.");
            return;
        }

        if (validDrafts.length < drafts.length) {
            toast.warning(`Se ignorarán ${drafts.length - validDrafts.length} filas incompletas.`);
        }

        importMutation.mutate(validDrafts);
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Productos" maxWidth="max-w-5xl">
            <div className="p-4">
                {step === 1 && (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <FileSpreadsheet className="w-16 h-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sube tu archivo Excel</h3>
                        <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
                            El archivo debe tener las cabeceras en la primera fila. Detectaremos automáticamente las columnas de Código, Nombre, Costo, Precio y Stock.
                        </p>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isParsing}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isParsing ? (
                                <>Procesando...</>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Seleccionar Archivo
                                </>
                            )}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Borrador de Importación</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">Revisa y edita los datos antes de guardarlos. Las filas sin código o nombre serán ignoradas.</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{drafts.length} filas detectadas</span>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-3 py-3">Fila</th>
                                        <th className="px-3 py-3">Código *</th>
                                        <th className="px-3 py-3 w-1/3">Nombre *</th>
                                        <th className="px-3 py-3">Costo ($)</th>
                                        <th className="px-3 py-3">Margen (%)</th>
                                        <th className="px-3 py-3">Stock</th>
                                        <th className="px-3 py-3">Min. Stock</th>
                                        <th className="px-3 py-3 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drafts.map((draft, idx) => {
                                        const isValid = draft.barcode.trim() && draft.name.trim();
                                        return (
                                            <tr key={idx} className={`border-b dark:border-gray-700 ${isValid ? 'bg-white dark:bg-gray-900' : 'bg-red-50 dark:bg-red-900/10'}`}>
                                                <td className="px-3 py-2 font-mono text-xs">{draft.row_index}</td>
                                                <td className="px-3 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={draft.barcode} 
                                                        onChange={(e) => handleDraftChange(idx, 'barcode', e.target.value)}
                                                        className={`w-full p-1 border rounded ${!draft.barcode.trim() ? 'border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-transparent'}`}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={draft.name} 
                                                        onChange={(e) => handleDraftChange(idx, 'name', e.target.value)}
                                                        className={`w-full p-1 border rounded ${!draft.name.trim() ? 'border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-transparent'}`}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input 
                                                        type="number" step="0.01" min="0"
                                                        value={draft.cost_price} 
                                                        onChange={(e) => handleDraftChange(idx, 'cost_price', parseFloat(e.target.value) || 0)}
                                                        className="w-20 p-1 border border-gray-200 dark:border-gray-700 rounded bg-transparent"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input 
                                                        type="number" step="0.01" min="0" max="1"
                                                        value={draft.profit_margin} 
                                                        onChange={(e) => handleDraftChange(idx, 'profit_margin', parseFloat(e.target.value) || 0)}
                                                        className="w-16 p-1 border border-gray-200 dark:border-gray-700 rounded bg-transparent"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input 
                                                        type="number" min="0"
                                                        value={draft.stock_quantity} 
                                                        onChange={(e) => handleDraftChange(idx, 'stock_quantity', parseInt(e.target.value) || 0)}
                                                        className="w-16 p-1 border border-gray-200 dark:border-gray-700 rounded bg-transparent"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input 
                                                        type="number" min="0"
                                                        value={draft.min_stock_level} 
                                                        onChange={(e) => handleDraftChange(idx, 'min_stock_level', parseInt(e.target.value) || 0)}
                                                        className="w-16 p-1 border border-gray-200 dark:border-gray-700 rounded bg-transparent"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button onClick={() => removeDraft(idx)} className="text-gray-400 hover:text-red-500">
                                                        <X className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button
                                onClick={resetState}
                                disabled={importMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importMutation.isPending || drafts.length === 0}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {importMutation.isPending ? "Guardando..." : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Confirmar e Importar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
