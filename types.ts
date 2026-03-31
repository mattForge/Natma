
export interface QuoteItem {
  id: string;
  code: string;
  description: string;
  price: number;
}

export interface LineItem {
  id: string;
  productId: string;
  code: string;
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Quote {
  id: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  depositAmount: number;
  status: 'draft' | 'sent' | 'paid';
  smartSummary?: string;
}

export type TabType = 'generator' | 'database';
