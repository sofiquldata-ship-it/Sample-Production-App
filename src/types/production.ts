export type SampleStatus = 'In Production' | 'Completed' | 'Overdue' | 'Pending' | 'On Hold';

export type StageName = 'Extrusion' | 'Printing' | 'Bag Making' | 'Dispatch';

export type StageState = 'Done' | 'Completed' | 'In Progress' | 'Pending' | 'Not Required' | 'On Hold';

export interface StageDetail {
  state: StageState;
  durationDays?: number;
  startDate?: string;
  completedDate?: string;
  remarks?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  uniqueId: string;
  productType?: string; // Column Y: "Item group" (e.g. 'BANDEROLE')
  productCategory?: string; // Column X: "Product Type" ('LABEL' | 'PAPER' | 'POLYBAGS')
  currentStage: StageName;
  stages: {
    Extrusion: StageDetail;
    Printing: StageDetail;
    'Bag Making': StageDetail;
    Dispatch: StageDetail;
  };
}

export interface Sample {
  id: string; // e.g. SMPL/00849/2026
  buyer: string; // e.g. FLAXEN DRESS MAKER LIMITED / Customer
  retailer?: string; // e.g. CHICCO, UNDER ARMOUR, HELLY HANSEN (Column D "Retailer")
  requestDate: string; // e.g. 18-Jan-2026
  status: SampleStatus;
  products: ProductItem[];
}

export interface AuditLogEvent {
  id: string;
  sampleId: string;
  productUniqueId?: string;
  stageTag: string; // e.g. Extrusion, Routing Plan, Creation
  title: string; // e.g. Status Changed to In Progress
  timeStr: string; // 09:15 AM
  date: string; // 06-Nov-2026
  updatedBy: string; // Karim Ullah (Extrusion Supervisor)
  remarks?: string;
  sequenceChain?: string[];
  fileName?: string;
}
