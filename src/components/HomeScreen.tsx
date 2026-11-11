import React from 'react';
import { Menu, Package, Search, Calendar, ChevronRight, Upload } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';
import { Sample } from '../types/production';
import { cleanProductType } from '../utils/formatters';

export const HomeScreen: React.FC = () => {
  const {
    samples,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    openSampleDetails,
    setActiveTab,
    setIsMenuOpen,
    isDbConnected,
    isConnectingDb,
    setIsDbModalOpen,
  } = useProduction();

  // Dynamic KPI summary counts calculated directly from active samples state
  const totalSamples = samples.length;
  const inProductionCount = samples.filter((s) => s.status === 'In Production').length;
  const completedCount = samples.filter((s) => s.status === 'Completed').length;
  const overdueCount = samples.filter((s) => s.status === 'Overdue').length;

  // Filter samples by search and status
  const filteredSamples = samples.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = s.id.toLowerCase().includes(q);
      const matchBuyer = s.buyer.toLowerCase().includes(q);
      if (!matchId && !matchBuyer) return false;
    }

    if (filterStatus !== 'ALL' && s.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status: Sample['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-[#e1f7e7] text-[#15803d] border-[#c4eecf]';
      case 'Overdue':
        return 'bg-[#ffe8e8] text-[#dc2626] border-[#fecaca]';
      case 'In Production':
      default:
        return 'bg-[#e7f0fd] text-[#2563eb] border-[#d3e2fb]';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto no-scrollbar">
      {/* Top Application Bar (Lighter Maroon #8C1D35) */}
      <div className="bg-[#8C1D35] text-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1 -ml-1 text-white hover:text-white/80 focus:outline-none cursor-pointer"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
          <div className="flex items-center space-x-2 ml-3">
            <div className="border border-white/90 rounded p-1 w-6 h-6 flex items-center justify-center">
              <Package className="w-4 h-4 text-white stroke-[1.8]" />
            </div>
            <h1 className="text-base font-bold tracking-normal leading-tight">Sample Production Tracker</h1>
          </div>
        </div>

        {/* Database Status Indicator Button */}
        <button
          onClick={() => {
            if (!isDbConnected) {
              setIsDbModalOpen(true);
            } else {
              setActiveTab('sheets' as any);
            }
          }}
          className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
            isDbConnected
              ? 'bg-emerald-600/90 text-white hover:bg-emerald-600'
              : 'bg-red-950/70 border border-red-400 text-red-200 hover:bg-red-900 animate-pulse'
          }`}
          title={isDbConnected ? 'Google Sheet Database Connected' : 'Database Not Connected - Click to Connect'}
        >
          <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-300' : 'bg-red-400'}`} />
          <span>{isDbConnected ? 'DB Live' : 'DB Offline'}</span>
        </button>
      </div>

      {/* Main Scrollable Canvas */}
      <main className="flex-1 p-3 space-y-3">
        {/* KPI Summary 4-Grid Cards */}
        <section className="grid grid-cols-4 gap-2">
          {/* Total Samples */}
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`rounded-lg p-2 flex flex-col items-center justify-center text-center shadow-2xs border cursor-pointer transition-all ${
              filterStatus === 'ALL' ? 'ring-2 ring-[#8C1D35]' : ''
            } bg-[#e8f1fd] border-[#d2e3fc]`}
          >
            <span className="text-xl font-extrabold text-[#1a56db] leading-none mb-1">{totalSamples}</span>
            <span className="text-[10px] font-medium text-slate-700 leading-tight">
              Total<br />Samples
            </span>
          </button>

          {/* In Production */}
          <button
            onClick={() => setFilterStatus('In Production')}
            className={`rounded-lg p-2 flex flex-col items-center justify-center text-center shadow-2xs border cursor-pointer transition-all ${
              filterStatus === 'In Production' ? 'ring-2 ring-[#8C1D35]' : ''
            } bg-[#fef3d6] border-[#fae3a6]`}
          >
            <span className="text-xl font-extrabold text-[#b45309] leading-none mb-1">{inProductionCount}</span>
            <span className="text-[10px] font-medium text-slate-700 leading-tight">
              In<br />Production
            </span>
          </button>

          {/* Completed */}
          <button
            onClick={() => setFilterStatus('Completed')}
            className={`rounded-lg p-2 flex flex-col items-center justify-center text-center shadow-2xs border cursor-pointer transition-all ${
              filterStatus === 'Completed' ? 'ring-2 ring-[#8C1D35]' : ''
            } bg-[#e2f7e7] border-[#c3edd0]`}
          >
            <span className="text-xl font-extrabold text-[#15803d] leading-none mb-1">{completedCount}</span>
            <span className="text-[10px] font-medium text-slate-700 leading-tight">
              Completed<br />&nbsp;
            </span>
          </button>

          {/* Overdue */}
          <button
            onClick={() => setFilterStatus('Overdue')}
            className={`rounded-lg p-2 flex flex-col items-center justify-center text-center shadow-2xs border cursor-pointer transition-all ${
              filterStatus === 'Overdue' ? 'ring-2 ring-[#8C1D35]' : ''
            } bg-[#ffe8e8] border-[#ffd2d2]`}
          >
            <span className="text-xl font-extrabold text-[#dc2626] leading-none mb-1">{overdueCount}</span>
            <span className="text-[10px] font-medium text-slate-700 leading-tight">
              Overdue<br />&nbsp;
            </span>
          </button>
        </section>

        {/* Search Field */}
        <section className="pt-0.5">
          <label className="block text-[13px] font-bold text-gray-900 mb-1.5" htmlFor="sample-search">
            Search Sample (SMPL No.)
          </label>
          <div className="flex shadow-2xs rounded-md overflow-hidden border border-gray-300 bg-white focus-within:ring-1 focus-within:ring-[#8C1D35] focus-within:border-[#8C1D35]">
            <input
              id="sample-search"
              type="text"
              placeholder="Search SMPL No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 border-0 text-[13px] text-gray-800 font-medium px-3 py-1.5 focus:ring-0 placeholder-gray-400 focus:outline-none"
            />
            <button
              type="button"
              className="bg-[#8C1D35] hover:bg-[#78162b] px-3.5 flex items-center justify-center transition-colors cursor-pointer text-white"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </section>

        {/* Sample Cards List */}
        <section className="space-y-2.5 pt-0.5">
          {filteredSamples.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center space-y-1.5">
              <p className="text-xs font-bold text-gray-800">No Sample Records Loaded</p>
              <p className="text-[11px] text-gray-500">
                Upload your Pending Report Excel file below to view POLYBAGS sample records.
              </p>
            </div>
          ) : (
            filteredSamples.map((sample, index) => {
              const isFirst = index === 0;
              const productTypesStr = cleanProductType(sample.products[0]?.productType);

              return (
                <article
                  key={sample.id}
                  onClick={() => openSampleDetails(sample)}
                  className={`rounded-xl border p-3 shadow-2xs relative transition-all active:scale-[0.99] cursor-pointer ${
                    isFirst
                      ? 'bg-[#fcf0f2] border-[#f3ccd3]'
                      : 'bg-white border-gray-200/90'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className={`text-[13px] font-bold leading-tight ${isFirst ? 'text-[#8C1D35]' : 'text-gray-900'}`}>
                        {sample.id}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p className="text-[11px] font-semibold text-gray-700">
                          {sample.buyer} <span className="text-gray-400 font-normal">|</span> {sample.products.length} {sample.products.length === 1 ? 'Product' : 'Products'}
                        </p>
                        {productTypesStr && (
                          <span className="text-[9.5px] font-semibold text-[#006398] bg-blue-50/90 border border-blue-200 px-1.5 py-0.2 rounded">
                            {productTypesStr}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status Badge Pill */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                        sample.status
                      )}`}
                    >
                      {sample.status}
                    </span>
                  </div>

                  {/* Card Footer: Retailer (Column D) on the left, Request Date on the right */}
                  <div className="flex items-center justify-between mt-2 pt-0.5 border-t border-slate-100/90 text-[10.5px]">
                    <div className="flex items-center space-x-1.5 min-w-0 pr-2">
                      <span className="font-bold text-slate-800 truncate" title={sample.retailer || sample.buyer}>
                        {sample.retailer || sample.buyer}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-gray-600 font-medium shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span>{sample.requestDate}</span>
                      <ChevronRight className="w-4 h-4 text-gray-700 ml-0.5" />
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Upload Excel Button Bar */}
        <section className="pt-2 pb-1">
          <button
            onClick={() => setActiveTab('excel')}
            className="w-full bg-[#8C1D35] hover:bg-[#78162b] active:bg-[#681123] text-white py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors font-medium text-[13px] cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.2]" />
            <span>
              Upload Excel <span className="font-normal text-white/90">(Pending Report)</span>
            </span>
          </button>
        </section>
      </main>
    </div>
  );
};
