import React from 'react';
import { ArrowLeft, Filter, QrCode, ShieldCheck, RefreshCw, GitCommit, FileUp, Calendar, User, Lock, ArrowRight } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';

export const AuditLogScreen: React.FC = () => {
  const { selectedSample, samples, auditLogs, setActiveTab } = useProduction();

  const sample = selectedSample || samples[0] || null;
  if (!sample) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9ff] p-6 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">No Audit History Available</p>
        <p className="text-xs text-slate-500">Upload your Excel Pending Report first to view sample audit logs.</p>
        <button
          onClick={() => setActiveTab('excel')}
          className="bg-[#8C1D35] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
        >
          Go to Excel Upload
        </button>
      </div>
    );
  }

  const logsForSample = auditLogs.filter((l) => l.sampleId === sample.id);

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9ff] overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="bg-[#8C1D35] text-white flex justify-between items-center w-full px-4 py-3 shrink-0 shadow-md">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('details')}
            className="p-1 -ml-1 text-white hover:bg-[#78162b] transition-colors rounded cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">Sample History & Audit Log</h1>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 text-white hover:bg-[#78162b] rounded cursor-pointer">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-6 space-y-3 bg-[#f8f9fa]">
        {/* Sample Header Identification Card */}
        <section className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-lg font-bold text-[#8C1D35] tracking-tight">{sample.id}</span>
              <div className="text-xs text-slate-700 flex items-center space-x-1">
                <span className="font-medium text-slate-500">Buyer:</span>
                <span className="font-bold text-slate-900">{sample.buyer}</span>
              </div>
            </div>
            {/* Status Chip */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#006398] border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006398] mr-1.5 animate-pulse" />
              {sample.status}
            </span>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <QrCode className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] text-slate-500">UniqueId:</span>
              <span className="font-mono font-semibold text-slate-800">
                {sample.products[1]?.uniqueId || sample.products[0]?.uniqueId || '26039765'}
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
              {sample.products[1]?.name || sample.products[0]?.name || 'UARM_PB_300X350_100%'}
            </span>
          </div>

          {/* Read-Only Audit Flag Banner */}
          <div className="mt-2.5 bg-amber-50/70 border border-amber-200/80 rounded px-2.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="text-[11px] font-semibold tracking-wide">Immutable System Log</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-amber-700 uppercase">
              READ-ONLY AUDIT TRAIL
            </span>
          </div>
        </section>

        {/* Section Title & Counter */}
        <div className="flex items-center justify-between px-0.5 pt-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-bold text-slate-900">Lifecycle Timeline</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {logsForSample.length} Recorded Events
          </span>
        </div>

        {/* Vertical Timeline Component */}
        <div className="relative pl-5 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-3 before:w-[2px] before:bg-slate-200">
          {logsForSample.map((log, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;

            return (
              <div key={log.id} className="relative group">
                {/* Timeline Marker Icon */}
                <div
                  className={`absolute -left-5 top-1 w-6 h-6 rounded-full text-white flex items-center justify-center ring-4 ring-[#f8f9fa] shadow-2xs z-10 ${
                    isFirst
                      ? 'bg-[#8C1D35]'
                      : isSecond
                      ? 'bg-[#006398]'
                      : 'bg-slate-600'
                  }`}
                >
                  {isFirst ? (
                    <RefreshCw className="w-3 h-3" />
                  ) : isSecond ? (
                    <GitCommit className="w-3 h-3" />
                  ) : (
                    <FileUp className="w-3 h-3" />
                  )}
                </div>

                {/* Card Content */}
                <div
                  className={`bg-white rounded-lg border border-slate-200 p-3 shadow-2xs border-l-4 ${
                    isFirst
                      ? 'border-l-[#8C1D35]'
                      : isSecond
                      ? 'border-l-[#006398]'
                      : 'border-l-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span
                        className={`inline-block text-[11px] px-1.5 py-0.5 rounded font-bold mb-1 ${
                          log.stageTag === 'Extrusion'
                            ? 'bg-sky-50 text-sky-700'
                            : log.stageTag === 'Routing Plan'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {log.stageTag}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {log.title}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-500 whitespace-nowrap">
                      {log.timeStr}
                    </span>
                  </div>

                  {/* Metadata Box */}
                  <div className="mt-2 space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded p-2 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        Date
                      </span>
                      <span className="font-medium text-slate-800">{log.date}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center">
                        <User className="w-3 h-3 mr-1 text-slate-400" />
                        Updated By
                      </span>
                      <span className="font-medium text-slate-800">{log.updatedBy}</span>
                    </div>
                  </div>

                  {/* Remarks / Chain / File */}
                  {log.remarks && (
                    <div className="mt-2 text-xs bg-amber-50/50 rounded p-2 border border-amber-100/70 text-slate-800">
                      <span className="text-[11px] font-bold text-amber-900 block mb-0.5">Remarks:</span>
                      <p className="italic text-slate-700 leading-relaxed text-[11.5px]">
                        "{log.remarks}"
                      </p>
                    </div>
                  )}

                  {log.sequenceChain && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 block mb-1.5">Configured Stage Sequence:</span>
                      <div className="flex items-center gap-1 text-[11px] font-medium overflow-x-auto py-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                          Extrusion (Req)
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 line-through border border-slate-200 whitespace-nowrap">
                          Printing (Not Req)
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                          Bag Making (Req)
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">
                          Dispatch
                        </span>
                      </div>
                    </div>
                  )}

                  {log.fileName && (
                    <div className="mt-2 flex items-center space-x-2 text-xs bg-slate-100/80 rounded px-2.5 py-1.5 border border-slate-200 text-slate-700">
                      <FileUp className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate font-mono text-[11px] font-medium" title={log.fileName}>
                        {log.fileName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* End of Record Indicator */}
        <div className="pt-3 pb-2 text-center">
          <span className="inline-flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            <Lock className="w-3 h-3" />
            <span>Beginning of Audit Trail for {sample.id}</span>
          </span>
        </div>
      </main>
    </div>
  );
};
