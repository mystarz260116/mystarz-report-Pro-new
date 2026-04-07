
export enum Department {
  OSAKA_MODEL = '大阪模型',
  PATTERN = 'パターン',
  INVEST_CUT = '埋没・カット計量',
  METAL_1 = 'メタル①',
  METAL_2 = 'メタル②',
  METAL_3 = 'メタル③',
  COMPLETE_A = '完成A',
  COMPLETE_B = '完成B',
  COMPLETE_C = '完成C',
  CAD_CAM = 'CAD/CAM',
  CAD_CAM_1 = 'CAD/CAM①',
  CAD_CAM_2 = 'CAD/CAM②（設計）',
  CAD_CAM_3 = 'CAD/CAM③（完成）',
  DENTURE = 'デンチャー',
}

export interface ProductionItem {
  id: string;
  name: string;
  category?: string;
  hasTimeTracking?: boolean;
}

export interface DailyReportItem {
  itemId: string;
  itemName: string;
  count: number; // 総数（互換性のため保持）
  countInsured?: number; // 保険数
  countInsuredCompleted?: number; // うち完成数(保険)
  countSelf?: number; // 自費数
  countSelfCompleted?: number; // うち完成数(自費)
  timeMinutes?: number;
  customTimeRange?: string;
}

export interface ModelTimeEntry {
  staffName: string;
  modelEndTime: string;
  finalEndTime: string;
}

export interface DailyReport {
  id: string;
  date: string;
  department: Department;
  staffName: string;
  supervisorName?: string;
  startTime: string;
  endTime: string;
  workStartTime?: string;
  workEndTime?: string;
  totalBreakTimeMinutes: number;
  items: DailyReportItem[];
  modelTimeEntries?: ModelTimeEntry[];
  remarks: string;
  issues?: string;
  createdAt: number;
}

export interface DeptConfig {
  id: Department;
  label: string;
  color: string;
  sections: {
    title: string;
    items: string[];
  }[];
  computedRows?: { afterItem: string; name: string; sumItems: string[] }[];
}
