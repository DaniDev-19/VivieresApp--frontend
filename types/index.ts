export interface Product {
    id?: number;
    barcode: string;
    name: string;
    description: string;
    cost_price: number;
    profit_margin: number;
    tax_rate: number;
    price_usd?: number;
    stock_quantity: number;
    min_stock_level: number;
    category_id?: number;
    image_url: string;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Provider {
    id: number;
    name: string;
    rif?: string;
    contact_info?: string;
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

export interface Sale {
    id: number;
    total_amount_usd: number;
    status: string;
    created_at: string;
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
    items: WebOrderItem[];
}
