import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ImportProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DraftProduct {
    row_index: number;
    barcode: string;
    name: string;
    description: string;
    cost_price: number;
    profit_margin: number;
    tax_rate: number;
    offer_price_usd: number | null;
    stock_quantity: number;
    min_stock_level: number;
    category_id: number | null;
    provider_id: number | null;
    is_public: boolean;
    apply_iva_web: boolean;
}

const thCls = "px-3 py-3 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-300";

export function ImportProductsModal({ isOpen, onClose }: ImportProductsModalProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<1 | 2>(1);
    const [file, setFile] = useState<File | null>(null);
    const [drafts, setDrafts] = useState<DraftProduct[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar categorías y proveedores para los selectores
    const { data: categories = [] } = useQuery<any[]>({
        queryKey: ["categories-for-import"],
        queryFn: async () => (await api.get("/categories")).data,
        enabled: isOpen,
        staleTime: 1000 * 60 * 5,
    });

    const { data: providers = [] } = useQuery<any[]>({
        queryKey: ["providers-for-import"],
        queryFn: async () => (await api.get("/providers/")).data,
        enabled: isOpen,
        staleTime: 1000 * 60 * 5,
    });

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
            const enriched: DraftProduct[] = (data.drafts as any[]).map((d) => ({
                row_index: d.row_index,
                barcode: d.barcode ?? "",
                name: d.name ?? "",
                description: d.description ?? "",
                cost_price: d.cost_price ?? 0,
                profit_margin: d.profit_margin ?? 0.30,
                tax_rate: d.tax_rate ?? 0.16,
                offer_price_usd: d.offer_price_usd ?? null,
                stock_quantity: d.stock_quantity ?? 0,
                min_stock_level: d.min_stock_level ?? 5,
                category_id: d.category_id ?? null,
                provider_id: d.provider_id ?? null,
                is_public: d.is_public ?? true,
                apply_iva_web: d.apply_iva_web ?? true,
            }));
            setDrafts(enriched);
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
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Productos" size="6xl">
            <div className="w-full">
                {step === 1 && (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <FileSpreadsheet className="w-16 h-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sube tu archivo Excel</h3>
                        <p className="text-sm text-gray-500 text-center mb-2 max-w-md">
                            El archivo debe tener las cabeceras en la primera fila. Detectaremos automáticamente las columnas de Código, Nombre, Costo, Precio y Stock.
                        </p>
                        <p className="text-xs text-gray-400 text-center mb-6 max-w-md">
                            Campos opcionales: <span className="font-mono">descripcion, margen, iva, precio_oferta, stock, stock_minimo, categoria_id, proveedor_id, visible, aplica_iva_web</span>
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
                                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Borrador de Importación</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">Revisa y edita los datos antes de guardarlos. Las filas sin código o nombre serán ignoradas.</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300 shrink-0 ml-4">{drafts.length} filas detectadas</span>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto max-h-[55vh] border border-gray-200 dark:border-gray-700 rounded-xl">
                            <table className="text-sm text-left text-gray-500 dark:text-gray-400" style={{ minWidth: "1600px" }}>
                                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className={`${thCls} w-[160px]`}>* Código</th>
                                        <th className={`${thCls} w-[220px]`}>* Nombre</th>
                                        <th className={`${thCls} w-[180px]`}>Descripción</th>
                                        <th className={`${thCls} w-[100px]`}>Costo ($)</th>
                                        <th className={`${thCls} w-[95px]`}>Margen</th>
                                        <th className={`${thCls} w-[90px]`}>IVA</th>
                                        <th className={`${thCls} w-[110px]`}>P. Oferta ($)</th>
                                        <th className={`${thCls} w-[90px]`}>Stock</th>
                                        <th className={`${thCls} w-[100px]`}>Min. Stock</th>
                                        <th className={`${thCls} w-[170px]`}>Categoría</th>
                                        <th className={`${thCls} w-[170px]`}>Proveedor</th>
                                        <th className={`${thCls} w-[80px] text-center`}>Visible</th>
                                        <th className={`${thCls} w-[80px] text-center`}>IVA Web</th>
                                        <th className={`${thCls} w-[60px] text-center`}>✕</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drafts.map((draft, idx) => {
                                        const isValid = draft.barcode.trim() && draft.name.trim();
                                        return (
                                            <tr key={idx} className={`border-b dark:border-gray-700 ${isValid ? "bg-white dark:bg-gray-900" : "bg-red-50/50 dark:bg-red-900/10"}`}>
                                                {/* Código */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="text"
                                                        value={draft.barcode}
                                                        onChange={(e) => handleDraftChange(idx, "barcode", e.target.value)}
                                                        className={`h-8 w-full ${!draft.barcode.trim() ? "border-red-500 focus-visible:ring-red-500/50" : ""}`}
                                                    />
                                                </td>
                                                {/* Nombre */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="text"
                                                        value={draft.name}
                                                        onChange={(e) => handleDraftChange(idx, "name", e.target.value)}
                                                        className={`h-8 w-full ${!draft.name.trim() ? "border-red-500 focus-visible:ring-red-500/50" : ""}`}
                                                    />
                                                </td>
                                                {/* Descripción */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="text"
                                                        value={draft.description}
                                                        onChange={(e) => handleDraftChange(idx, "description", e.target.value)}
                                                        className="h-8 w-full"
                                                        placeholder="Opcional..."
                                                    />
                                                </td>
                                                {/* Costo */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number" step="0.01" min="0"
                                                        value={draft.cost_price}
                                                        onChange={(e) => handleDraftChange(idx, "cost_price", parseFloat(e.target.value) || 0)}
                                                        className="h-8 w-full"
                                                    />
                                                </td>
                                                {/* Margen */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number" step="0.01" min="0" max="10"
                                                        value={draft.profit_margin}
                                                        onChange={(e) => handleDraftChange(idx, "profit_margin", parseFloat(e.target.value) || 0)}
                                                        className="h-8 w-full"
                                                        title="Ej: 0.30 = 30%"
                                                    />
                                                </td>
                                                {/* IVA */}
                                                <td className="px-3 py-2">
                                                    <Select
                                                        value={draft.tax_rate.toString()}
                                                        onValueChange={(val) => handleDraftChange(idx, "tax_rate", parseFloat(val))}
                                                    >
                                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper" align="start">
                                                            <SelectItem value="0">0%</SelectItem>
                                                            <SelectItem value="0.16">16%</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                {/* Precio Oferta */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number" step="0.01" min="0"
                                                        value={draft.offer_price_usd ?? ""}
                                                        onChange={(e) => handleDraftChange(idx, "offer_price_usd", e.target.value === "" ? null : parseFloat(e.target.value))}
                                                        className="h-8 w-full"
                                                        placeholder="—"
                                                    />
                                                </td>
                                                {/* Stock */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number" min="0"
                                                        value={draft.stock_quantity}
                                                        onChange={(e) => handleDraftChange(idx, "stock_quantity", parseInt(e.target.value) || 0)}
                                                        className="h-8 w-full"
                                                    />
                                                </td>
                                                {/* Min. Stock */}
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number" min="0"
                                                        value={draft.min_stock_level}
                                                        onChange={(e) => handleDraftChange(idx, "min_stock_level", parseInt(e.target.value) || 0)}
                                                        className="h-8 w-full"
                                                    />
                                                </td>
                                                {/* Categoría */}
                                                <td className="px-3 py-2">
                                                    <Select
                                                        value={draft.category_id != null ? draft.category_id.toString() : "none"}
                                                        onValueChange={(val) => handleDraftChange(idx, "category_id", val === "none" ? null : parseInt(val))}
                                                    >
                                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-gray-900">
                                                            <SelectValue placeholder="Sin categoría" />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper" align="start">
                                                            <SelectItem value="none">Sin categoría</SelectItem>
                                                            {(categories as any[]).map((c: any) => (
                                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                {/* Proveedor */}
                                                <td className="px-3 py-2">
                                                    <Select
                                                        value={draft.provider_id != null ? draft.provider_id.toString() : "none"}
                                                        onValueChange={(val) => handleDraftChange(idx, "provider_id", val === "none" ? null : parseInt(val))}
                                                    >
                                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-gray-900">
                                                            <SelectValue placeholder="Sin proveedor" />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper" align="start">
                                                            <SelectItem value="none">Sin proveedor</SelectItem>
                                                            {(providers as any[]).map((p: any) => (
                                                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                {/* Visible */}
                                                <td className="px-3 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={draft.is_public}
                                                        onChange={(e) => handleDraftChange(idx, "is_public", e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        title="Visible en catálogo público"
                                                    />
                                                </td>
                                                {/* IVA Web */}
                                                <td className="px-3 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={draft.apply_iva_web}
                                                        onChange={(e) => handleDraftChange(idx, "apply_iva_web", e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        title="Aplicar IVA en pedidos web"
                                                    />
                                                </td>
                                                {/* Eliminar fila */}
                                                <td className="px-3 py-2 text-center">
                                                    <button onClick={() => removeDraft(idx)} className="text-gray-400 hover:text-red-500 cursor-pointer">
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
