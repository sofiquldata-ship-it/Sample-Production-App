import React from 'react';
import { Home, RefreshCw, Upload, BarChart3, MoreHorizontal } from 'lucide-react';
import { useProduction } from '../context/ProductionContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useProduction();

  const isHomeActive = activeTab === 'home';
  const isUpdateActive = activeTab === 'update';
  const isExcelActive = activeTab === 'excel';
  const isReportActive = activeTab === 'report';
  const isMoreActive = activeTab === 'more' || activeTab === 'details';

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, isActive: isHomeActive },
    { id: 'update', label: 'Update', icon: RefreshCw, isActive: isUpdateActive },
    { id: 'report', label: 'Report', icon: BarChart3, isActive: isReportActive },
    { id: 'excel', label: 'Upload', icon: Upload, isActive: isExcelActive },
    { id: 'more', label: 'More', icon: MoreHorizontal, isActive: isMoreActive },
  ];

  return (
    <nav className="bg-[#8C1D35] border-t border-[#9f233f] py-2 px-2 flex justify-between items-center shrink-0 z-40 select-none shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all cursor-pointer ${
              item.isActive
                ? 'text-white bg-black/25 font-bold shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-black/10'
            }`}
          >
            <Icon className={`w-5 h-5 text-white ${item.isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] tracking-tight mt-0.5 text-white ${item.isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
