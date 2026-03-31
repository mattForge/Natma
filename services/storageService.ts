
import { QuoteItem, Quote } from '../types';

const ITEMS_KEY = 'qm_pro_items';
const QUOTES_KEY = 'qm_pro_quotes';

// Initial dummy data to match prompt requirements
const DEFAULT_ITEMS: QuoteItem[] = [
  { id: '1', code: 'SRV-001', description: 'Web Development Consultation', price: 150.00 },
  { id: '2', code: 'DSN-002', description: 'UI/UX Design Package', price: 1200.00 },
  { id: '3', code: 'MNT-003', description: 'Monthly Cloud Hosting', price: 45.00 },
  { id: '4', code: 'DEV-004', description: 'Backend API Integration', price: 800.00 },
];

export const storageService = {
  // Items CRUD (The products/services database)
  getItems: (): QuoteItem[] => {
    const data = localStorage.getItem(ITEMS_KEY);
    if (!data) {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(DEFAULT_ITEMS));
      return DEFAULT_ITEMS;
    }
    return JSON.parse(data);
  },

  saveItem: (item: Omit<QuoteItem, 'id'> & { id?: string }): QuoteItem => {
    const items = storageService.getItems();
    let newItem: QuoteItem;
    
    if (item.id) {
      const index = items.findIndex(i => i.id === item.id);
      newItem = { ...item } as QuoteItem;
      items[index] = newItem;
    } else {
      newItem = { ...item, id: crypto.randomUUID() } as QuoteItem;
      items.push(newItem);
    }
    
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    return newItem;
  },

  deleteItem: (id: string): void => {
    const items = storageService.getItems();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
  },

  // Quotes CRUD
  getQuotes: (): Quote[] => {
    const data = localStorage.getItem(QUOTES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveQuote: (quote: Quote): void => {
    const quotes = storageService.getQuotes();
    const existingIndex = quotes.findIndex(q => q.id === quote.id);
    if (existingIndex > -1) {
      quotes[existingIndex] = quote;
    } else {
      quotes.push(quote);
    }
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  }
};
