
import React, { useState, useMemo, useEffect } from 'react';
import { QuoteItem } from '../types';
import { dbService } from '../services/supabaseService';
import { 
  Search, Plus, Trash2, Edit3, Save, X, Loader2, Check, Lock, 
  AlertCircle, ArrowUp, ArrowDown, ArrowUpDown, ShieldAlert, Info, AlertOctagon, ArrowRight
} from 'lucide-react';

interface Props {
  dbItems: QuoteItem[];
  onRefreshItems: () => void;
}

type SortKey = 'description' | 'price';
type SortDirection = 'asc' | 'desc' | 'none';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface StatusState {
  type: 'error' | 'success' | 'info';
  message: string;
}

export const DatabaseManager: React.FC<Props> = ({ dbItems, onRefreshItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'description', direction: 'none' });
  
  // Localized error messages for specific UI contexts
  const [formError, setFormError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingId, setPendingId] = useState<string | undefined>(undefined);

  // Form state for creating/editing
  const [formData, setFormData] = useState<Partial<QuoteItem>>({
    code: '',
    description: '',
    price: 0
  });

  // Auto-clear toast messages
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Clear local errors when switching modes
  useEffect(() => {
    setFormError(null);
    setModalError(null);
  }, [isAddingNew, editingId, showConfirmModal]);

  const filteredItems = useMemo(() => {
    return dbItems.filter(item => 
      (item.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dbItems, searchTerm]);

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    if (sortConfig.direction === 'none') return items;
    
    return items.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
      
      return 0;
    });
  }, [filteredItems, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current.key === key) {
        if (current.direction === 'none') return { key, direction: 'asc' };
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return { key, direction: 'none' };
      }
      return { key, direction: 'asc' };
    });
  };

  const startEdit = (item: QuoteItem) => {
    setFormData({ 
      description: item.description, 
      price: item.price 
    });
    setEditingId(item.id);
    setIsAddingNew(false);
    setStatus(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ code: '', description: '', price: 0 });
    setStatus(null);
    setShowConfirmModal(false);
  };

  const handleSaveRequest = (id?: string) => {
    const targetErrorSetter = id ? setStatus : setFormError;
    
    // Validation Logic
    if (!formData.description?.trim()) {
      const msg = 'Registry Error: Asset description cannot be empty.';
      id ? setStatus({ type: 'error', message: msg }) : setFormError(msg);
      return;
    }
    if (formData.price === undefined || formData.price < 0) {
      const msg = 'Registry Error: Unit cost must be a valid positive number.';
      id ? setStatus({ type: 'error', message: msg }) : setFormError(msg);
      return;
    }
    if (!id && !formData.code?.trim()) {
      setFormError('Security Protocol: Unique Product Code is mandatory for new assets.');
      return;
    }

    if (id) {
      setPendingId(id);
      setShowConfirmModal(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    const id = pendingId;
    setIsActionLoading(true);
    setModalError(null);
    setFormError(null);
    
    try {
      const originalItem = id ? dbItems.find(i => i.id === id) : null;
      const savePayload = id ? { 
        ...formData, 
        id, 
        code: originalItem?.code 
      } : { ...formData };
      
      await dbService.saveItem(savePayload);
      setEditingId(null);
      setIsAddingNew(false);
      setShowConfirmModal(false);
      onRefreshItems();
      setFormData({ code: '', description: '', price: 0 });
      setStatus({ type: 'success', message: id ? 'Asset updated successfully.' : 'New hardware registered to inventory.' });
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.code === '23505' 
        ? `Collision: Code "${formData.code}" already exists in Natma database.`
        : `Database Link Failure: ${err.message || "Request timed out."}`;
      
      if (id) {
        setModalError(errorMsg);
      } else {
        setFormError(errorMsg);
      }
    } finally {
      setIsActionLoading(false);
      setPendingId(undefined);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Authorize Deletion: This will permanently remove the asset from Natma records. Proceed?')) {
      setIsActionLoading(true);
      setStatus(null);
      try {
        await dbService.deleteItem(id);
        onRefreshItems();
        setStatus({ type: 'info', message: 'Asset purged from registry.' });
      } catch (err) {
        setStatus({ type: 'error', message: 'Purge Denied: Operational firewall blocked the deletion request.' });
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const originalItemToConfirm = pendingId ? dbItems.find(i => i.id === pendingId) : null;

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key || sortConfig.direction === 'none') {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-red-600" /> 
      : <ArrowDown className="w-3 h-3 text-red-600" />;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Dynamic Status Toast Notification */}
      {status && (
        <div className={`fixed bottom-8 right-8 z-50 animate-in slide-in-from-right-8 fade-in duration-300 p-4 rounded-2xl shadow-2xl border flex items-center gap-4 max-w-md backdrop-blur-xl ${
          status.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' : 
          status.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
          'bg-slate-900/90 border-slate-500/50 text-slate-200'
        }`}>
          <div className={`p-2 rounded-lg ${
            status.type === 'error' ? 'bg-red-500/20' : 
            status.type === 'success' ? 'bg-emerald-500/20' : 
            'bg-slate-500/20'
          }`}>
            {status.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : 
             status.type === 'success' ? <Check className="w-5 h-5" /> : 
             <Info className="w-5 h-5" />}
          </div>
          <p className="text-sm font-bold pr-8">{status.message}</p>
          <button onClick={() => setStatus(null)} className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && originalItemToConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-slate-800 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="bg-red-800/10 border-b border-red-900/20 p-6 flex items-center gap-4">
              <div className="bg-red-800 p-3 rounded-2xl">
                <AlertOctagon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Authorize Commit</h3>
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Manual Database Synchronization Required</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-slate-400 text-sm font-medium">You are about to overwrite security asset <span className="text-red-500 font-black">[{originalItemToConfirm.code}]</span>. Review the following modifications:</p>
              
              <div className="space-y-4">
                {/* Description Diff */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Description Update</span>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-600 line-through truncate">{originalItemToConfirm.description}</span>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-red-500" />
                      <span className="text-sm text-slate-100 font-bold">{formData.description}</span>
                    </div>
                  </div>
                </div>

                {/* Price Diff */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Pricing Adjustment</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 line-through">R {originalItemToConfirm.price.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4 text-red-500" />
                    <span className="text-lg text-emerald-500 font-black">R {formData.price?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Local Modal Error */}
              {modalError && (
                <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-bold leading-tight uppercase tracking-tight">{modalError}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isActionLoading}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors border border-transparent hover:bg-slate-800 rounded-2xl disabled:opacity-30"
                >
                  Abort Changes
                </button>
                <button 
                  onClick={executeSave}
                  disabled={isActionLoading}
                  className="flex-1 py-4 bg-red-800 hover:bg-red-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-red-950/40 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-slate-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search inventory registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:text-slate-600 font-bold text-sm"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto items-center">
          <button
            onClick={() => { 
              setIsAddingNew(true); 
              setEditingId(null); 
              setFormData({code:'', description:'', price:0}); 
              setStatus(null); 
            }}
            className="flex-grow md:flex-grow-0 flex items-center justify-center space-x-2 px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-black uppercase text-xs tracking-[0.15em] rounded-xl shadow-lg shadow-red-950/50 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Registry Entry</span>
          </button>
        </div>
      </div>

      {/* New Asset Form Overlay */}
      {isAddingNew && (
        <div className="bg-red-950/20 border border-red-900/40 p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 backdrop-blur-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-red-100 flex items-center gap-3 uppercase tracking-tight">
              <div className="bg-red-800 p-1.5 rounded-lg shadow-inner"><Plus className="w-5 h-5 text-white" /></div>
              Register Security Hardware
            </h3>
            <button onClick={() => setIsAddingNew(false)} className="p-2 hover:bg-red-900/30 rounded-full transition-colors text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Unique Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:ring-2 focus:ring-red-600 font-bold shadow-inner"
                placeholder="Ex: CAM-01"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:ring-2 focus:ring-red-600 font-bold shadow-inner"
                placeholder="Hardware specifications"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit Cost (R)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 outline-none focus:ring-2 focus:ring-red-600 font-bold shadow-inner"
              />
            </div>
          </div>

          {/* Context-Specific Inline Error Message */}
          {formError && (
            <div className="mt-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest leading-none">{formError}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button onClick={() => setIsAddingNew(false)} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">Abort Entry</button>
            <button
              onClick={() => handleSaveRequest()}
              disabled={isActionLoading}
              className="px-10 py-3 bg-red-800 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-3 transition-all active:scale-95"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Database
            </button>
          </div>
        </div>
      )}

      {/* Inventory Registry Table */}
      <div className="bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800/80 border-b border-slate-700">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-[0.3em] w-32">Code</th>
              <th 
                className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-[0.3em] cursor-pointer hover:text-red-500 transition-colors group"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center gap-2">
                  Description
                  {renderSortIcon('description')}
                </div>
              </th>
              <th 
                className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-[0.3em] text-right w-40 cursor-pointer hover:text-red-500 transition-colors group"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end gap-2">
                  Price (R)
                  {renderSortIcon('price')}
                </div>
              </th>
              <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-[0.3em] text-center w-64">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <AlertCircle className="w-12 h-12" />
                    <span className="font-black uppercase tracking-[0.3em] text-xs">Registry Clear / No Matches</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedItems.map(item => (
                <tr 
                  key={item.id} 
                  onDoubleClick={() => startEdit(item)}
                  className={`group transition-all duration-300 ${editingId === item.id ? 'bg-red-950/20 shadow-inner' : 'hover:bg-slate-800/40 cursor-pointer'}`}
                >
                  {editingId === item.id ? (
                    /* INLINE EDIT MODE */
                    <>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-500 font-black text-sm uppercase select-none opacity-50 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                          <Lock className="w-3 h-3 text-red-900" />
                          <span className="truncate">{item.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <input
                          autoFocus
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-950 border border-red-900/40 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none font-bold transition-all shadow-inner"
                          placeholder="Update description..."
                        />
                      </td>
                      <td className="px-6 py-5">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-950 border border-red-900/40 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none text-right font-bold transition-all shadow-inner"
                        />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center items-center gap-3">
                          <button 
                            onClick={() => handleSaveRequest(item.id)}
                            disabled={isActionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all active:scale-90 font-bold text-[10px] uppercase tracking-widest disabled:opacity-50"
                            title="Commit Changes"
                          >
                            {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Update
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all active:scale-90 font-bold text-[10px] uppercase tracking-widest"
                            title="Discard"
                          >
                            <X className="w-3 h-3" />
                            Abort
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    /* VIEW MODE */
                    <>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-400 uppercase tracking-tighter tabular-nums">{item.code}</span>
                          {status?.type === 'success' && editingId === null && <Check className="w-4 h-4 text-emerald-500 animate-bounce" />}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-200 font-bold uppercase tracking-tight">{item.description}</td>
                      <td className="px-8 py-5 text-right text-sm font-black text-red-500 tracking-tighter tabular-nums">R {item.price.toFixed(2)}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center items-center space-x-3 transition-all duration-300">
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-700/50 rounded-xl hover:text-white hover:bg-red-900/40 hover:border-red-900/50 transition-all opacity-20 group-hover:opacity-100"
                            title="Edit Asset"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 border border-transparent rounded-xl hover:text-red-500 hover:bg-red-950/40 hover:border-red-900/30 transition-all opacity-0 group-hover:opacity-100"
                            title="Remove Asset"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="bg-slate-950/80 px-8 py-4 border-t border-slate-800 text-[10px] text-slate-600 font-black uppercase tracking-[0.5em] text-center italic">
          Authorized Security Inventory Access | Integrity Guaranteed
        </div>
      </div>
    </div>
  );
};
