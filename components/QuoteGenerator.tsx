
import React, { useState, useMemo } from 'react';
import { QuoteItem, LineItem, Quote } from '../types';
import { dbService } from '../services/supabaseService';
import { Plus, Trash2, Printer, Save, Sparkles, User, Tag, RefreshCw, ShieldCheck, Phone, Mail, Shield, MapPin, Contact, CreditCard, Receipt, AtSign, Download, FileDown } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Props {
  dbItems: QuoteItem[];
  onRefreshItems: () => void;
}

export const QuoteGenerator: React.FC<Props> = ({ dbItems, onRefreshItems }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const selectedProduct = useMemo(() => 
    dbItems.find(item => item.id === selectedProductId),
    [dbItems, selectedProductId]
  );

  const subtotal = useMemo(() => 
    lineItems.reduce((acc, item) => acc + item.total, 0),
    [lineItems]
  );

  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const deposit = total * 0.70;

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const newLineItem: LineItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      code: selectedProduct.code,
      description: selectedProduct.description,
      unitPrice: selectedProduct.price,
      quantity: quantity,
      total: selectedProduct.price * quantity,
    };

    setLineItems([...lineItems, newLineItem]);
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const generateAISummary = async () => {
    if (lineItems.length === 0) return;
    setIsLoadingSummary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const itemsList = lineItems.map(i => `${i.quantity}x ${i.description}`).join(', ');
      const prompt = `Act as a professional security consultant for Natma Security. Write a short, authoritative 2-sentence executive summary for a security system quote containing the following components: ${itemsList}. The total investment is R${total.toFixed(2)} with a mandatory 70% deposit. Emphasize the "Ultimate Safeguarding" brand philosophy and peace of mind.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      setAiSummary(response.text || 'Operational analysis complete.');
    } catch (error) {
      console.error('Gemini error:', error);
      setAiSummary('Analysis interrupted. Manual consultant review recommended.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSaveAsPDF = () => {
    if (!customerName || lineItems.length === 0) {
      alert('Security Protocol: Client name and at least one security asset are required to generate a valid quote.');
      return;
    }

    // Temporarily change document title to influence the suggested filename in the print dialog
    const originalTitle = document.title;
    const sanitizedClientName = customerName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    document.title = `NATMA_Quote_${sanitizedClientName}_${date}`;
    
    window.print();
    
    // Restore original title
    document.title = originalTitle;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6 no-print">
        {/* Client Intake Form */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-100 uppercase tracking-tight">
            <div className="bg-red-800 p-2 rounded-xl shadow-inner"><User className="w-5 h-5 text-white" /></div>
            Client Intelligence Intake
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Customer / Property Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Legal Name or Registered Business"
                className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold placeholder:text-slate-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Customer Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Full physical installation or billing address"
                  className="w-full pl-12 pr-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold placeholder:text-slate-700"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contact Number"
                  className="w-full pl-12 pr-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold placeholder:text-slate-700"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Email Address</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold placeholder:text-slate-700"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Quotation Issuance Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Inventory Selection */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black flex items-center gap-3 text-slate-100 uppercase tracking-tight">
              <div className="bg-red-800 p-2 rounded-xl shadow-inner"><ShieldCheck className="w-5 h-5 text-white" /></div>
              Strategic Inventory Selection
            </h2>
            <button 
              onClick={onRefreshItems} 
              className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <RefreshCw className="w-3 h-3" />
              Sync DB
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Security Asset / Service</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold"
              >
                <option value="" className="bg-slate-900 text-slate-600">Select asset profile...</option>
                {dbItems.map(item => (
                  <option key={item.id} value={item.id} className="bg-slate-900">{item.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Unit Qty</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-red-600 outline-none font-bold"
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={!selectedProductId}
              className="flex items-center justify-center space-x-2 px-8 py-3.5 bg-red-800 hover:bg-red-700 disabled:opacity-20 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-xl shadow-red-950/50 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Asset</span>
            </button>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Asset Description</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Rate (R)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Qty</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Total (R)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-600 italic font-bold uppercase text-xs tracking-widest">
                    Consultant: No assets staged for deployment.
                  </td>
                </tr>
              ) : (
                lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-100 uppercase tracking-tight leading-none mb-1">{item.description}</p>
                      <p className="text-[10px] text-slate-600 font-bold tracking-widest">TAG: {item.code}</p>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-400 text-right tabular-nums">R {item.unitPrice.toFixed(2)}</td>
                    <td className="px-8 py-6 text-sm text-slate-200 text-center font-black tabular-nums">{item.quantity}</td>
                    <td className="px-8 py-6 text-sm font-black text-red-500 text-right tabular-nums">R {item.total.toFixed(2)}</td>
                    <td className="px-8 py-6 text-center">
                      <button onClick={() => handleRemoveItem(item.id)} className="text-slate-700 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 sticky top-24 no-print overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-800/10 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
          
          <h2 className="text-2xl font-black mb-8 text-slate-100 flex items-center justify-between tracking-tighter uppercase relative">
            Natma <span className="text-red-600 font-bold text-[10px] tracking-[0.3em] ml-1">INVESTMENT</span>
          </h2>
          
          <div className="space-y-5 mb-10 relative">
            <div className="flex justify-between text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
              <span>Base Subtotal</span>
              <span className="text-slate-200 tabular-nums font-bold">R {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
              <span>VAT Allocation (15%)</span>
              <span className="text-slate-200 tabular-nums font-bold">R {tax.toFixed(2)}</span>
            </div>
            <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Grand Total</span>
              <span className="text-2xl font-black text-slate-100 tabular-nums">R {total.toFixed(2)}</span>
            </div>
            
            <div className="p-5 bg-red-950/20 border-2 border-red-900/30 rounded-2xl flex flex-col gap-3 shadow-inner">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">70% Security Deposit</span>
                  <span className="text-[9px] text-red-700 font-bold uppercase tracking-widest">(Commencement Requirement)</span>
                </div>
                <div className="text-right">
                   <span className="text-2xl font-black text-red-500 tabular-nums">R {deposit.toFixed(2)}</span>
                </div>
              </div>
              <div className="h-1 bg-red-950 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 w-[70%]"></div>
              </div>
            </div>
          </div>

          <div className="space-y-4 relative">
            <button
              onClick={generateAISummary}
              disabled={isLoadingSummary || lineItems.length === 0}
              className="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-br from-red-700 to-red-950 hover:from-red-600 hover:to-red-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-2xl shadow-red-950/50 disabled:opacity-30 relative group overflow-hidden mb-2"
            >
              <div className="absolute inset-0 bg-white/5 translate-y-12 group-hover:translate-y-0 transition-transform duration-500"></div>
              <Sparkles className="w-5 h-5 relative" />
              <span className="relative">{isLoadingSummary ? 'Analyzing Assets...' : 'AI Strategic Review'}</span>
            </button>

            <button
              onClick={handleSaveAsPDF}
              className="w-full flex items-center justify-center space-x-3 py-5 bg-red-800 hover:bg-red-700 text-white font-black uppercase text-sm tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-red-950/50 active:scale-95 group"
            >
              <FileDown className="w-6 h-6 group-hover:animate-bounce" />
              <span>Save Quote as PDF</span>
            </button>
            
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center space-x-3 py-3 bg-slate-800 border-2 border-slate-700 hover:border-slate-600 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Direct Print</span>
            </button>
          </div>

          {aiSummary && (
            <div className="mt-8 p-6 bg-red-950/20 border border-red-900/40 rounded-2xl animate-in slide-in-from-top-4 duration-500">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                Executive Recommendation
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed italic font-bold">
                "{aiSummary}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NATMA OFFICIAL PRINT TEMPLATE */}
      <div className="print-only hidden col-span-3">
        <div className="bg-white p-14 max-w-[950px] mx-auto text-slate-900 font-sans border-t-[20px] border-red-800 shadow-2xl">
          
          {/* Header Contact Block */}
          <div className="grid grid-cols-2 gap-8 mb-16 text-[11px] font-black uppercase tracking-widest text-slate-800">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-red-800 text-sm mb-2 font-black">Manie Klopper</p>
              <div className="flex items-center gap-3 mb-1"><Phone className="w-4 h-4 text-red-800" /> +27 61 522 6369</div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-red-800" /> natmasec1@gmail.com</div>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-right">
              <p className="text-red-800 text-sm mb-2 font-black">Natasha Klopper</p>
              <div className="flex items-center gap-3 justify-end mb-1">+27 61 581 1384 <Phone className="w-4 h-4 text-red-800" /></div>
              <div className="flex items-center gap-3 justify-end">natmasec2@gmail.com <Mail className="w-4 h-4 text-red-800" /></div>
            </div>
          </div>

          {/* Central Branded Logo */}
          <div className="text-center mb-20 relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-10"></div>
            <div className="inline-block bg-white px-10">
               <div className="w-60 h-60 mx-auto relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[10px] border-slate-900 border-dashed opacity-10 animate-spin-slow"></div>
                  <div className="w-52 h-52 bg-red-800 rounded-full flex items-center justify-center border-[8px] border-slate-900 shadow-2xl relative">
                    <Shield className="w-32 h-32 text-white fill-white/10" />
                  </div>
               </div>
               <h1 className="text-7xl font-black italic tracking-tighter uppercase mt-8 text-red-800 leading-none">
                  NATMA <span className="text-slate-900">SECURITY</span>
               </h1>
               <div className="mt-6 flex flex-col items-center">
                  <div className="flex justify-between items-center w-80 text-[11px] font-black text-slate-800 uppercase px-2 mb-2">
                    <span>REG: 2012/018529/07</span>
                    <span className="text-red-800">EST. 2012</span>
                  </div>
                  <div className="w-full max-w-sm h-1.5 bg-slate-900"></div>
                  <div className="mt-2 text-[12px] tracking-[0.6em] text-red-800 font-black uppercase italic">Ultimate Safeguarding</div>
               </div>
            </div>
          </div>

          {/* Client Details Block */}
          <div className="grid grid-cols-2 gap-12 mb-16 pb-12 border-b-2 border-slate-100">
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">SECURITY DOSSIER FOR:</h4>
              <div className="space-y-4">
                <div className="border-l-4 border-red-800 pl-6">
                  <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                    {customerName || 'UNIDENTIFIED CLIENT'}
                  </p>
                  <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest leading-relaxed max-w-sm mb-2">
                    {customerAddress || 'LOCATION PENDING SECURE CLASSIFICATION'}
                  </p>
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-3 text-[11px] font-black text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg w-fit">
                      <Phone className="w-4 h-4" />
                      {customerPhone || 'PHONE PENDING'}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-black text-red-800 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg w-fit">
                      <Mail className="w-4 h-4" />
                      {customerEmail || 'EMAIL PENDING'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <h2 className="text-5xl font-black text-slate-100 uppercase tracking-tighter mb-4 select-none opacity-40">OFFICIAL QUOTE</h2>
              <div className="space-y-1">
                <p className="text-slate-900 font-black text-lg uppercase tracking-widest">ISSUANCE: {date}</p>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">REF: NATMA-{crypto.randomUUID().slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* AI Summary Block */}
          {aiSummary && (
             <div className="mb-16 p-10 bg-slate-50 border-r-[12px] border-red-800 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-800/5 rounded-full blur-2xl"></div>
                <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-red-800 mb-4 flex items-center gap-3">
                   <ShieldCheck className="w-5 h-5" /> STRATEGIC SECURITY ANALYSIS
                </h5>
                <p className="text-slate-900 italic font-black text-xl leading-relaxed relative">"{aiSummary}"</p>
             </div>
          )}

          {/* Line Items Table */}
          <table className="w-full mb-20 border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="py-6 px-8 text-left font-black uppercase text-[11px] tracking-[0.4em]">Asset Specification</th>
                <th className="py-6 px-8 text-center font-black uppercase text-[11px] tracking-[0.4em]">Units</th>
                <th className="py-6 px-8 text-right font-black uppercase text-[11px] tracking-[0.4em]">Unit Rate</th>
                <th className="py-6 px-8 text-right font-black uppercase text-[11px] tracking-[0.4em]">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {lineItems.map(item => (
                <tr key={item.id}>
                  <td className="py-8 px-8">
                    <p className="font-black text-slate-900 uppercase text-lg leading-none">{item.description}</p>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Hardware Tag: {item.code}</p>
                  </td>
                  <td className="py-8 px-8 text-center text-slate-900 font-black text-2xl tabular-nums">{item.quantity}</td>
                  <td className="py-8 px-8 text-right text-slate-600 font-bold text-sm tabular-nums">R {item.unitPrice.toFixed(2)}</td>
                  <td className="py-8 px-8 text-right font-black text-slate-900 text-2xl tabular-nums">R {item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Block */}
          <div className="flex justify-end mb-28">
            <div className="w-96 p-10 bg-slate-950 text-white rounded-[40px] shadow-2xl relative">
              <div className="absolute -top-6 -left-6 bg-red-800 p-4 rounded-3xl shadow-xl">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-5">
                <div className="flex justify-between text-slate-500 font-black text-[11px] uppercase tracking-[0.3em]">
                  <span>Net Subtotal</span>
                  <span className="tabular-nums font-bold">R {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-black text-[11px] uppercase tracking-[0.3em]">
                  <span>VAT Allocation (15%)</span>
                  <span className="tabular-nums font-bold">R {tax.toFixed(2)}</span>
                </div>
                <div className="pt-8 border-t border-slate-800 flex justify-between items-center font-black text-3xl text-white uppercase tracking-tighter">
                  <span className="text-[11px] tracking-[0.4em] text-slate-500">INVESTMENT</span>
                  <span className="tabular-nums">R {total.toFixed(2)}</span>
                </div>
                
                {/* 70% Deposit Highlight */}
                <div className="mt-8 pt-8 border-t-2 border-red-900/50">
                  <div className="bg-red-900/20 p-6 rounded-3xl border border-red-800/30 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">70% DEPOSIT</span>
                      <span className="text-3xl font-black text-red-500 tabular-nums">R {deposit.toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] text-red-700 font-black uppercase tracking-widest text-center mt-2 italic">REQUIRED TO AUTHORIZE DEPLOYMENT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Signature & Terms */}
          <div className="border-t-[12px] border-slate-900 pt-16 grid grid-cols-2 gap-20">
            <div>
              <h6 className="text-[12px] font-black uppercase tracking-[0.4em] text-red-800 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-800 rounded-full"></div> 
                NATMA SAFEGUARDING PROTOCOLS
              </h6>
              <ul className="text-[11px] text-slate-700 font-black list-disc pl-6 space-y-3 uppercase leading-relaxed">
                <li>QUOTATION VALIDITY: FOURTEEN (14) BUSINESS DAYS FROM ISSUANCE.</li>
                <li>DEPOSIT: 70% COMMENCEMENT FEE MANDATORY FOR ASSET STAGING.</li>
                <li>OWNERSHIP: ALL HARDWARE REMAINS NATMA PROPERTY UNTIL 100% CLEARANCE.</li>
                <li>WARRANTY: TWELVE (12) MONTH TECHNICAL GUARANTEE ON IMPLEMENTATION.</li>
              </ul>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="w-64 border-b-[6px] border-red-800 mb-4 h-24 bg-slate-50 relative">
                <div className="absolute bottom-2 right-2 text-[10px] text-slate-200 font-black uppercase italic tracking-widest">Natma Security Authorized</div>
              </div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Chief Security Officer</p>
              <p className="text-[10px] text-red-800 font-black tracking-[0.5em] mt-2 italic">NATMA STRATEGIC OPERATIONS</p>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-4 bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.5em] shadow-xl">
              <Shield className="w-4 h-4 text-red-600" />
              Your Safety Is Our Strategic Objective
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
