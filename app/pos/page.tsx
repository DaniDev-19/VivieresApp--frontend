"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSalesStore, ExchangeRates } from "@/store/salesStore";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Loader2,
  UserPlus,
  User,
  Truck,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SaleTicket } from "@/components/sales/SaleTicket";
import { PosProductList } from "@/components/pos/PosProductList";
import { ProductDetailModal } from "@/components/inventory/ProductDetailModal";
import { CategoryFilterSelect } from "@/components/ui/CategoryFilterSelect";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Product, Category, Provider } from "@/types";

const PRODUCTS_PER_PAGE = 25;

export default function POSPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [showProviderFilter, setShowProviderFilter] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    cart, addToCart, removeFromCart, updateQuantity, updateItemBasis, updateItemPriceType, clearCart,
    totalUSD, totalTax, totalConverted, totalItems,
    rates, setRates, displayCurrency, setDisplayCurrency
  } = useSalesStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo_USD");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ cedula: "", name: "", phone: "", email: "" });
  const [hasDelivery, setHasDelivery] = useState(false);
  const [deliveryAmount, setDeliveryAmount] = useState(0);
  const [chargeBinanceTax, setChargeBinanceTax] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await api.get("/customers");
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });


  const { data: latestRates, refetch: refreshRates, isRefetching: isRefreshingRates } = useQuery({
    queryKey: ["latest-rates"],
    queryFn: async () => {
      const { data } = await api.get("/rates/");

      const ratesObj: any = { BCV: 0, USDT: 0, COP: 0 };
      // Procesar de más antiguo a más nuevo para que el más nuevo prevalezca,
      // o simplemente verificar si ya existe. Dado que vienen ordenados DESC:
      data.reverse().forEach((r: any) => { ratesObj[r.currency] = r.rate; });
      setRates(ratesObj);
      setLastUpdated(new Date());

      return ratesObj;
    },
    enabled: true,
    refetchOnWindowFocus: false
  });

  const refreshRatesMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/rates/refresh");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-rates"] });
      toast.success("Tasas actualizadas exitosamente desde el servidor");
    },
    onError: (err: any) => {
      toast.error("Error al actualizar las tasas", {
        description: err.response?.data?.detail || "No se pudo conectar con el servidor"
      });
    }
  });

  const isAnyRefreshing = isRefreshingRates || refreshRatesMutation.isPending;






  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (displayCurrency === 'USD') {
      setPaymentMethod('Efectivo_USD');
    } else if (displayCurrency === 'BCV') {
      setPaymentMethod('Efectivo_BS');
    } else if (displayCurrency === 'USDT') {
      setPaymentMethod('Binance');
    } else if (displayCurrency === 'COP') {
      setPaymentMethod('Efectivo_COP');
    }
  }, [displayCurrency]);

  const ALL_PAYMENT_METHODS = [
    { value: "Efectivo_USD", label: "Efectivo USD" },
    { value: "Efectivo_BS", label: "Efectivo BS" },
    { value: "Pago_Movil", label: "Pago Móvil" },
    { value: "Binance", label: "Binance" },
    { value: "Cashea", label: "Cashea" },
    { value: "Zinli", label: "Zinli" },
    { value: "Zelle", label: "Zelle" },
    { value: "Paypal", label: "Paypal" },
    { value: "Efectivo_COP", label: "Efectivo COP" }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);


  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: providers } = useQuery<Provider[]>({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data } = await api.get("/providers/");
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const isSearchActive = debouncedSearch.length >= 2;

  const { data: products, isLoading, isFetching } = useQuery<Product[]>({
    queryKey: ["pos-products", debouncedSearch, selectedCategory, selectedProvider, page],
    queryFn: async () => {
      const res = await api.get("/products/", {
        params: {
          skip: (page - 1) * PRODUCTS_PER_PAGE,
          limit: PRODUCTS_PER_PAGE,
          in_stock_only: true,
          ...(selectedCategory != null ? { category_id: selectedCategory } : {}),
          ...(selectedProvider != null ? { provider_id: selectedProvider } : {}),
          ...(isSearchActive ? { search: debouncedSearch } : {}),
        },
      });
      return res.data as Product[];
    },
    placeholderData: (prev) => prev as Product[] | undefined,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });


  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const term = search.trim();
    if (term.length < 2) return;

    e.preventDefault();
    setDebouncedSearch(term);

    try {
      const { data } = await api.get("/products/", {
        params: {
          skip: 0,
          limit: 5,
          in_stock_only: true,
          search: term,
          ...(selectedCategory != null ? { category_id: selectedCategory } : {}),
        },
      });
      const matches = (data as Product[]).filter((p) => p.stock_quantity > 0);

      if (matches.length === 1) {
        addToCart(matches[0], "normal");
        setSearch("");
        setDebouncedSearch("");
        setPage(1);
        inputRef.current?.focus();
        toast.success("Agregado al carrito", { description: matches[0].name, duration: 1500 });
      } else if (matches.length === 0) {
        toast.error("Producto no encontrado", { description: `Sin resultados para "${term}"` });
      } else {
        toast.message("Varios resultados", {
          description: "Selecciona el producto correcto en la lista",
        });
      }
    } catch {
      toast.error("Error al buscar el producto");
    }
  };

  const displayProducts = products ?? [];

  const salesMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/sales/", data);
    },
    onSuccess: (response) => {
      toast.dismiss("sale-processing");

      // Enriquecer datos de la venta para el ticket
      const saleData = response.data;
      // Mezclar nombre y código del producto desde el carrito
      const enrichedItems = saleData.items?.map((item: any) => {
        const cartItem = cart.find((c: any) => c.product_id === item.product_id);
        return {
          ...item,
          name: cartItem?.name || item.name || `Item #${item.product_id}`,
          code: cartItem?.barcode || item.code || item.barcode || ""
        };
      }) || [];

      // Agregar datos del cliente
      const enrichedSale = {
        ...saleData,
        items: enrichedItems,
        customer_name: selectedCustomer?.name || saleData.customer_name || "",
        customer_cedula: selectedCustomer?.cedula || saleData.customer_cedula || "",
        customer_email: selectedCustomer?.email || saleData.customer_email || "",
        customer_phone: selectedCustomer?.phone || saleData.customer_phone || ""
      };


      clearCart();
      setCompletedSale(enrichedSale);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
      toast.success("¡Venta procesada con éxito!", {
        description: "La transacción ha sido registrada en el sistema.",
        duration: 4000,
      });
    },
    onError: (err: any) => {
      toast.dismiss("sale-processing");
      let errorMessage = "Error desconocido";


      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;


        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => {
            const field = e.loc?.join('.') || 'campo desconocido';
            return `${field}: ${e.msg}`;
          }).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object') {
          errorMessage = JSON.stringify(detail);
        }
      }

      toast.error("Error al procesar la venta", {
        description: errorMessage,
      });
    },
    onSettled: () => {
      toast.dismiss("sale-processing");
      setIsProcessing(false);
      setHasDelivery(false);
      setDeliveryAmount(0);
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    toast.loading("Procesando venta... Por favor espera unos segundos", { id: "sale-processing" });


    let paymentCurrency = "USD";
    let paymentRate = 1.0;
    let paymentAmount = totalUSD() + (hasDelivery ? deliveryAmount : 0);

    if (paymentMethod === "Efectivo_BS" || paymentMethod === "Pago_Movil" || paymentMethod === "Cashea") {
      paymentCurrency = "VES";
      paymentRate = rates?.BCV || 1.0;
      paymentAmount = (totalUSD() + totalTax() + (hasDelivery ? deliveryAmount : 0)) * paymentRate;
    } else if (paymentMethod === "Binance") {
      paymentCurrency = "VES";
      paymentRate = rates?.USDT || rates?.BCV || 1.0;
      paymentAmount = (totalUSD() + (chargeBinanceTax ? totalTax() : 0) + (hasDelivery ? deliveryAmount : 0)) * paymentRate;
    } else if (paymentMethod === "Efectivo_COP") {
      paymentCurrency = "COP";
      paymentRate = rates?.COP || 1.0;
      paymentAmount = (totalUSD() + totalTax() + (hasDelivery ? deliveryAmount : 0)) * paymentRate;
    } else {
      paymentCurrency = "USD";
      paymentRate = rates?.BCV || 1.0;
      paymentAmount = totalUSD() + (hasDelivery ? deliveryAmount : 0);
    }

    const payload = {
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        matched_price: item.price
      })),
      payments: [
        {
          method: paymentMethod,
          amount: Number(paymentAmount.toFixed(2)),
          currency: paymentCurrency,
          exchange_rate: paymentRate
        }
      ],
      customer_id: selectedCustomer?.id || 0,
      has_delivery: hasDelivery,
      delivery_amount_usd: hasDelivery ? deliveryAmount : 0,
      charge_binance_tax: chargeBinanceTax
    };

    salesMutation.mutate(payload);
  };

  return (
    <div className="flex min-h-0 w-full max-w-full flex-col gap-3 overflow-hidden lg:h-[calc(100dvh-5.5rem)] lg:flex-row lg:gap-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden sm:gap-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch">
          <div className="flex flex-1 min-w-0 items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 focus-within:shadow-indigo-500/5 transition-all duration-200">
            <Search className="h-4.5 w-4.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar o escanear..."
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400 dark:text-white sm:text-base"
              autoComplete="off"
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />
            )}
          </div>

          {categories && categories.length > 0 && (
            <CategoryFilterSelect
              categories={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              compact
              className="w-full sm:w-64 md:w-72 shrink-0"
            />
          )}
          {providers && providers.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProviderFilter((s) => !s)}
                title={showProviderFilter ? "Ocultar filtro proveedor" : "Mostrar filtro proveedor"}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <Truck className="h-4 w-4" />
              </button>

              {showProviderFilter && (
                <div className="w-full sm:w-44 md:w-48 shrink-0">
                  <Select
                    value={selectedProvider?.toString()}
                    onValueChange={(value) => {
                      setSelectedProvider(value === "all" ? null : Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="cursor-pointer w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                      <Filter className="h-4.5 w-4.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                      <SelectValue placeholder="Todos los proveedores" />
                    </SelectTrigger>
                    <SelectContent align="end" position="popper">
                      <SelectItem value="all" className="cursor-pointer">Todos los proveedores</SelectItem>
                      {providers.map((prov) => (
                        <SelectItem key={prov.id} className="cursor-pointer" value={prov.id.toString()}>
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:rounded-xl">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {displayProducts.length > 0 ? (
              <PosProductList
                products={displayProducts}
                isLoading={isLoading}
                onAdd={(product, priceType) => {
                  addToCart(product, priceType);
                  inputRef.current?.focus();
                  toast.success(
                    priceType === "offer"
                      ? "Agregado en oferta"
                      : "Agregado al carrito",
                    { description: product.name, duration: 1500 },
                  );
                }}
                onViewDetail={setDetailProduct}
              />
            ) : !isLoading ? (
              <div className="flex h-full min-h-50 flex-col items-center justify-center px-6 py-16 text-center text-gray-400">
                <Search className="mb-2 h-12 w-12 opacity-20" />
                {isSearchActive ? (
                  <p>
                    No se encontraron productos con &quot;{debouncedSearch}
                    &quot;
                  </p>
                ) : (
                  <>
                    <p>Escribe al menos 2 caracteres para buscar</p>
                    <p className="mt-1 text-sm">
                      o navega el catálogo con las páginas de abajo
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {(displayProducts.length > 0 || page > 1) && (
            <div className="border-t border-gray-100 dark:border-gray-800">
              <Pagination
                page={page}
                hasNextPage={displayProducts.length === PRODUCTS_PER_PAGE}
                onPageChange={setPage}
                isLoading={isFetching}
              />
            </div>
          )}
        </div>

        {!isSearchActive && displayProducts.length > 0 && (
          <p className="hidden truncate text-xs text-gray-500 dark:text-gray-400 sm:block">
            {displayProducts.length} por página · A-Z · busca para filtrar
            todo el inventario
          </p>
        )}
      </div>

      <div className="flex w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 lg:w-72 xl:w-90 h-[500px] lg:h-full">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-800/50 sm:p-3">
          <div className="flex min-w-0 items-center gap-2">
            <ShoppingCart className="h-4 w-4 shrink-0 text-indigo-600" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold sm:text-base">Carrito</h2>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {totalItems()} ítems
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Select
              value={displayCurrency}
              onValueChange={(value) => setDisplayCurrency(value as "USD" | "BCV" | "USDT" | "COP")}
            >
              <SelectTrigger className="max-w-22 cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-[10px] font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:max-w-none sm:px-2.5 sm:text-xs">
                <SelectValue placeholder="USD" />
              </SelectTrigger>
              <SelectContent align="end" position="popper">
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="BCV">BCV</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="COP">COP</SelectItem>
              </SelectContent>
            </Select>

            {lastUpdated && (
              <span className="hidden rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400 xl:inline">
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}

            <button
              onClick={() => refreshRatesMutation.mutate()}
              disabled={isAnyRefreshing}
              className={`cursor-pointer rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-colors ${isAnyRefreshing ? "opacity-75 cursor-not-allowed" : ""}`}
              title="Actualizar tasas de cambio"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${isAnyRefreshing ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isAnyRefreshing ? (
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                ) : (
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="cursor-pointer rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700"
              title="Registrar nuevo cliente"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Cliente (Opcional)
          </label>

          {/* Contenedor en columna para organizar el Input y el Select */}
          <div className="flex flex-col gap-2">
            {/* Input de búsqueda rápida por cédula o nombre */}
            <input
              type="text"
              title="Buscar cliente por cédula o nombre"
              aria-label="Buscar cliente por cédula o nombre"
              placeholder="Buscar por cédula o nombre..."
              onChange={(e) => {
                const query = e.target.value.trim().toLowerCase();

                if (!query) {
                  setSelectedCustomer(null);
                  return;
                }

                const found = customers?.find((c: any) => {
                  const cedula = c.cedula?.toString().toLowerCase() || "";
                  const name = c.name?.toLowerCase() || "";
                  return cedula.includes(query) || name.includes(query);
                });

                setSelectedCustomer(found || null);
              }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <div className="flex justify-end gap-2">
              <Select
                value={selectedCustomer?.id?.toString() ?? "none"}
                onValueChange={(value) => {
                  const customer = customers?.find(
                    (c: any) => c.id === parseInt(value),
                  );
                  setSelectedCustomer(value === "none" ? null : customer || null);
                }}
              >
                <SelectTrigger className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <SelectValue placeholder="Sin cliente" />
                </SelectTrigger>
                <SelectContent align="end" position="popper">
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} - {customer.cedula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCustomer && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>{selectedCustomer.phone}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 flex flex-col">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.product_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/20"
                title={item.name}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4
                      className="font-medium text-xs text-gray-900 dark:text-white wrap-break-words leading-snug"
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                    {item.offer_price_usd != null &&
                      item.offer_price_usd > 0 && (
                        <Select
                          value={item.priceType || "normal"}
                          onValueChange={(value) =>
                            updateItemPriceType(
                              item.product_id,
                              value as "normal" | "offer",
                            )
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            className="text-[10px] font-semibold bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded px-2 text-orange-700 dark:text-orange-300"
                          >
                            <SelectValue placeholder="Normal" />
                          </SelectTrigger>
                          <SelectContent align="end" position="popper">
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="offer">Oferta</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    <Select
                      value={item.priceBasis}
                      onValueChange={(value) =>
                        updateItemBasis(
                          item.product_id,
                          value as "USD" | "BCV" | "USDT" | "COP",
                        )
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="text-[10px] font-semibold bg-gray-200/60 dark:bg-gray-700/60 border border-gray-300/50 dark:border-gray-600/50 rounded px-2 text-gray-700 dark:text-gray-300 hover:bg-gray-300/60 dark:hover:bg-gray-600/60 transition-colors"
                      >
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent align="end" position="popper">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BCV">BCV</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="COP">COP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-0.5 text-[10px]">
                    <span className="text-gray-500">
                      $ {item.price.toFixed(2)} x {item.quantity}
                    </span>
                    {item.priceBasis && item.priceBasis !== "USD" && (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {item.priceBasis}{" "}
                        {(
                          item.price *
                          (rates[item.priceBasis as keyof ExchangeRates] || 1)
                        ).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity - 1)
                    }
                    className="cursor-pointer rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Disminuir cantidad"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-medium text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity + 1)
                    }
                    className="cursor-pointer rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Aumentar cantidad"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm min-w-15">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="cursor-pointer text-gray-400 hover:text-red-500"
                  title="Quitar del carrito"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50 py-8">
              <ShoppingCart className="h-12 w-12" />
              <p>Carrito vacío</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 rounded-b-2xl shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(totalUSD())}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Impuestos (IVA)</span>
              <span>
                {["Efectivo_USD", "Zelle", "Paypal", "Zinli"].includes(paymentMethod) || (paymentMethod === "Binance" && !chargeBinanceTax)
                  ? formatCurrency(0)
                  : formatCurrency(totalTax())}
              </span>
            </div>

            {/* Delivery Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="hasDelivery"
                  checked={hasDelivery}
                  onChange={(e) => {
                    setHasDelivery(e.target.checked);
                    if (!e.target.checked) setDeliveryAmount(0);
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="hasDelivery"
                  className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                >
                  <Truck className="h-4 w-4 text-indigo-600" />
                  Incluir Delivery
                </label>
              </div>
              {hasDelivery && (
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-xs text-gray-500">Costo:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1.5 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliveryAmount}
                      onChange={(e) =>
                        setDeliveryAmount(parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white p-1.5 pl-6 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Método de Pago
              </label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent align="end" position="popper">
                  {ALL_PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {paymentMethod === "Binance" && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="chargeBinanceTax"
                    checked={chargeBinanceTax}
                    onChange={(e) => setChargeBinanceTax(e.target.checked)}
                    className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                  />
                  <label
                    htmlFor="chargeBinanceTax"
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  >
                    Cobrar IVA con Binance
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline text-xl font-bold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white text-sm">
                Total USD
              </span>
              <span>
                {formatCurrency(
                  totalUSD() +
                  (["Efectivo_USD", "Zelle", "Paypal", "Zinli"].includes(paymentMethod) || (paymentMethod === "Binance" && !chargeBinanceTax) ? 0 : totalTax()) +
                  (hasDelivery ? deliveryAmount : 0),
                )}
              </span>
            </div>

            <div className="flex justify-between items-baseline text-2xl font-black text-green-600 dark:text-green-400">
              <span className="text-xs uppercase tracking-widest">
                {displayCurrency === "USD" ? "VES" : displayCurrency}
              </span>
              <span>
                {(() => {
                  const isUSDMethod = ["Efectivo_USD", "Zelle", "Paypal", "Zinli"].includes(paymentMethod) || (paymentMethod === "Binance" && !chargeBinanceTax);
                  const totalUSDVal = totalUSD() + (isUSDMethod ? 0 : totalTax()) + (hasDelivery ? deliveryAmount : 0);

                  return displayCurrency === "USD"
                    ? new Intl.NumberFormat("es-VE", {
                      style: "currency",
                      currency: "VES",
                    }).format(totalUSDVal * (rates?.["BCV"] || 1.0))
                    : displayCurrency === "COP"
                      ? new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      }).format(totalUSDVal * (rates?.["COP"] || 1.0))
                      : new Intl.NumberFormat("es-VE", {
                        style: "currency",
                        currency: "VES",
                      }).format(totalUSDVal * (rates?.[displayCurrency === "USDT" ? "USDT" : "BCV"] || 1.0));
                })()}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            title="Procesar cobro de la venta"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            {isProcessing ? "Procesando..." : "Cobrar"}
          </button>
        </div>
      </div>

      {completedSale && (
        <SaleTicket
          sale={completedSale}
          rates={rates}
          onClose={() => setCompletedSale(null)}
        />
      )}

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
      />

      {showCustomerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowCustomerModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Registro Rápido de Cliente
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const { data } = await api.post("/customers", {
                    ...customerForm,
                    email: customerForm.email.trim() || null,
                  });
                  queryClient.invalidateQueries({ queryKey: ["customers"] });
                  setSelectedCustomer(data);
                  setShowCustomerModal(false);
                  setCustomerForm({ cedula: "", name: "", phone: "", email: "" });
                  toast.success("Cliente registrado exitosamente");
                } catch (err: any) {
                  toast.error("Error al registrar cliente", {
                    description:
                      err.response?.data?.detail || "Error desconocido",
                  });
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cédula *
                </label>
                <input
                  type="text"
                  placeholder="v-2xxxxxxx"
                  required
                  value={customerForm.cedula}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      cedula: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ViveresApp"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="04xx-xxxxxxx"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="ViveresApp@correo.com (Opcional)"
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  title="Cancelar"
                  onClick={() => {
                    setShowCustomerModal(false);
                    setCustomerForm({ cedula: "", name: "", phone: "", email: "" });
                  }}
                  className="cursor-pointer flex-1 rounded-xl bg-gray-100 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  title="Registrar cliente"
                  className="cursor-pointer flex-1 rounded-xl bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
