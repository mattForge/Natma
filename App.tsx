
import React, { useState, useEffect } from 'react';
import { QuoteGenerator } from './components/QuoteGenerator';
import { DatabaseManager } from './components/DatabaseManager';
import { TabType, QuoteItem } from './types';
import { dbService } from './services/supabaseService';
import { FileText, Database, Shield, Loader2, AlertTriangle, RefreshCw, Terminal, CheckCircle2, Copy, ExternalLink, ShieldAlert, CircleSlash } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generator');
  const [dbItems, setDbItems] = useState<QuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshItems();
  }, []);

  const refreshItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await dbService.getItems();
      if (result.error) {
        setError(result.error.message || "Could not connect to Supabase.");
      } else {
        setDbItems(result.data);
      }
    } catch (err) {
      setError("An unexpected error occurred while connecting to the database.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copySql = () => {
    const sql = `-- UNLOCK ALL PERMISSIONS (Development)
ALTER TABLE "natmaProducts" DISABLE ROW LEVEL SECURITY;

-- OR ENABLE SELECT/INSERT/UPDATE/DELETE INDIVIDUALLY
CREATE POLICY "Public Full Access" ON "public"."natmaProducts" 
FOR ALL USING (true) WITH CHECK (true);`;
    navigator.clipboard.writeText(sql);
    alert('SQL Command copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter']">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 no-print shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-red-800 p-2.5 rounded-full border-2 border-slate-400 shadow-[0_0_15px_rgba(153,27,27,0.4)]">
                  <Shield className="w-7 h-7 text-white fill-white/10" />
                </div>
                <div className="absolute -inset-1 border border-red-500/30 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-100 tracking-tighter uppercase leading-none">
                  Natma <span className="text-red-600 block text-sm tracking-[0.2em] font-bold mt-1">Security</span>
                </h1>
              </div>
            </div>
            
            <nav className="flex space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('generator')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all ${
                  activeTab === 'generator'
                    ? 'bg-red-700 shadow-md text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Create Quote</span>
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all ${
                  activeTab === 'database'
                    ? 'bg-slate-700 shadow-md text-red-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Inventory</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-950/20 border-2 border-red-900 p-8 rounded-3xl text-center max-w-2xl mx-auto my-12 shadow-2xl">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-100 mb-2">Database Connection Error</h2>
            <p className="text-red-400 mb-6 font-medium">{error}</p>
            <button 
              onClick={refreshItems}
              className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reconnect System
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative mb-6">
               <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
               <Shield className="w-6 h-6 text-red-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-400 font-bold text-lg tracking-widest uppercase">Syncing Natma Inventory...</p>
          </div>
        ) : dbItems.length === 0 ? (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-red-800 p-6 text-white flex items-center gap-4">
                <ShieldAlert className="w-12 h-12" />
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Security Access Locked</h2>
                  <p className="opacity-90 text-sm italic">Row Level Security is currently protecting the 'natmaProducts' database.</p>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-red-500" />
                      Run this in Supabase SQL Editor:
                    </h3>
                    <button 
                      onClick={copySql}
                      className="text-xs flex items-center gap-1 font-bold text-red-400 hover:text-red-300"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Bypass SQL
                    </button>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed border border-slate-700">
                    <pre>{`ALTER TABLE "natmaProducts" DISABLE ROW LEVEL SECURITY;`}</pre>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={refreshItems}
                    className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Verify Data Handshake
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'generator' ? (
              <QuoteGenerator dbItems={dbItems} onRefreshItems={refreshItems} />
            ) : (
              <DatabaseManager dbItems={dbItems} onRefreshItems={refreshItems} />
            )}
          </>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black">
          &copy; {new Date().getFullYear()} Natma <span className="text-red-700">Security</span> | Ultimate Safeguarding
        </div>
      </footer>
    </div>
  );
};

export default App;
