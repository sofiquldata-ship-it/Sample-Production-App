import React from 'react';
import { ArrowLeft, Calendar, ChevronRight, Check } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';
import { ProductItem } from '../types/production';
import { cleanProductType } from '../utils/formatters';

export const SampleDetailsScreen: React.FC = () => {
  const { selectedSample, samples, openUpdateStage, setActiveTab } = useProduction();

  const sample = selectedSample || samples[0] || null;
  if (!sample) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">No Sample Selected</p>
        <p className="text-xs text-slate-500">Please upload your Excel Pending Report first.</p>
        <button
          onClick={() => setActiveTab('excel')}
          className="bg-[#8C1D35] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
        >
          Go to Excel Upload
        </button>
      </div>
    );
  }

  // Helper function to check if a stage is completed or done
  const isDone = (state?: string) => state === 'Done' || state === 'Completed';
  const isInProgress = (state?: string) => state === 'In Progress';
  const isActiveOrDone = (state?: string) => isDone(state) || isInProgress(state);

  // Calculate summary counts across sample products
  const extrusionCount = sample.products.filter((p) => isActiveOrDone(p.stages.Extrusion?.state)).length;
  const printingCount = sample.products.filter((p) => isActiveOrDone(p.stages.Printing?.state)).length;
  const bagMakingCount = sample.products.filter((p) => isActiveOrDone(p.stages['Bag Making']?.state)).length;
  const dispatchCount = sample.products.filter((p) => isActiveOrDone(p.stages.Dispatch?.state)).length;

  return (
    <div className="flex-1 flex flex-col bg-[#f9fafb] overflow-y-auto no-scrollbar">
      {/* App Bar Navigation */}
      <header className="bg-[#8C1D35] text-white shrink-0 shadow-md">
        <div className="flex items-center px-4 py-3 gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="text-white hover:opacity-80 p-0.5 focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-lg font-semibold tracking-wide text-white">Sample Details</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3.5 py-3 space-y-3">
        {/* Sample Info Card */}
        <section className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex justify-between items-start">
            <h2 className="text-[17px] font-bold text-[#8C1D35] tracking-tight">{sample.id}</h2>
            <span className="bg-[#2a75e6] text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-2xs">
              {sample.status}
            </span>
          </div>
          <div className="mt-1 text-[13px] text-slate-800 font-medium">
            Buyer: <span className="font-bold text-black">{sample.buyer}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center text-slate-600 text-xs gap-1.5 font-normal">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>
                Request Date: <span className="font-medium text-slate-700">{sample.requestDate}</span>
              </span>
            </div>
            <span className="text-xs text-slate-700 font-semibold px-2 py-0.5 border border-slate-300 rounded-md bg-white">
              {sample.products.length} Products
            </span>
          </div>
        </section>

        {/* Production Summary Card */}
        <section className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#8C1D35] mb-2">Production Summary</h3>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {/* Box 1: Extrusion */}
            <div className="bg-[#edf5fd] rounded-lg py-2 border border-[#d6e7fa]">
              <p className="text-[11px] font-medium text-[#2d6bb3]">Extrusion</p>
              <p className="text-base font-bold text-[#1a5599] mt-0.5 leading-none">{extrusionCount}</p>
            </div>
            {/* Box 2: Printing */}
            <div className="bg-[#f5eefb] rounded-lg py-2 border border-[#e8d7fa]">
              <p className="text-[11px] font-medium text-[#873ec8]">Printing</p>
              <p className="text-base font-bold text-[#7220b8] mt-0.5 leading-none">{printingCount}</p>
            </div>
            {/* Box 3: Bag Making */}
            <div className="bg-[#fdf6ec] rounded-lg py-2 border border-[#fae8cc]">
              <p className="text-[11px] font-medium text-[#c0731f] leading-tight">Bag Making</p>
              <p className="text-base font-bold text-[#b5650d] mt-0.5 leading-none">{bagMakingCount}</p>
            </div>
            {/* Box 4: Dispatch */}
            <div className="bg-[#edf9f1] rounded-lg py-2 border border-[#d2f3dc]">
              <p className="text-[11px] font-medium text-[#268f4e]">Dispatch</p>
              <p className="text-base font-bold text-[#1c783e] mt-0.5 leading-none">{dispatchCount}</p>
            </div>
          </div>
        </section>

        {/* Products List Section */}
        <section className="space-y-2.5">
          <h3 className="text-[15px] font-bold text-slate-900 px-0.5">
            Products ({sample.products.length})
          </h3>

          {sample.products.map((product, idx) => {
            const num = idx + 1;
            const extState = product.stages.Extrusion;
            const prtState = product.stages.Printing;
            const bagState = product.stages['Bag Making'];
            const disState = product.stages.Dispatch;

            return (
              <article
                key={product.uniqueId}
                onClick={() => openUpdateStage(sample, product, product.currentStage)}
                className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs cursor-pointer hover:border-[#8C1D35] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#8C1D35] text-white rounded text-xs font-bold shrink-0">
                      {num}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-none">
                          {product.name}
                        </h4>
                        {product.productType && (
                          <span className="text-[9.5px] font-semibold text-[#006398] bg-blue-50/90 border border-blue-200 px-1.5 py-0.2 rounded">
                            {cleanProductType(product.productType)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-none font-normal">
                        UniqueId: {product.uniqueId}
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Stepper Timeline Card */}
                <div className="mt-4 pt-1 pb-1">
                  <div className="relative flex items-center justify-between px-3">
                    {/* Connecting Line */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-300 -z-0" />

                    {/* Node 1: Extrusion */}
                    {isDone(extState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white ring-2 ring-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : isInProgress(extState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center ring-2 ring-white">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    ) : (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-slate-400" />
                    )}

                    {/* Node 2: Printing */}
                    {isDone(prtState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white ring-2 ring-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : isInProgress(prtState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center ring-2 ring-white">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    ) : (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-slate-400" />
                    )}

                    {/* Node 3: Bag Making */}
                    {isDone(bagState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white ring-2 ring-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : isInProgress(bagState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center ring-2 ring-white">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    ) : (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-slate-400" />
                    )}

                    {/* Node 4: Dispatch */}
                    {isDone(disState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white ring-2 ring-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : isInProgress(disState.state) ? (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center ring-2 ring-white">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    ) : (
                      <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-slate-400" />
                    )}
                  </div>

                  {/* Labels Row */}
                  <div className="grid grid-cols-4 text-center mt-1.5 text-[10px] leading-tight">
                    <div>
                      <span className="font-medium text-slate-800 block">Extrusion</span>
                      {isDone(extState.state) && (
                        <>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">✓ Done</span>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">
                            ({extState.durationDays || 1} {extState.durationDays === 1 ? 'Day' : 'Days'})
                          </span>
                        </>
                      )}
                      {isInProgress(extState.state) && (
                        <>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">In Progress</span>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">
                            ({extState.durationDays || 3} Days)
                          </span>
                        </>
                      )}
                      {!isDone(extState.state) && !isInProgress(extState.state) && (
                        <span className="text-slate-400 block mt-0.5">-</span>
                      )}
                    </div>

                    <div>
                      <span className="font-medium text-slate-800 block">Printing</span>
                      {isDone(prtState.state) && (
                        <>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">✓ Done</span>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">
                            ({prtState.durationDays || 1} {prtState.durationDays === 1 ? 'Day' : 'Days'})
                          </span>
                        </>
                      )}
                      {isInProgress(prtState.state) && (
                        <>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">In Progress</span>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">
                            ({prtState.durationDays || 1} Day)
                          </span>
                        </>
                      )}
                      {!isDone(prtState.state) && !isInProgress(prtState.state) && (
                        <span className="text-slate-400 block mt-0.5">-</span>
                      )}
                    </div>

                    <div>
                      <span className="font-medium text-slate-800 block">Bag Making</span>
                      {isDone(bagState.state) && (
                        <>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">✓ Done</span>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">
                            ({bagState.durationDays || 2} Days)
                          </span>
                        </>
                      )}
                      {isInProgress(bagState.state) && (
                        <>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">In Progress</span>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">
                            ({bagState.durationDays || 2} Days)
                          </span>
                        </>
                      )}
                      {!isDone(bagState.state) && !isInProgress(bagState.state) && (
                        <span className="text-slate-400 block mt-0.5">-</span>
                      )}
                    </div>

                    <div>
                      <span className="font-medium text-slate-800 block">Dispatch</span>
                      {isDone(disState.state) && (
                        <>
                          <span className="text-emerald-600 font-semibold block text-[9.5px]">✓ Done</span>
                        </>
                      )}
                      {!isDone(disState.state) && (
                        <span className="text-slate-400 block mt-0.5">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};
