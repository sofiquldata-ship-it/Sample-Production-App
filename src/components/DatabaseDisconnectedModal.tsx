import React from 'react';
import { AlertTriangle, Database, RefreshCw, X, LogIn } from 'lucide-react';

interface DatabaseDisconnectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  errorMessage?: string;
  isConnecting?: boolean;
}

export const DatabaseDisconnectedModal: React.FC<DatabaseDisconnectedModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  errorMessage,
  isConnecting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden text-slate-800">
        {/* Header Ribbon */}
        <div className="bg-[#8C1D35] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-red-200" />
            <h3 className="font-bold text-sm tracking-tight text-white">Database Status</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-red-700">Database not connected</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Google Sheets live database is not connected. The app cannot auto-load production data from your cloud sheet.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50/70 border border-red-200/80 rounded-lg p-2.5 text-[11px] text-red-800 break-words font-mono">
              {errorMessage}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
            <p className="font-semibold text-slate-700 flex items-center space-x-1.5">
              <span>Auto-connection notice:</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              Click Connect below to authorize your Google Account with Google Sheets access. Once connected, your sample records will load automatically every time you open the app.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="w-full bg-[#8C1D35] hover:bg-[#78162b] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting Database...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-white" />
                  <span>Connect Google Sheets Database</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Dismiss & Continue Offline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
