import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Sample, ProductItem, StageName, StageState, AuditLogEvent, SampleStatus } from '../types/production';
import { INITIAL_SAMPLES, INITIAL_AUDIT_LOGS } from '../data/mockInitialData';
import { cleanProductType } from '../utils/formatters';
import { initAuth, googleSignIn, getAccessToken, logout, setCachedAccessToken } from '../services/authService';
import { fetchSheetData, extractSpreadsheetId, createAndPopulateGoogleSheet } from '../services/googleSheetsService';
import { DatabaseDisconnectedModal } from '../components/DatabaseDisconnectedModal';

export type ActiveTab = 'home' | 'update' | 'report' | 'more' | 'details' | 'excel' | 'sheets';

interface ProductionContextType {
  samples: Sample[];
  allSamples: Sample[];
  auditLogs: AuditLogEvent[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedSample: Sample | null;
  setSelectedSample: (sample: Sample | null) => void;
  selectedProduct: ProductItem | null;
  setSelectedProduct: (product: ProductItem | null) => void;
  targetStage: StageName;
  setTargetStage: (stage: StageName) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  selectedProductType: string;
  setSelectedProductType: (type: string) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;

  // Google Sheets Auto Connection State
  isDbConnected: boolean;
  isConnectingDb: boolean;
  dbError: string | null;
  sheetId: string;
  setSheetId: (id: string) => void;
  sheetTitle: string;
  lastSyncTime: string | null;
  isDbModalOpen: boolean;
  setIsDbModalOpen: (open: boolean) => void;
  connectGoogleSheets: () => Promise<void>;
  disconnectDatabase: () => Promise<void>;
  loadFromGoogleSheet: (spreadsheetIdToUse?: string) => Promise<void>;
  createNewSheetAndSaveData: (sheetName?: string) => Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }>;

  // Actions
  updateProductStage: (params: {
    sampleId: string;
    productUniqueId: string;
    stage: StageName;
    status: StageState;
    startDate?: string;
    completedDate?: string;
    remarks?: string;
  }) => void;

  openSampleDetails: (sample: Sample) => void;
  openUpdateStage: (sample: Sample, product?: ProductItem, stage?: StageName) => void;
  importExcelData: (newSamples: Sample[], fileName?: string) => void;
  resetToDemo: () => void;
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

const SAMPLES_STORAGE_KEY = 'SMPL_PROD_TRACKER_SAMPLES_REAL_V1';
const LOGS_STORAGE_KEY = 'SMPL_PROD_TRACKER_LOGS_REAL_V1';
const SHEET_ID_STORAGE_KEY = 'SMPL_GOOGLE_SHEET_ID_V1';
const DEFAULT_SHEET_ID = '';

export const ProductionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allSamples, setAllSamples] = useState<Sample[]>(() => {
    ['V2', 'V3', 'V4', 'V5', 'V6', 'V7'].forEach((ver) => {
      localStorage.removeItem(`SMPL_PROD_TRACKER_SAMPLES_${ver}`);
      localStorage.removeItem(`SMPL_PROD_TRACKER_LOGS_${ver}`);
    });

    const saved = localStorage.getItem(SAMPLES_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Sample[] = JSON.parse(saved);
        return parsed.map((s) => ({
          ...s,
          products: s.products.map((p) => ({
            ...p,
            productType: cleanProductType(p.productType),
          })),
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SAMPLES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(() => {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedProductType, setSelectedProductType] = useState<string>('POLYBAGS');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [targetStage, setTargetStage] = useState<StageName>('Extrusion');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Google Sheets Auto-Connection States
  const [sheetId, setSheetIdState] = useState<string>(() => {
    return localStorage.getItem(SHEET_ID_STORAGE_KEY) || DEFAULT_SHEET_ID;
  });
  const [sheetTitle, setSheetTitle] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isConnectingDb, setIsConnectingDb] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);

  const setSheetId = (id: string) => {
    const extracted = extractSpreadsheetId(id);
    setSheetIdState(extracted);
    localStorage.setItem(SHEET_ID_STORAGE_KEY, extracted);
  };

  // Filter active samples by selectedProductType (default 'POLYBAGS')
  const samples: Sample[] = useMemo(() => {
    if (!selectedProductType || selectedProductType === 'ALL') {
      return allSamples;
    }
    return allSamples
      .map((s) => ({
        ...s,
        products: s.products.filter(
          (p) => (p.productCategory || p.productType || '').toUpperCase() === selectedProductType.toUpperCase()
        ),
      }))
      .filter((s) => s.products.length > 0);
  }, [allSamples, selectedProductType]);

  useEffect(() => {
    localStorage.setItem(SAMPLES_STORAGE_KEY, JSON.stringify(allSamples));
  }, [allSamples]);

  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const importExcelData = useCallback((newSamples: Sample[], fileName?: string) => {
    if (!newSamples) return;

    const nowStr = new Date()
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-');

    setAllSamples((prev) => {
      const existingById = new Map<string, Sample>();
      prev.forEach((s) => existingById.set(s.id, s));

      const merged = newSamples.map((incoming) => {
        const existing = existingById.get(incoming.id);
        if (!existing) return incoming;

        const existingProdMap = new Map<string, ProductItem>();
        existing.products.forEach((p) => existingProdMap.set(p.uniqueId, p));

        const mergedProducts = incoming.products.map((incProd) => {
          const prevProd = existingProdMap.get(incProd.uniqueId);
          if (prevProd) {
            return {
              ...incProd,
              currentStage: prevProd.currentStage,
              stages: prevProd.stages,
            };
          }
          return incProd;
        });

        return {
          ...incoming,
          status: existing.status,
          products: mergedProducts,
        };
      });

      if (merged.length > 0) {
        setSelectedSample(merged[0]);
        setSelectedProduct(merged[0].products[0] || null);

        const importLog: AuditLogEvent = {
          id: `LOG-IMP-${Date.now().toString().slice(-5)}`,
          sampleId: merged[0].id,
          productUniqueId: merged[0].products[0]?.uniqueId,
          stageTag: 'Creation',
          title: `Data Synced via Database (${merged.length} Records)`,
          timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: nowStr,
          updatedBy: 'Auto Database Sync',
          fileName: fileName || 'Google Sheets Database',
        };
        setAuditLogs((prevLogs) => [importLog, ...prevLogs]);
      }

      return merged;
    });
  }, []);

  // Core function to load data from Google Sheet
  const loadFromGoogleSheet = useCallback(async (spreadsheetIdToUse?: string) => {
    const targetId = spreadsheetIdToUse || sheetId;
    if (!targetId) {
      setIsDbConnected(false);
      setDbError('Spreadsheet ID is not configured.');
      setIsDbModalOpen(true);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setIsDbConnected(false);
      setDbError('Google Sheets Authorization required. Please sign in to connect database.');
      setIsDbModalOpen(true);
      return;
    }

    setIsConnectingDb(true);
    setDbError(null);
    try {
      const result = await fetchSheetData(targetId, undefined, token);
      setSheetTitle(result.spreadsheetTitle || 'Production Pending Sheet');
      setIsDbConnected(true);
      setIsDbModalOpen(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Automatically populate app with sample data from Google Sheet
      importExcelData(result.samples, result.spreadsheetTitle || 'Google Sheets Database');
    } catch (err: any) {
      console.error('Google Sheet load error:', err);
      setIsDbConnected(false);
      setDbError(err.message || 'Failed to connect to Google Sheets database.');
      setIsDbModalOpen(true);
      throw err;
    } finally {
      setIsConnectingDb(false);
    }
  }, [sheetId, importExcelData]);

  // Connect Google Sheets flow
  const connectGoogleSheets = async () => {
    setIsConnectingDb(true);
    setDbError(null);
    try {
      const authResult = await googleSignIn();
      if (!authResult?.accessToken) {
        throw new Error('Google sign-in completed without an access token.');
      }
      setCachedAccessToken(authResult.accessToken);
      setIsDbConnected(true);

      // Attempt loading if sheetId is present
      if (sheetId) {
        await loadFromGoogleSheet(sheetId);
      } else {
        setIsDbModalOpen(false);
        setActiveTab('sheets');
      }
    } catch (err: any) {
      console.error('Connect error:', err);
      setIsDbConnected(false);
      setDbError(err.message || 'Database connection authorization failed.');
      setIsDbModalOpen(true);
    } finally {
      setIsConnectingDb(false);
    }
  };

  // Create a brand new Google Spreadsheet in Google Drive and auto-save active sample data
  const createNewSheetAndSaveData = async (sheetTitleParam?: string) => {
    let token = getAccessToken();
    if (!token) {
      const authResult = await googleSignIn();
      if (!authResult?.accessToken) {
        throw new Error('Google sign-in required to create sheet.');
      }
      token = authResult.accessToken;
      setCachedAccessToken(token);
      setIsDbConnected(true);
    }

    setIsConnectingDb(true);
    setDbError(null);
    try {
      const title = sheetTitleParam || `MPBL Production Tracker (${new Date().toLocaleDateString('en-GB')})`;
      const result = await createAndPopulateGoogleSheet(title, allSamples, token);

      // Set the newly created sheet as the active connected sheet
      setSheetId(result.spreadsheetId);
      setSheetTitle(title);
      setIsDbConnected(true);
      setIsDbModalOpen(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Add to audit logs
      const nowStr = new Date()
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/ /g, '-');
      const createLog: AuditLogEvent = {
        id: `LOG-CRT-${Date.now().toString().slice(-5)}`,
        sampleId: allSamples[0]?.id || 'DATABASE',
        stageTag: 'Creation',
        title: `Created New Google Sheet (${result.rowCount} records)`,
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: nowStr,
        updatedBy: 'sofiquldata@gmail.com',
        fileName: title,
      };
      setAuditLogs((prev) => [createLog, ...prev]);

      return result;
    } catch (err: any) {
      console.error('Failed to create new Google Sheet:', err);
      setDbError(err.message || 'Failed to create Google Sheet database.');
      throw err;
    } finally {
      setIsConnectingDb(false);
    }
  };

  const disconnectDatabase = async () => {
    await logout();
    setIsDbConnected(false);
    setDbError(null);
    setSheetTitle('');
    setLastSyncTime(null);
  };

  // Auto-connect on app open
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setCachedAccessToken(token);
        // Automatically attempt to load data on app startup
        const targetSheetId = localStorage.getItem(SHEET_ID_STORAGE_KEY) || sheetId;
        if (targetSheetId) {
          try {
            await loadFromGoogleSheet(targetSheetId);
          } catch (e) {
            // Error modal triggered in loadFromGoogleSheet
          }
        } else {
          setIsDbConnected(false);
          setDbError('No Google Spreadsheet ID linked yet.');
          setIsDbModalOpen(true);
        }
      },
      () => {
        // User not authenticated or token absent: pop up "Database not connected" modal
        setIsDbConnected(false);
        setDbError('Live Database Not Connected. Please connect your Google account.');
        setIsDbModalOpen(true);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadFromGoogleSheet, sheetId]);

  const openSampleDetails = (sample: Sample) => {
    setSelectedSample(sample);
    if (sample.products.length > 0) {
      setSelectedProduct(sample.products[0]);
    }
    setActiveTab('details');
  };

  const openUpdateStage = (sample: Sample, product?: ProductItem, stage?: StageName) => {
    setSelectedSample(sample);
    const prod = product || sample.products[0];
    setSelectedProduct(prod || null);
    if (stage) {
      setTargetStage(stage);
    } else if (prod) {
      setTargetStage(prod.currentStage);
    }
    setActiveTab('update');
  };

  const updateProductStage = ({
    sampleId,
    productUniqueId,
    stage,
    status,
    startDate = '06-Nov-2026',
    completedDate = '',
    remarks = '',
  }: {
    sampleId: string;
    productUniqueId: string;
    stage: StageName;
    status: StageState;
    startDate?: string;
    completedDate?: string;
    remarks?: string;
  }) => {
    const isCompletedStatus = status === 'Completed' || status === 'Done';
    const effectiveState: StageState = isCompletedStatus ? 'Done' : status;
    const nowStr = new Date()
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-');

    setAllSamples((prevSamples) => {
      let updatedSampleObj: Sample | null = null;
      let updatedProductObj: ProductItem | null = null;

      const newSamples = prevSamples.map((sample) => {
        if (sample.id !== sampleId) return sample;

        const updatedProducts = sample.products.map((prod) => {
          if (prod.uniqueId !== productUniqueId) return prod;

          const currentStageDetail = prod.stages[stage] || { state: 'Pending' };

          const updatedStageDetail = {
            ...currentStageDetail,
            state: effectiveState,
            startDate: startDate || currentStageDetail.startDate || nowStr,
            completedDate: isCompletedStatus
              ? completedDate || currentStageDetail.completedDate || nowStr
              : completedDate || currentStageDetail.completedDate,
            remarks: remarks || currentStageDetail.remarks,
          };

          const stagesOrder: StageName[] = ['Extrusion', 'Printing', 'Bag Making', 'Dispatch'];
          const currentIndex = stagesOrder.indexOf(stage);
          let newCurrentStage = prod.currentStage;

          if (isCompletedStatus && currentIndex >= 0 && currentIndex < stagesOrder.length - 1) {
            newCurrentStage = stagesOrder[currentIndex + 1];
          }

          const updatedProd: ProductItem = {
            ...prod,
            currentStage: newCurrentStage,
            stages: {
              ...prod.stages,
              [stage]: updatedStageDetail,
            },
          };

          if (prod.uniqueId === productUniqueId) {
            updatedProductObj = updatedProd;
          }

          return updatedProd;
        });

        const allCompleted = updatedProducts.every((p) =>
          Object.values(p.stages).every(
            (s) => s.state === 'Done' || s.state === 'Completed' || s.state === 'Not Required'
          )
        );

        const newSampleStatus: SampleStatus = allCompleted ? 'Completed' : 'In Production';

        const updatedSample: Sample = {
          ...sample,
          status: newSampleStatus,
          products: updatedProducts,
        };

        if (sample.id === sampleId) {
          updatedSampleObj = updatedSample;
        }

        return updatedSample;
      });

      if (updatedSampleObj) {
        setSelectedSample(updatedSampleObj);
        if (updatedProductObj) {
          setSelectedProduct(updatedProductObj);
        }
      }

      return newSamples;
    });

    const newLog: AuditLogEvent = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      sampleId,
      productUniqueId,
      stageTag: stage,
      title: `Status Changed to ${status}`,
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: nowStr,
      updatedBy: 'Production Supervisor',
      remarks: remarks || `${stage} stage set to ${status}.`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const resetToDemo = () => {
    setAllSamples([]);
    setAuditLogs([]);
    setSelectedSample(null);
    setSelectedProduct(null);
    localStorage.removeItem(SAMPLES_STORAGE_KEY);
    localStorage.removeItem(LOGS_STORAGE_KEY);
  };

  return (
    <ProductionContext.Provider
      value={{
        samples,
        allSamples,
        auditLogs,
        activeTab,
        setActiveTab,
        selectedSample,
        setSelectedSample,
        selectedProduct,
        setSelectedProduct,
        targetStage,
        setTargetStage,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        selectedProductType,
        setSelectedProductType,
        isMenuOpen,
        setIsMenuOpen,
        isDbConnected,
        isConnectingDb,
        dbError,
        sheetId,
        setSheetId,
        sheetTitle,
        lastSyncTime,
        isDbModalOpen,
        setIsDbModalOpen,
        connectGoogleSheets,
        disconnectDatabase,
        loadFromGoogleSheet,
        createNewSheetAndSaveData,
        updateProductStage,
        openSampleDetails,
        openUpdateStage,
        importExcelData,
        resetToDemo,
      }}
    >
      {children}
      {/* Global Auto-Connect Disconnected Alert Popup */}
      <DatabaseDisconnectedModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onConnect={connectGoogleSheets}
        errorMessage={dbError || undefined}
        isConnecting={isConnectingDb}
      />
    </ProductionContext.Provider>
  );
};

export const useProduction = () => {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
};
