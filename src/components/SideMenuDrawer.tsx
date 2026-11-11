import React from 'react';
import { X, Home, RefreshCw, BarChart3, History, Upload, RotateCcw, Package, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';

export const SideMenuDrawer: React.FC = () => {
  const { isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, resetToDemo } = useProduction();

  if (!isMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Drawer Header */}
        <div className="bg-[#8C1D35] text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="border border-white/90 rounded p-1 w-6 h-6 flex items-center justify-center">
              <Package className="w-4 h-4 text-white stroke-[1.8]" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight leading-tight">MPBL Production Tracker</h2>
              <p className="text-[10px] text-white/80">Menu Options</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1 hover:bg-[#78162b] rounded text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto text-xs">
          {/* Home option */}
          <button
            onClick={() => {
              setActiveTab('home');
              setIsMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-lg font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeTab === 'home' ? 'bg-[#8C1D35] text-white font-bold' : 'text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Home className="w-4 h-4 shrink-0" />
              <span>Home (Sample List)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Featured Upload Excel Option */}
          <button
            onClick={() => {
              setActiveTab('excel');
              setIsMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-lg font-bold flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'excel'
                ? 'bg-[#8C1D35] text-white shadow-xs'
                : 'bg-[#fcf0f2] text-[#8C1D35] border border-[#f3ccd3] hover:bg-[#f8e3e7]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Upload className="w-4 h-4 text-[#8C1D35] stroke-[2.2] shrink-0" />
              <span className="text-xs font-bold">Upload Excel (Pending Report)</span>
            </div>
            <span className="text-[10px] bg-[#8C1D35] text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
              Excel
            </span>
          </button>

          {/* Google Sheets Live Database Option */}
          <button
            onClick={() => {
              setActiveTab('sheets' as any);
              setIsMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-lg font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeTab === 'sheets' ? 'bg-[#8C1D35] text-white font-bold' : 'text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Google Sheet Database</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Update Stage option */}
          <button
            onClick={() => {
              setActiveTab('update');
              setIsMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-lg font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeTab === 'update' ? 'bg-[#8C1D35] text-white font-bold' : 'text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>Update Production Stage</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Report option */}
          <button
            onClick={() => {
              setActiveTab('report');
              setIsMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-lg font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeTab === 'report' ? 'bg-[#8C1D35] text-white font-bold' : 'text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Production Reports</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* More History / Audit Log option */}
          <button
            onClick={() => {
              setActiveTab('more');
              setIsMenuOpen(false);
            }}
            className={`w-full p-2.5 rounded-lg font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeTab === 'more' ? 'bg-[#8C1D35] text-white font-bold' : 'text-[#0F172A] hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <History className="w-4 h-4 shrink-0" />
              <span>Sample History & Audit Log</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Footer Reset Button */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-1">
          <button
            onClick={() => {
              resetToDemo();
              setIsMenuOpen(false);
            }}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      <div className="flex-1" onClick={() => setIsMenuOpen(false)} />
    </div>
  );
};
