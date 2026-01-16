
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Department, DailyReport, DailyReportItem, ModelTimeEntry } from '../types.ts';
import { DEPARTMENT_CONFIGS, DEPARTMENTS_LIST, STAFF_GROUPS } from '../constants.ts';
import { Save, Plus, Calendar, User, Timer, Trash2, Info, CheckCircle2, Clock } from 'lucide-react';
import { saveReport } from '../services/reportService.ts';

interface ReportFormProps {
  onSuccess: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editReport as DailyReport | undefined;

  // 日本時間の今日の日付 (YYYY-MM-DD) を取得
  const getTodayLocal = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const [selectedDept, setSelectedDept] = useState<Department>(Department.OSAKA_MODEL);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [date, setDate] = useState(getTodayLocal());
  const [staffName, setStaffName] = useState('');
  
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');

  const [breakTime, setBreakTime] = useState(60);
  const [remarks, setRemarks] = useState('');
  const [issues, setIssues] = useState('');
  
  // デンチャー以外の標準入力用
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [itemTimes, setItemTimes] = useState<Record<string, number>>({});
  
  // デンチャー専用の多機能入力用
  const [dentureDetails, setDentureDetails] = useState<Record<string, {
    insured: number, 
    insuredComp: number, 
    self: number, 
    selfComp: number, 
    time: number
  }>>({});

  const [itemTimeRanges, setItemTimeRanges] = useState<Record<string, {start: string, end: string}>>({});
  const [modelTimeEntries, setModelTimeEntries] = useState<ModelTimeEntry[]>([]);
  const [tempModelEntry, setTempModelEntry] = useState<ModelTimeEntry>({
    staffName: '',
    modelEndTime: '',
    finalEndTime: ''
  });

  useEffect(() => {
    if (editData) {
      setSelectedDept(editData.department);
      setDate(editData.date);
      setStaffName(editData.staffName);
      setWorkStartTime(editData.workStartTime || '');
      setWorkEndTime(editData.workEndTime || '');
      setBreakTime(editData.totalBreakTimeMinutes);
      setRemarks(editData.remarks);
      setIssues(editData.issues || '');
      
      const counts: Record<string, number> = {};
      const times: Record<string, number> = {};
      const dDetails: Record<string, any> = {};
      const ranges: Record<string, {start: string, end: string}> = {};

      editData.items.forEach(item => {
        counts[item.itemName] = item.count;
        if (item.timeMinutes) times[item.itemName] = item.timeMinutes;
        
        if (editData.department === Department.DENTURE) {
            dDetails[item.itemName] = {
                insured: item.countInsured || 0,
                insuredComp: item.countInsuredCompleted || 0,
                self: item.countSelf || 0,
                selfComp: item.countSelfCompleted || 0,
                time: item.timeMinutes || 0
            };
        }

        if (item.customTimeRange) {
          const [start, end] = item.customTimeRange.split('~');
          ranges[item.itemName] = { start, end };
        }
      });

      setItemCounts(counts);
      setItemTimes(times);
      setDentureDetails(dDetails);
      setItemTimeRanges(ranges);
      if (editData.modelTimeEntries) setModelTimeEntries(editData.modelTimeEntries);
    }
  }, [editData]);

  useEffect(() => {
    // 部署が切り替わったらタブをリセット
    setActiveSectionIndex(0);
    
    if (!editData) {
      setItemCounts({});
      setItemTimes({});
      setDentureDetails({});
      setItemTimeRanges({});
      setModelTimeEntries([]);
      setTempModelEntry({ staffName: '', modelEndTime: '', finalEndTime: '' });
    }
  }, [selectedDept, editData]);

  const handleDentureDetailChange = (itemName: string, field: string, val: string) => {
    const num = parseInt(val) || 0;
    setDentureDetails(prev => ({
        ...prev,
        [itemName]: {
            ...(prev[itemName] || { insured: 0, insuredComp: 0, self: 0, selfComp: 0, time: 0 }),
            [field]: num
        }
    }));
  };

  const handleCountChange = (itemName: string, val: string) => {
    const num = parseInt(val) || 0;
    const updatedCounts = { ...itemCounts, [itemName]: num };

    if (selectedDept === Department.OSAKA_MODEL) {
        const urgentItems = ['ノーマル模型(急ぎ)', '貼り付け模型(急ぎ)', 'インレー・コア模型(急ぎ)'];
        const totalItems = ['ノーマル模型(総製作)', '貼り付け模型(総製作)', 'インレー・コア模型(総製作)'];

        if (urgentItems.includes(itemName) || totalItems.includes(itemName)) {
            const urgentSum = urgentItems.reduce((acc, key) => acc + (updatedCounts[key] || 0), 0);
            updatedCounts['総数(急ぎ)'] = urgentSum;
            const totalSum = totalItems.reduce((acc, key) => acc + (updatedCounts[key] || 0), 0);
            updatedCounts['総数(総製作)'] = totalSum;
        }
    }
    setItemCounts(updatedCounts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let reportItems: DailyReportItem[] = [];

    if (selectedDept === Department.DENTURE) {
        reportItems = (Object.entries(dentureDetails) as [string, { insured: number; insuredComp: number; self: number; selfComp: number; time: number }][])
            .filter(([_, d]) => d.insured > 0 || d.self > 0 || d.time > 0)
            .map(([name, d], idx) => ({
                itemId: `${idx}`,
                itemName: name,
                count: d.insured + d.self,
                countInsured: d.insured,
                countInsuredCompleted: d.insuredComp,
                countSelf: d.self,
                countSelfCompleted: d.selfComp,
                timeMinutes: d.time
            }));
    } else {
        reportItems = (Object.entries(itemCounts) as [string, number][])
            .filter(([_, count]) => count > 0)
            .map(([name, count], idx) => ({
                itemId: `${idx}`,
                itemName: name,
                count: count,
                timeMinutes: itemTimes[name]
            }));
    }

    if (reportItems.length === 0 && !remarks && modelTimeEntries.length === 0) {
        if(!window.confirm("実績入力がありませんが登録しますか？")) return;
    }

    const newReport: DailyReport = {
      id: editData ? editData.id : Date.now().toString(),
      date,
      department: selectedDept,
      staffName,
      startTime: '', 
      endTime: '',   
      workStartTime,
      workEndTime,
      totalBreakTimeMinutes: breakTime,
      items: reportItems,
      modelTimeEntries: selectedDept === Department.OSAKA_MODEL ? modelTimeEntries : undefined,
      remarks,
      issues,
      createdAt: Date.now(),
    };

    const success = await saveReport(newReport);
    if (success) {
      alert(editData ? '✅ 日報を更新しました' : '✅ 日報が保存されました');
      if (editData) navigate('/', { state: {} });
      onSuccess();
      if(!editData) window.location.reload(); // フォームを完全にリセット
    } else {
      alert('⚠️ 保存に失敗しました');
    }
  };

  const currentConfig = DEPARTMENT_CONFIGS[selectedDept];
  const hasTabs = [Department.DENTURE, Department.COMPLETE_A, Department.COMPLETE_B, Department.COMPLETE_C].includes(selectedDept);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          {editData ? '日報の修正' : '日報入力'}
        </h2>
      </div>

      <div className="p-6 space-y-8">
        {!editData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {DEPARTMENTS_LIST.map((dept) => {
              const isSelected = selectedDept === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept.id)}
                  className={`p-2 text-xs font-bold rounded-lg border transition-all text-center h-16 flex flex-col justify-center items-center gap-1 shadow-sm
                    ${isSelected ? 'text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                  `}
                  style={isSelected ? { backgroundColor: dept.color, borderColor: dept.color } : {}}
                >
                  <span className="leading-tight">{dept.label}</span>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">日付</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm border bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">報告者</label>
              <select required value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm border bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">担当者を選択</option>
                {STAFF_GROUPS.map((group) => (
                  <optgroup key={group.groupName} label={group.groupName}>
                    {group.items.map((name) => (<option key={name} value={name}>{name}</option>))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">作業時間</label>
              <div className="flex items-center gap-2">
                <input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm border bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                <span className="text-gray-400">~</span>
                <input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm border bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 pb-2" style={{ borderBottomColor: currentConfig?.color }}>
                <h3 className="text-lg font-black text-slate-900">{currentConfig?.label} 実績入力</h3>
            </div>
            
            {/* カテゴリータブ表示（設定された部署のみ） */}
            {hasTabs && (
                <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
                    {currentConfig.sections.map((sec, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveSectionIndex(idx)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeSectionIndex === idx ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {sec.title}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-3">
              {currentConfig?.sections.map((section, secIdx) => {
                // タブがある部署は選択中のセクション以外を隠す
                const isHidden = hasTabs && activeSectionIndex !== secIdx;
                if (isHidden) return null;

                const isDentureBasic = selectedDept === Department.DENTURE && section.title === '基本';

                return (
                  <div key={secIdx} className="space-y-3 animate-in fade-in duration-300">
                    {!hasTabs && <h4 className="font-bold text-gray-700 text-sm bg-gray-50 px-3 py-1 rounded-md">{section.title}</h4>}
                    
                    <div className="grid grid-cols-1 gap-2">
                        {section.items.map((item) => {
                            if (selectedDept === Department.DENTURE) {
                                const d = dentureDetails[item] || { insured: 0, insuredComp: 0, self: 0, selfComp: 0, time: 0 };
                                
                                // デンチャーの「基本」セクションの場合は1項目入力
                                if (isDentureBasic) {
                                    return (
                                        <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 px-2">
                                            <label className="text-sm font-bold text-gray-700">{item}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={d.insured || ''}
                                                onChange={e => handleDentureDetailChange(item, 'insured', e.target.value)}
                                                className={`w-24 text-right border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 ${d.insured > 0 ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-300'}`}
                                            />
                                        </div>
                                    );
                                }

                                // デンチャーのその他のセクションは5連入力
                                return (
                                    <div key={item} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                            <label className="text-sm font-bold text-gray-700 lg:w-64 shrink-0">{item}</label>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 flex-1">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-blue-600 font-bold block ml-1">保険数</span>
                                                    <input type="number" placeholder="0" value={d.insured || ''} onChange={e => handleDentureDetailChange(item, 'insured', e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-center text-sm border focus:ring-2 focus:ring-blue-500 bg-blue-50/30" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-blue-400 font-bold block ml-1 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />完成</span>
                                                    <input type="number" placeholder="0" value={d.insuredComp || ''} onChange={e => handleDentureDetailChange(item, 'insuredComp', e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-center text-sm border focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-purple-600 font-bold block ml-1">自費数</span>
                                                    <input type="number" placeholder="0" value={d.self || ''} onChange={e => handleDentureDetailChange(item, 'self', e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-center text-sm border focus:ring-2 focus:ring-purple-500 bg-purple-50/30" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-purple-400 font-bold block ml-1 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />完成</span>
                                                    <input type="number" placeholder="0" value={d.selfComp || ''} onChange={e => handleDentureDetailChange(item, 'selfComp', e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-center text-sm border focus:ring-2 focus:ring-purple-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-amber-600 font-bold block ml-1 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />時間</span>
                                                    <input type="number" placeholder="0" value={d.time || ''} onChange={e => handleDentureDetailChange(item, 'time', e.target.value)} className="w-full border-amber-200 bg-amber-50/30 rounded-lg p-2 text-center text-sm border focus:ring-2 focus:ring-amber-500 font-bold" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // その他部署の通常表示（完成A/B/C含む）
                            return (
                                <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 px-2">
                                    <label className="text-sm text-gray-600">{item}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={itemCounts[item] === undefined ? '' : itemCounts[item]}
                                        onChange={(e) => handleCountChange(item, e.target.value)}
                                        className={`w-24 text-right border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 ${itemCounts[item] > 0 ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-300'}`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">備考</label>
                  <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-bold text-red-500 uppercase tracking-wider">問題点・トラブル</label>
                  <textarea rows={2} value={issues} onChange={(e) => setIssues(e.target.value)} className="w-full border-red-200 bg-red-50 rounded-lg p-2 text-sm border focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
          </div>

          <div className="flex justify-center pt-4">
            <button type="submit" className="flex items-center gap-2 bg-slate-900 text-white px-12 py-4 rounded-full hover:bg-slate-800 shadow-xl transition-all font-bold transform hover:scale-105 active:scale-95">
              <Save className="w-5 h-5" /> 日報を保存して報告
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
