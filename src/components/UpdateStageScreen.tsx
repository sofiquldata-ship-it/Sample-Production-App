import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Check, Calendar, ChevronDown, Save } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';
import { StageName, StageState } from '../types/production';
import { cleanProductType } from '../utils/formatters';

// Helper component for interactive date selection
const DatePickerInput: React.FC<{
  id: string;
  label: string;
  value: string; // Displayed string format e.g. "06-Nov-2026" or "12-Nov-2026"
  onChange: (formattedVal: string) => void;
  placeholder?: string;
}> = ({ id, label, value, onChange, placeholder = 'Select date' }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert DD-Mon-YYYY to YYYY-MM-DD for native input
  const parseToIso = (str: string) => {
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    try {
      const parts = str.split('-');
      if (parts.length === 3) {
        const months: Record<string, string> = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1]] || '01';
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    } catch (e) {}
    return '';
  };

  // Convert YYYY-MM-DD to DD-Mon-YYYY
  const formatToDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const parts = isoStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDay = String(day).padStart(2, '0');
        const formattedMonth = monthNames[monthIdx] || 'Nov';
        return `${formattedDay}-${formattedMonth}-${year}`;
      }
    } catch (e) {}
    return isoStr;
  };

  const isoValue = parseToIso(value);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    if (isoVal) {
      const formatted = formatToDisplay(isoVal);
      onChange(formatted);
    } else {
      onChange('');
    }
  };

  const handleContainerClick = () => {
    if (inputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
        }
      } catch (e) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-bold text-gray-800" htmlFor={id}>
        {label}
      </label>
      <div
        onClick={handleContainerClick}
        className="relative flex items-center bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 shadow-2xs cursor-pointer hover:border-[#8C1D35] focus-within:ring-1 focus-within:ring-[#8C1D35] focus-within:border-[#8C1D35]"
      >
        <span className={`text-[13px] font-normal truncate select-none ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>

        {/* Hidden HTML5 Native Date Picker Overlay */}
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={isoValue}
          onChange={handleDateChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
        />

        <div className="absolute right-2.5 text-gray-500 pointer-events-none z-20">
          <Calendar className="w-4 h-4 stroke-[1.8]" />
        </div>
      </div>
    </div>
  );
};

const DEFAULT_STAGE_REMARKS: Record<StageName, string> = {
  Extrusion: 'Extrusion running, expected completion tomorrow.',
  Printing: 'Printing in progress, shade and artwork verified.',
  'Bag Making': 'Bag making in progress, seal testing verified.',
  Dispatch: 'Final QA completed, batch staged for dispatch.',
};

export const UpdateStageScreen: React.FC = () => {
  const {
    samples,
    selectedSample,
    selectedProduct,
    targetStage,
    setTargetStage,
    updateProductStage,
    setActiveTab,
  } = useProduction();

  const [status, setStatus] = useState<StageState>('In Progress');
  const [startDate, setStartDate] = useState<string>('06-Nov-2026');
  const [completedDate, setCompletedDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const sample = selectedSample || samples[0] || null;
  const product = selectedProduct || (sample?.products[0] || null);

  useEffect(() => {
    if (product && targetStage) {
      const stageInfo = product.stages[targetStage];
      const defaultRemark = DEFAULT_STAGE_REMARKS[targetStage] || `${targetStage} stage process in progress.`;
      
      if (stageInfo) {
        setStatus(stageInfo.state === 'Done' ? 'Completed' : stageInfo.state === 'In Progress' ? 'In Progress' : 'Pending');
        setStartDate(stageInfo.startDate || '06-Nov-2026');
        setCompletedDate(stageInfo.completedDate || '');
        setRemarks(stageInfo.remarks || defaultRemark);
      } else {
        setRemarks(defaultRemark);
      }
    }
  }, [product, targetStage]);

  if (!sample || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fc] p-6 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">No Sample Data Available</p>
        <p className="text-xs text-slate-500">Upload your Excel Pending Report first to update production stages.</p>
        <button
          onClick={() => setActiveTab('excel')}
          className="bg-[#8C1D35] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
        >
          Go to Excel Upload
        </button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateProductStage({
      sampleId: sample.id,
      productUniqueId: product.uniqueId,
      stage: targetStage,
      status: status,
      startDate,
      completedDate,
      remarks,
    });

    setActiveTab('details');
  };

  const stagesList: StageName[] = ['Extrusion', 'Printing', 'Bag Making', 'Dispatch'];

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fc] overflow-y-auto no-scrollbar">
      {/* App Bar Navigation */}
      <nav className="bg-[#8C1D35] text-white px-4 py-3 flex items-center shadow-md shrink-0">
        <button
          onClick={() => setActiveTab('details')}
          className="p-1 -ml-1 text-white hover:opacity-80 transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
        </button>
        <h1 className="text-[19px] font-semibold tracking-wide ml-3">Update Production Stage</h1>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* Sample Information Summary Card */}
        <section className="bg-white rounded-xl p-3.5 shadow-2xs border border-blue-100 flex items-start space-x-3.5">
          <div className="shrink-0 w-11 h-12 rounded-lg bg-pink-50/70 border border-pink-100 flex items-center justify-center text-[#8C1D35]">
            <FileText className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">
                {sample.id}
              </h2>
              {product.productType && (
                <span className="text-[10px] font-semibold text-[#006398] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  {cleanProductType(product.productType)}
                </span>
              )}
            </div>
            <p className="text-[13px] font-medium text-gray-600 mt-1 truncate">{product.name}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              UniqueId: {product.uniqueId}
            </p>
          </div>
        </section>

        {/* Production Stage Selector */}
        <section className="space-y-2 pt-1">
          <label className="block text-[15px] font-bold text-gray-900">Production Stage</label>
          <div className="grid grid-cols-4 gap-2">
            {stagesList.map((stg) => {
              const isSelected = targetStage === stg;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setTargetStage(stg)}
                  className={`flex items-center justify-center py-2.5 px-1 rounded-lg font-semibold text-[13px] cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#fdf5f6] border-[1.5px] border-[#8C1D35] text-[#8C1D35] shadow-2xs space-x-1.5'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#8C1D35]" />}
                  <span className={stg === 'Bag Making' ? 'text-[12px] leading-tight text-center' : ''}>
                    {stg === 'Bag Making' ? <>Bag<br />Making</> : stg}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Status Form Group */}
        <section className="space-y-1.5">
          <label className="block text-[14px] font-bold text-gray-900" htmlFor="status-dropdown">
            Status <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="status-dropdown"
              value={status}
              onChange={(e) => setStatus(e.target.value as StageState)}
              className="w-full bg-white border border-gray-300 text-gray-800 text-[14px] rounded-lg py-2.5 px-3 appearance-none pr-10 focus:border-[#8C1D35] focus:ring-1 focus:ring-[#8C1D35]"
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="On Hold">On Hold</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-600">
              <ChevronDown className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
        </section>

        {/* Interactive Date Row (Start Date & Completed Date) */}
        <section className="grid grid-cols-2 gap-3.5">
          <DatePickerInput
            id="start-date-input"
            label="Start Date"
            value={startDate}
            onChange={(newVal) => setStartDate(newVal)}
            placeholder="Select date"
          />

          <DatePickerInput
            id="completed-date-input"
            label="Completed Date"
            value={completedDate}
            onChange={(newVal) => setCompletedDate(newVal)}
            placeholder="Select date"
          />
        </section>

        {/* Remarks Field */}
        <section className="space-y-1.5 pt-1">
          <label className="block text-[14px] font-bold text-gray-800" htmlFor="remarks-input">
            Remarks
          </label>
          <div className="space-y-1">
            <textarea
              id="remarks-input"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={200}
              className="w-full bg-white border border-gray-300 text-gray-800 text-[13px] rounded-lg p-3 resize-none leading-relaxed shadow-2xs focus:ring-[#8C1D35]"
            />
            <div className="text-right text-[12px] font-medium text-gray-500 pr-0.5">
              {remarks.length} / 200
            </div>
          </div>
        </section>
      </main>

      {/* Footer Save Button */}
      <footer className="p-4 bg-transparent mt-auto pb-6 shrink-0">
        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-[#8C1D35] hover:bg-[#78162b] active:scale-[0.99] text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2.5 font-medium text-[15px] shadow-sm transition-all cursor-pointer"
        >
          <Save className="w-5 h-5 stroke-[2]" />
          <span className="tracking-wide">Save Update</span>
        </button>
      </footer>
    </div>
  );
};
