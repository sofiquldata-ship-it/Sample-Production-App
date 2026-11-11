import React from 'react';
import { ProductionProvider, useProduction } from './context/ProductionContext';
import { HomeScreen } from './components/HomeScreen';
import { SampleDetailsScreen } from './components/SampleDetailsScreen';
import { UpdateStageScreen } from './components/UpdateStageScreen';
import { ReportScreen } from './components/ReportScreen';
import { AuditLogScreen } from './components/AuditLogScreen';
import { ExcelUploadScreen } from './components/ExcelUploadScreen';
import { GoogleSheetConnectScreen } from './components/GoogleSheetConnectScreen';
import { BottomNav } from './components/BottomNav';
import { SideMenuDrawer } from './components/SideMenuDrawer';

const MobileDeviceShell: React.FC = () => {
  const { activeTab } = useProduction();

  return (
    <div className="w-full h-screen h-[100dvh] bg-[#090d16] flex justify-center items-center p-0 sm:p-3 font-sans antialiased text-slate-800 overflow-hidden">
      {/* Mobile Device Container Frame */}
      <div className="w-full max-w-[430px] h-full max-h-[100dvh] sm:max-h-[94vh] bg-[#f8f9fc] rounded-none sm:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative border-0 sm:border-[6px] sm:border-[#1e293b]">
        {/* Dynamic Screen View */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'details' && <SampleDetailsScreen />}
          {activeTab === 'update' && <UpdateStageScreen />}
          {activeTab === 'report' && <ReportScreen />}
          {activeTab === 'more' && <AuditLogScreen />}
          {activeTab === 'excel' && <ExcelUploadScreen />}
          {activeTab === 'sheets' && <GoogleSheetConnectScreen />}
        </div>

        {/* Shared Bottom Navigation Bar */}
        <BottomNav />

        {/* Slide Menu Drawer */}
        <SideMenuDrawer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ProductionProvider>
      <MobileDeviceShell />
    </ProductionProvider>
  );
}
