import { DailyReport, Department } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

const STORAGE_KEY = 'dental_lab_reports';

/**
 * 日付文字列を YYYY-MM-DD 形式に標準化します
 */
export const standardizeDate = (d: any): string => {
  if (!d) return '';
  const str = String(d).trim();

  if (str.includes('T')) {
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }

  const datePart = str.split(/[T ]/)[0].replace(/\//g, '-');
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return datePart;
};

export const getReports = (): DailyReport[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveReport = async (report: DailyReport): Promise<boolean> => {
  try {
    const existing = getReports();
    const filtered = existing.filter(r => r.id !== report.id);
    const updated = [report, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return await saveReportToGoogleSheets(report);
  } catch (error) {
    console.error('保存処理エラー:', error);
    return false;
  }
};

const saveReportToGoogleSheets = async (report: DailyReport): Promise<boolean> => {
  try {
    const timestamp = new Date().toLocaleString('ja-JP');
    const headers = [
        '保存日時', 'ID', '日付', '部署', '担当者', 
        '項目名', '数量(合計)', 
        '保険数', '保険完成', '自費数', '自費完成', '製作時間',
        '作業開始時刻', '作業終了時刻', '休憩(分)', 
        '備考', '問題点'
    ];

    const rows = report.items.map(item => [
      timestamp, report.id, report.date, report.department, report.staffName, 
      item.itemName, item.count || 0,
      item.countInsured || 0,
      item.countInsuredCompleted || 0,
      item.countSelf || 0,
      item.countSelfCompleted || 0,
      item.timeMinutes || 0,
      report.workStartTime || '', report.workEndTime || '', report.totalBreakTimeMinutes || 0, 
      report.remarks || '', report.issues || ''
    ]);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'save', rows, headers }),
      mode: 'cors', redirect: 'follow'
    });
    return response.ok || response.type === 'opaque';
  } catch (error) {
    return false;
  }
};

export const deleteReport = async (id: string): Promise<boolean> => {
  try {
    const existing = getReports();
    const filtered = existing.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'delete', id: id }),
      mode: 'cors', redirect: 'follow'
    });
    return response.ok || response.type === 'opaque';
  } catch (error) {
    return false;
  }
};

export const loadReportsFromGoogleSheets = async (): Promise<void> => {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=load`, { method: 'GET', mode: 'cors', redirect: 'follow' });
    if (!response.ok) return;
    const result = await response.json();
    if (result.status === 'success' && Array.isArray(result.data)) {
      const reportsMap = new Map<string, DailyReport>();
      result.data.forEach((row: any) => {
        const id = String(row['ID'] || '').trim();
        if (!id) return;
        
        let r = reportsMap.get(id);
        if (!r) {
          r = {
            id, 
            date: standardizeDate(row['日付']), 
            department: row['部署'] as Department, 
            staffName: String(row['担当者'] || ''),
            startTime: '', 
            endTime: '', 
            workStartTime: String(row['作業開始時刻'] || ''), 
            workEndTime: String(row['作業終了時刻'] || ''),
            totalBreakTimeMinutes: Number(row['休憩(分)']) || 0, 
            items: [], 
            remarks: String(row['備考'] || ''), 
            issues: String(row['問題点'] || ''), 
            createdAt: Date.now()
          };
          reportsMap.set(id, r);
        }

        if (row['項目名']) {
            r.items.push({ 
                itemId: Math.random().toString(), 
                itemName: String(row['項目名']), 
                count: Number(row['数量(合計)']) || 0,
                countInsured: Number(row['保険数']) || 0,
                countInsuredCompleted: Number(row['保険完成']) || 0,
                countSelf: Number(row['自費数']) || 0,
                countSelfCompleted: Number(row['自費完成']) || 0,
                timeMinutes: Number(row['製作時間']) || 0
            });
        }
      });
      const sorted = Array.from(reportsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
  } catch (e) { console.error('データ読み込み失敗:', e); }
};

export const importDataJSON = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        JSON.parse(json);
        localStorage.setItem(STORAGE_KEY, json);
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};

export const mergeDataJSON = async (incomingData: any): Promise<boolean> => {
  try {
    const currentData = getReports();
    const newData = Array.isArray(incomingData) ? incomingData : [incomingData];
    
    const allReportsMap = new Map();
    currentData.forEach(r => allReportsMap.set(r.id, r));
    newData.forEach(r => {
      if (r.id) allReportsMap.set(r.id, r);
    });

    const merged = Array.from(allReportsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch (error) {
    console.error("Merge error:", error);
    return false;
  }
};

export const downloadCSV = () => {
  const reports = getReports();
  if (reports.length === 0) return;
  let csv = "\uFEFF日付,部署,担当者,項目名,数量合計,保険数,保険完成,自費数,自費完成,製作時間,備考,問題点\n";
  reports.forEach(r => {
    r.items.forEach(i => {
      csv += `${r.date},${r.department},${r.staffName},${i.itemName},${i.count},${i.countInsured || 0},${i.countInsuredCompleted || 0},${i.countSelf || 0},${i.countSelfCompleted || 0},${i.timeMinutes || 0},"${r.remarks}","${r.issues}"\n`;
    });
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `daily_reports_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportDataJSON = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lab_reports_backup_${new Date().getTime()}.json`;
  link.click();
};

export const clearAllReports = () => {
  if (window.confirm('ブラウザに保存されているすべての日報データを削除しますか？')) {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};
