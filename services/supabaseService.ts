
import { createClient } from '@supabase/supabase-js';
import { QuoteItem, Quote } from '../types';

const SUPABASE_URL = 'https://cbtelvocnucwwvrkurog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidGVsdm9jbnVjd3d2cmt1cm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODM2NzYsImV4cCI6MjA4NjU1OTY3Nn0.5UTlluRqKPqshU2uGxUryTJBgkitBR_5aAXpwYt6USg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_NAME = 'natmaProducts';

export const dbService = {
  getItems: async (): Promise<{ data: QuoteItem[], error: any }> => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*');
      
      if (error) return { data: [], error };

      // Map data and ensure every item has a unique ID.
      // If the database uses 'Code' as the primary key (evidenced by 'Code_pkey' error), 
      // we use it as the 'id' for the frontend logic.
      const mappedData = (data || []).map((item: any) => {
        const itemCode = String(item.Code || item.code || '');
        return {
          id: String(item.id || item.ID || itemCode), 
          code: itemCode,
          description: String(item.Description || item.description || ''),
          price: parseFloat(item.Price !== undefined ? item.Price : (item.price !== undefined ? item.price : 0)) || 0
        };
      });

      return { 
        data: mappedData.sort((a, b) => (a.description || '').localeCompare(b.description || '')), 
        error: null 
      };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  saveItem: async (item: Partial<QuoteItem>): Promise<QuoteItem | null> => {
    try {
      if (item.id) {
        // UPDATE existing record
        const updatePayload: any = {
          Description: item.description,
          Price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
        };

        // Attempt update using 'id' first, then 'Code' if 'id' looks like a Code
        let query = supabase.from(TABLE_NAME).update(updatePayload);
        
        // If the ID matches the code, we assume the DB uses Code as PK
        if (item.id === item.code) {
          query = query.eq('Code', item.code);
        } else {
          const idVal = isNaN(Number(item.id)) ? item.id : Number(item.id);
          query = query.eq('id', idVal);
        }

        const { data, error } = await query.select().single();

        if (error) {
           // Final fallback: try explicit 'Code' column if ID update failed
           const retry = await supabase.from(TABLE_NAME)
            .update(updatePayload)
            .eq('Code', item.code)
            .select()
            .single();
           if (retry.error) throw retry.error;
           return retry.data;
        }
        return data;
      } else {
        // INSERT new record
        const insertPayload: any = {
          Code: item.code,
          Description: item.description,
          Price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
        };

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([insertPayload])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.error('[Supabase Persistence Error]', err);
      throw err;
    }
  },

  deleteItem: async (id: string): Promise<void> => {
    // Try deleting by 'id' then 'Code'
    const idVal = isNaN(Number(id)) ? id : Number(id);
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', idVal);
    
    if (error) {
      const retry = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('Code', id);
      if (retry.error) throw retry.error;
    }
  },

  saveQuote: (quote: Quote): void => {
    const quotes = JSON.parse(localStorage.getItem('qm_pro_quotes') || '[]');
    quotes.push(quote);
    localStorage.setItem('qm_pro_quotes', JSON.stringify(quotes));
  }
};
