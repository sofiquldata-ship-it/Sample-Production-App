import React from 'react';
import { Menu, Bell, Calendar, ChevronDown, Download, BarChart3 } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';

export const ReportScreen: React.FC = () => {
  const { samples, setIsMenuOpen } = useProduction();

  // Dynamic Metrics
  const totalSamples = samples.length;
  const inProductionCount = samples.filter((s) => s.status === 'In Production').length;
  const completedCount = samples.filter((s) => s.status === 'Completed').length;

  // Work center stage active counts across all products
  const allProducts = samples.flatMap((s) => s.products);
  const extrusionActive = allProducts.filter((p) => p.stages.Extrusion.state === 'In Progress' || p.stages.Extrusion.state === 'Done').length;
  const printingActive = allProducts.filter((p) => p.stages.Printing.state === 'In Progress' || p.stages.Printing.state === 'Done').length;
  const bagMakingActive = allProducts.filter((p) => p.stages['Bag Making'].state === 'In Progress' || p.stages['Bag Making'].state === 'Done').length;
  const dispatchActive = allProducts.filter((p) => p.stages.Dispatch.state === 'In Progress' || p.stages.Dispatch.state === 'Done').length;

  const handleExportExcel = () => {
    // Generate real CSV export dynamically from live samples array
    let csv = 'Sample ID,Buyer,Request Date,Status,Total Products,Product Names,Current Stages\n';
    samples.forEach((s) => {
      const prodNames = s.products.map((p) => p.name).join(' | ');
      const prodStages = s.products.map((p) => p.currentStage).join(' | ');
      csv += `"${s.id}","${s.buyer}","${s.requestDate}","${s.status}",${s.products.length},"${prodNames}","${prodStages}"\n`;
    });

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csv}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MPBL_Production_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9ff] overflow-y-auto no-scrollbar">
      {/* Top Header App Bar */}
      <nav className="bg-[#8C1D35] text-white docked full-width top-0 border-b border-[#78162b] flex justify-between items-center w-full px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Menu"
            className="p-1 rounded hover:bg-[#78162b] text-white transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
          <span className="text-lg font-bold text-white tracking-tight">MPBL Production Tracker</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Notifications"
            className="p-1 rounded hover:bg-[#78162b] text-white transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#8C1D35]" />
          </button>
        </div>
      </nav>

      {/* Subheader / Screen Context */}
      <div className="bg-[#eff4ff] px-4 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-[18px] h-[18px] text-[#8C1D35]" />
          <h1 className="text-xs font-bold text-[#8C1D35]">Production Reports</h1>
        </div>
        <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
          Factory Ops A
        </span>
      </div>

      {/* Main Content Canvas */}
      <main className="flex-1 px-4 pt-3 pb-6 space-y-3.5">
        {/* Quick Date Filter Card */}
        <section className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center justify-between">
            <span>Date Range Filter</span>
            <span className="text-[11px] text-[#006398] font-semibold cursor-pointer">PRESET</span>
          </div>
          <button className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#8C1D35]" />
              <div>
                <div className="text-xs font-bold text-slate-900">Last 30 Days (01-Nov - 30-Nov 2026)</div>
                <div className="text-[11px] text-slate-500">30 Production Days Evaluated</div>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-500" />
          </button>
        </section>

        {/* Key Operational Metrics 2x2 Grid */}
        <section>
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Throughput Overview</h2>
            <span className="text-[11px] text-[#006398] font-medium">Auto-synced Live</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Total Samples */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="text-[26px] font-bold text-[#006398] leading-none mb-1">{totalSamples}</div>
              <div className="text-xs font-semibold text-slate-900">Total Samples</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Received MTD</div>
            </div>
            {/* Avg Lead Time */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="text-[26px] font-bold text-amber-700 leading-none mb-1">
                7.4 <span className="text-xs font-semibold text-amber-800">Days</span>
              </div>
              <div className="text-xs font-semibold text-slate-900">Avg Lead Time</div>
              <div className="text-[10px] text-amber-800/80 mt-0.5">SLA Target: 8.0 Days</div>
            </div>
            {/* In Production */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="text-[26px] font-bold text-[#603100] leading-none mb-1">{inProductionCount}</div>
              <div className="text-xs font-semibold text-slate-900">In Production</div>
              <div className="text-[10px] text-[#603100] mt-0.5">Active In-Flight Jobs</div>
            </div>
            {/* Completed */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="text-[26px] font-bold text-emerald-700 leading-none mb-1">{completedCount}</div>
              <div className="text-xs font-semibold text-slate-900">Completed</div>
              <div className="text-[10px] text-emerald-800/80 mt-0.5">Dispatched to Buyer</div>
            </div>
          </div>
        </section>

        {/* Section-wise Production Stage Breakdown */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Production Stage Breakdown</h2>
            <span className="text-[11px] text-slate-500 font-medium">4 Work Centers</span>
          </div>

          {/* Stage 1: Extrusion */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006398]" />
                <span className="text-sm font-bold text-slate-900">Extrusion</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Avg 2.1 Days
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#eff4ff] rounded-lg p-2 border border-slate-200 text-center">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900">{extrusionActive}</span>
                <span className="text-[11px] text-slate-500">Active Products</span>
              </div>
              <div className="flex flex-col border-l border-slate-300">
                <span className="text-lg font-bold text-red-600">0</span>
                <span className="text-[11px] text-red-600 font-medium">Overdue (&gt;2d)</span>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-mono">
                <span>Throughput Rate</span>
                <span className="font-bold text-slate-900">100% Normal</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#006398] h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Stage 2: Printing */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span className="text-sm font-bold text-slate-900">Printing</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Avg 1.3 Days
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#eff4ff] rounded-lg p-2 border border-slate-200 text-center">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900">{printingActive}</span>
                <span className="text-[11px] text-slate-500">Active Products</span>
              </div>
              <div className="flex flex-col border-l border-slate-300">
                <span className="text-lg font-bold text-red-600">0</span>
                <span className="text-[11px] text-red-600 font-medium">Overdue (&gt;1d)</span>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-mono">
                <span>Throughput Rate</span>
                <span className="font-bold text-slate-900">100% Optimal</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Stage 3: Bag Making */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span className="text-sm font-bold text-slate-900">Bag Making</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Avg 2.8 Days
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#eff4ff] rounded-lg p-2 border border-slate-200 text-center">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900">{bagMakingActive}</span>
                <span className="text-[11px] text-slate-500">Active Products</span>
              </div>
              <div className="flex flex-col border-l border-slate-300">
                <span className="text-lg font-bold text-red-600">0</span>
                <span className="text-[11px] text-red-600 font-medium">Overdue (&gt;2.5d)</span>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-mono">
                <span>Throughput Rate</span>
                <span className="font-bold text-emerald-700">100% Optimal</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Stage 4: Dispatch */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-sm font-bold text-slate-900">Dispatch</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Avg 1.2 Days
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#eff4ff] rounded-lg p-2 border border-slate-200 text-center">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-emerald-700">{dispatchActive}</span>
                <span className="text-[11px] text-slate-500">Active Products</span>
              </div>
              <div className="flex flex-col border-l border-slate-300">
                <span className="text-lg font-bold text-slate-900">{completedCount}</span>
                <span className="text-[11px] text-slate-500">Dispatched Out</span>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-mono">
                <span>Delivery Adherence</span>
                <span className="font-bold text-emerald-700">100% On Time</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Export Button */}
        <section className="pt-1 pb-2">
          <button
            onClick={handleExportExcel}
            className="w-full bg-[#8C1D35] text-white hover:bg-[#78162b] transition-colors py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.2]" />
            <span>Export Full Report to Excel (.csv)</span>
          </button>
        </section>
      </main>
    </div>
  );
};
