import React, { useState, useMemo } from 'react';
import { ArrowLeft, Bell, FileSpreadsheet, Edit3, CheckCircle, BarChart2, Upload, RefreshCw, ChevronDown } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';
import { parsePendingReportExcel, ExcelParseResult } from '../utils/excelParser';
import { Sample } from '../types/production';

export const ExcelUploadScreen: React.FC = () => {
  const {
    allSamples,
    selectedProductType,
    setSelectedProductType,
    setActiveTab,
    importExcelData,
  } = useProduction();

  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<ExcelParseResult | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeKb = file.size / 1024;
      setFileSize(
        sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(sizeKb))} KB`
      );
      setIsParsing(true);
      try {
        const res = await parsePendingReportExcel(file);
        setParsedResult(res);
        // Default to POLYBAGS if present in the uploaded Product Type column
        const polybagMatch = res.productTypes.find((t) => /POLYBAG/i.test(t));
        if (polybagMatch) {
          setSelectedProductType(polybagMatch);
        } else {
          setSelectedProductType('POLYBAGS');
        }
        setIsSuccess(true);
      } catch (err) {
        console.error('Excel parse error:', err);
        setIsSuccess(false);
      } finally {
        setIsParsing(false);
      }
    }
  };

  // Base samples from the newly uploaded Excel file or existing uploaded samples
  const baseSamples: Sample[] = useMemo(() => {
    if (parsedResult?.samples) {
      return parsedResult.samples;
    }
    return allSamples;
  }, [parsedResult, allSamples]);

  // Pull unique Product Type options strictly from Column X ("Product Type": LABEL, PAPER, POLYBAGS)
  const productTypeOptions: string[] = useMemo(() => {
    if (parsedResult?.productTypes?.length) {
      return parsedResult.productTypes;
    }
    const categories = new Set<string>();
    baseSamples.forEach((s) => {
      s.products.forEach((p) => {
        if (p.productCategory) categories.add(p.productCategory.toUpperCase());
      });
    });
    return categories.size > 0 ? Array.from(categories).sort() : ['LABEL', 'PAPER', 'POLYBAGS'];
  }, [parsedResult, baseSamples]);

  // Filter samples strictly by selected Product Type (default: POLYBAGS)
  const filteredSamplesToImport: Sample[] = useMemo(() => {
    if (!selectedProductType || selectedProductType === 'ALL') {
      return baseSamples;
    }
    return baseSamples
      .map((s) => ({
        ...s,
        products: s.products.filter(
          (p) => (p.productCategory || '').toUpperCase() === selectedProductType.toUpperCase()
        ),
      }))
      .filter((s) => s.products.length > 0);
  }, [baseSamples, selectedProductType]);

  // Dynamic real-time calculation for Import Summary Preview metrics
  const { totalExcelCount, totalSmplCount, newItemsCount, existingUpdatedCount, missingCount } =
    useMemo(() => {
      const totalExcel = parsedResult ? parsedResult.totalExcelRecords : baseSamples.length;
      const totalSmpl = filteredSamplesToImport.length;

      if (!parsedResult && allSamples.length === 0) {
        return {
          totalExcelCount: 0,
          totalSmplCount: 0,
          newItemsCount: 0,
          existingUpdatedCount: 0,
          missingCount: 0,
        };
      }

      const existingIds = new Set(allSamples.map((s) => s.id));
      const incomingIds = new Set(filteredSamplesToImport.map((s) => s.id));

      let newCount = 0;
      let updatedCount = 0;
      filteredSamplesToImport.forEach((s) => {
        if (existingIds.has(s.id)) {
          updatedCount++;
        } else {
          newCount++;
        }
      });

      let missing = 0;
      allSamples.forEach((s) => {
        if (!incomingIds.has(s.id)) {
          missing++;
        }
      });

      return {
        totalExcelCount: totalExcel,
        totalSmplCount: totalSmpl,
        newItemsCount: newCount,
        existingUpdatedCount: updatedCount,
        missingCount: missing,
      };
    }, [parsedResult, baseSamples, filteredSamplesToImport, allSamples]);

  const handleConfirmImport = () => {
    if (filteredSamplesToImport.length === 0) return;
    importExcelData(filteredSamplesToImport, fileName || 'Production Pending Report.xlsx');
    setActiveTab('home');
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
          <h1 className="text-base font-bold tracking-tight text-white">
            Excel Upload (Pending Report)
          </h1>
        </div>
        <button className="p-1 rounded-full hover:bg-black/15 text-white cursor-pointer">
          <Bell className="w-5 h-5" />
        </button>
      </section>

      {/* Main Scrollable Area */}
      <div className="flex-1 px-4 pt-3 pb-6 space-y-3 overflow-y-auto">
        {/* Upload / Selected File Card */}
        <section className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
          <label className="flex items-start justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center border border-[#CBD5E1]">
                <FileSpreadsheet className="w-6 h-6 text-[#8C1D35]" />
              </div>
              <div>
                <p
                  className="text-sm font-bold text-slate-900 truncate max-w-[210px]"
                  title={fileName || 'Click to upload Excel Pending Report'}
                >
                  {fileName || 'Select Excel File (.xlsx / .csv)'}
                </p>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-[#475569]">
                  <span>{fileSize || 'Tap to browse file'}</span>
                  <span className="text-[#94A3B8]">•</span>
                  <span>XLSX / CSV Sheet</span>
                </div>
              </div>
            </div>

            <div className="text-[#8C1D35] p-1 hover:bg-[#F1F5F9] rounded relative">
              <Edit3 className="w-5 h-5" />
            </div>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Success Validation Badge */}
          {isSuccess && (
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg px-2.5 py-1.5 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
              <span className="text-[11px] font-semibold text-[#065F46]">
                File schema parsed & validated successfully
              </span>
            </div>
          )}
        </section>

        {/* Product Type Dropdown (Pulled strictly from Column X "Product Type": LABEL, PAPER, POLYBAGS) */}
        <section className="bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="product-type-select"
              className="text-xs font-bold text-slate-800 whitespace-nowrap"
            >
              Product Type
            </label>
            <div className="relative flex-1 max-w-[240px]">
              <select
                id="product-type-select"
                value={selectedProductType}
                onChange={(e) => setSelectedProductType(e.target.value)}
                className="w-full appearance-none bg-[#f8f9ff] border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#8C1D35] focus:border-[#8C1D35] cursor-pointer"
              >
                <option value="ALL">(Select All) — {productTypeOptions.length} Items</option>
                {productTypeOptions.map((typeName) => (
                  <option key={typeName} value={typeName}>
                    {typeName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Import Summary Preview Card (ERP Metric Grid) */}
        <section className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-[#8C1D35]" />
              <h2 className="text-xs font-bold text-slate-900">Import Summary Preview</h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#006398]">
              {selectedProductType === 'ALL' ? 'All Types' : selectedProductType}
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Total Excel Records */}
            <div className="bg-[#f8f9ff] rounded-lg p-2.5 border border-[#E2E8F0]">
              <p className="text-[11px] text-[#475569]">Total Excel Records</p>
              <p className="font-mono text-lg font-bold text-slate-900 mt-0.5">
                {isParsing ? '...' : totalExcelCount.toLocaleString()}
              </p>
            </div>

            {/* Total SMPL Records */}
            <div className="bg-[#f8f9ff] rounded-lg p-2.5 border border-[#E2E8F0]">
              <p className="text-[11px] text-[#475569]">Total SMPL Records</p>
              <p className="font-mono text-lg font-bold text-[#006398] mt-0.5">
                {isParsing ? '...' : totalSmplCount.toLocaleString()}
              </p>
            </div>

            {/* New Sample Products (Highlighted) */}
            <div className="bg-[#EFF6FF] rounded-lg p-2.5 border border-[#BFDBFE] relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#1E40AF]">New Sample Items</p>
                <span className="bg-[#2563EB] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  NEW
                </span>
              </div>
              <p className="font-mono text-lg font-bold text-[#1D4ED8] mt-0.5">
                {isParsing ? '...' : `+${newItemsCount}`}
              </p>
            </div>

            {/* Existing Records (Updated) */}
            <div className="bg-[#F0FDF4] rounded-lg p-2.5 border border-[#BBF7D0]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#166534]">Existing Updated</p>
                <RefreshCw className="w-4 h-4 text-[#16A34A]" />
              </div>
              <p className="font-mono text-lg font-bold text-[#15803D] mt-0.5">
                {isParsing ? '...' : existingUpdatedCount}
              </p>
            </div>

            {/* Missing From Latest */}
            <div className="bg-[#FFFBEB] rounded-lg p-2.5 border border-[#FDE68A]">
              <p className="text-[11px] text-[#92400E]">Missing from Latest</p>
              <p className="font-mono text-lg font-bold text-[#B45309] mt-0.5">
                {isParsing ? '...' : missingCount}
              </p>
            </div>

            {/* Invalid / Duplicates */}
            <div className="bg-[#f8f9ff] rounded-lg p-2.5 border border-[#E2E8F0]">
              <p className="text-[11px] text-[#475569]">Invalid / Duplicates</p>
              <p className="font-mono text-lg font-bold text-[#059669] mt-0.5">0</p>
            </div>
          </div>
        </section>

        {/* Action Buttons Panel */}
        <section className="space-y-2 pt-1 pb-3">
          <button
            onClick={handleConfirmImport}
            disabled={isParsing || totalSmplCount === 0}
            className="w-full bg-[#8C1D35] text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-xs shadow-md hover:bg-[#78162b] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>Confirm Import ({totalSmplCount} SMPL Records)</span>
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className="w-full bg-white text-[#0F172A] border border-[#CBD5E1] py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 font-semibold text-xs hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#475569]" />
            <span>Cancel & Back to Home</span>
          </button>
        </section>
      </div>
    </div>
  );
};
