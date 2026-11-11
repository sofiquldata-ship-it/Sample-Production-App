import React, { useState } from 'react';
import { ArrowLeft, Database, CheckCircle, AlertTriangle, RefreshCw, LogIn, ExternalLink, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';

export const GoogleSheetConnectScreen: React.FC = () => {
  const {
    setActiveTab,
    isDbConnected,
    isConnectingDb,
    dbError,
    connectGoogleSheets,
    disconnectDatabase,
    sheetId,
    setSheetId,
    sheetTitle,
    lastSyncTime,
    loadFromGoogleSheet,
    createNewSheetAndSaveData,
    allSamples,
  } = useProduction();

  const [inputSheetId, setInputSheetId] = useState(sheetId);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveAndSync = async () => {
    setSheetId(inputSheetId);
    setSuccessMsg('');
    try {
      await loadFromGoogleSheet(inputSheetId);
      setSuccessMsg('Successfully connected and synced with Google Sheet database!');
    } catch (e: any) {
      // dbError handled in context
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9ff] overflow-y-auto no-scrollbar">
      {/* Top App Bar */}
      <section className="bg-[#8C1D35] text-white px-4 py-3 flex items-center justify-between shadow-sm select-none shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('home')}
            className="p-1 rounded-full hover:bg-black/15 transition-transform flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-bold tracking-tight text-white">Google Sheet Database</h1>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 px-4 py-4 space-y-3.5">
        {/* Connection Status Card */}
        <div className={`p-4 rounded-xl border shadow-2xs ${
          isDbConnected
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-red-50/80 border-red-200 text-red-950'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDbConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm">
                    {isDbConnected ? 'Database Connected' : 'Database Not Connected'}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isDbConnected ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                  }`}>
                    {isDbConnected ? 'Live Auto' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isDbConnected
                    ? `${sheetTitle || 'Google Sheet'} (${allSamples.length} total loaded)`
                    : 'Auto-connection failed or requires Google account authorization.'}
                </p>
              </div>
            </div>
          </div>

          {lastSyncTime && isDbConnected && (
            <p className="text-[11px] text-emerald-800 mt-2.5 pt-2 border-t border-emerald-200/60 font-medium">
              Last auto-synced: {lastSyncTime}
            </p>
          )}

          {dbError && !isDbConnected && (
            <div className="mt-2.5 pt-2 border-t border-red-200/60 text-[11px] text-red-800 flex items-start space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-mono break-all">{dbError}</span>
            </div>
          )}
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auto Connect Button */}
        {!isDbConnected ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="font-bold text-xs text-slate-900">Authorize Google Sheets Connection</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your Google Account to authorize auto-loading your production sheets without manual uploads.
            </p>
            <button
              onClick={connectGoogleSheets}
              disabled={isConnectingDb}
              className="w-full bg-[#8C1D35] hover:bg-[#78162b] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isConnectingDb ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting to Google Sheets...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-white" />
                  <span>Connect Google Sheets Database</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900">Active Database Controls</h4>
              <button
                onClick={disconnectDatabase}
                className="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer"
              >
                Disconnect
              </button>
            </div>
            <button
              onClick={() => handleSaveAndSync()}
              disabled={isConnectingDb}
              className="w-full bg-[#8C1D35] hover:bg-[#78162b] text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-2 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnectingDb ? 'animate-spin' : ''}`} />
              <span>Refresh & Sync Database Now</span>
            </button>
          </div>
        )}
        <div className="bg-[#fcf0f2] p-4 rounded-xl border border-[#f3ccd3] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-[#8C1D35]" />
              <h4 className="font-bold text-xs text-[#8C1D35]">Create New Google Sheet & Save Data</h4>
            </div>
            <span className="text-[10px] font-bold bg-[#8C1D35] text-white px-2 py-0.5 rounded uppercase">
              Auto Create
            </span>
          </div>

          <p className="text-[11px] text-slate-700 leading-normal">
            Click the button below to automatically create a brand new Google Spreadsheet in your Google Drive and save all {allSamples.length} production sample records into it. It will also link the new sheet as your live database.
          </p>

          <button
            onClick={async () => {
              setSuccessMsg('');
              try {
                const res = await createNewSheetAndSaveData();
                setInputSheetId(res.spreadsheetId);
                setSuccessMsg(`Google Sheet created successfully! Saved ${res.rowCount} rows.`);
              } catch (err: any) {
                // Handled
              }
            }}
            disabled={isConnectingDb}
            className="w-full bg-[#8C1D35] hover:bg-[#78162b] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            {isConnectingDb ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Creating Sheet in Google Drive...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Create New Sheet & Save Data</span>
              </>
            )}
          </button>
        </div>

        {/* Google Sheet ID or URL Configuration */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900">Spreadsheet ID or URL</h4>
            <span className="text-[10px] font-semibold text-slate-500">Auto-Loaded</span>
          </div>

          <p className="text-[11px] text-slate-600 leading-normal">
            Paste your Google Sheet link or Spreadsheet ID below. The app will automatically connect and load data from it every time you open the app.
          </p>

          <input
            type="text"
            value={inputSheetId}
            onChange={(e) => setInputSheetId(e.target.value)}
            placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or URL"
            className="w-full bg-[#f8f9ff] border border-slate-300 text-slate-900 text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#8C1D35] focus:border-[#8C1D35]"
          />

          <button
            onClick={handleSaveAndSync}
            disabled={isConnectingDb || !inputSheetId.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Apply Sheet ID & Auto-Load
          </button>
        </div>

        {/* Information box */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Automatic Sync Protection</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-normal">
            Whenever you open the app, it automatically attempts to connect to your configured Google Sheet and pull the latest records. If the connection cannot be established, the app immediately displays the "Database not connected" popup.
          </p>
        </div>
      </div>
    </div>
  );
};
