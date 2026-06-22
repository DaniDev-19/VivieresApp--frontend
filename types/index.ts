export interface Category {
    id: number;
    name: string;
    description?: string;
}

export interface Product {
    id?: number;
    barcode: string;
    name: string;
    description: string;
    cost_price: number;
    profit_margin: number;
    tax_rate: number;
    price_usd?: number;
    offer_price_usd?: number | null;
    stock_quantity: number;
    min_stock_level: number;
    category_id?: number | null;
    provider_id?: number | null;
    category?: Category | null;
    image_url: string;
    is_public: boolean;
    apply_iva_web?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Provider {
    id: number;
    name: string;
    rif?: string;
    contact_info?: string;
    is_delivery?: boolean;
}

export interface PurchaseOrder {
    id: number;
    provider_id: number;
    provider?: Provider;
    status: 'pending' | 'completed';
    notes?: string;
    created_at: string;
    items?: {
        id: number;
        product_id: number | null;
        product_name: string;
        requested_quantity: number;
        received_quantity?: number;
        cost_price?: number;
    }[];
}

export interface Rate {
    id: number;
    currency: string;
    rate: number;
    updated_at: string;
}

export interface User {
    id: number;
    username: string;
    full_name?: string;
}

export interface Delivery {
    id: number;
    description: string;
    address?: string;
    items_detail?: string;
    cost_usd?: number | null;
    status: string;
    delivery_user_id?: number | null;
    provider_id?: number | null;
    sale_id?: number | null;
    created_at: string;
    updated_at: string;
    completed_at?: string | null;
    delivery_user?: User | null;
    provider?: Provider | null;
}

export interface Sale {
    id: number;
    total_amount_usd: number;
    total_tax_usd?: number;
    delivery_amount_usd?: number;
    status: string;
    created_at: string;
    items?: any[];
    payments?: any[];
    customer_name?: string;
    customer_cedula?: string;
    customer_phone?: string;
    customer_email?: string;
    customer?: {
        id: number;
        name: string;
        cedula: string;
        phone: string;
        email?: string;
    } | null;
}


export interface WebOrderItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_usd: number;
}

export interface WebOrder {
    id: number;
    created_at: string;
    customer_data: {
        name: string;
        cedula: string;
        phone: string;
        email?: string;
        address?: string;
    };
    status: 'pending_review' | 'approved' | 'rejected' | 'completed';
    total_estimated_usd: number;
    payment_method: string;
    transaction_ref?: string;
    payment_proof_url?: string;
    delivery_type?: string;
    delivery_cost?: number;
    items: WebOrderItem[];
}

export interface ReturnItem {
    product_id: number;
    product_name: string;
    barcode?: string;
    quantity: number;
    unit_price_usd: number;
    subtotal_usd: number;
}

export interface Return {
    id: number;
    sale_id: number;
    total_refund_usd: number;
    refund_method: string;
    credit_note_code?: string;
    reason?: string;
    status: string;
    items: ReturnItem[];
    created_at: string;
}

export interface ExchangeItem {
    product_id: number;
    product_name: string;
    barcode?: string;
    quantity: number;
    unit_price_usd: number;
    subtotal_usd: number;
}

export interface Exchange {
    id: number;
    sale_id: number;
    total_difference_usd: number;
    payment_method?: string;
    payment_amount_usd: number;
    reason?: string;
    status: string;
    items_out: ExchangeItem[];
    items_in: ExchangeItem[];
    created_at: string;
}
