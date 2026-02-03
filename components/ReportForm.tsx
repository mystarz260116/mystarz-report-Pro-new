
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Department, DailyReport, DailyReportItem, ModelTimeEntry } from '../types';
import { DEPARTMENT_CONFIGS, DEPARTMENTS_LIST, STAFF_GROUPS } from '../constants';
import { Save, Plus, CheckCircle2, Clock, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { saveReport } from '../services/reportService';

interface ReportFormProps {
  onSuccess: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editReport as DailyReport | undefined;

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
  const [isSaving, setIsSaving] = useState(false);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [itemTimes, setItemTimes] = useState<Record<string, number>>({});
  const [dentureDetails, setDentureDetails] = useState<Record<string, {
    insured: number, 
    insuredComp: number, 
    self: number, 
    selfComp: number, 
    time: number
  }>>({});
  
  // 「その他」のカテゴリー選択状態（最大3つ）
  const [otherSubItems, setOtherSubItems] = useState<string[]>(['トリミング', 'リリーフ', '上下接着']);

  const otherCategories = [
    'トリミング', 'CAD', 'パターン', 'バリオ', 'ケンマ・仕上げ', 
    '修正', 'リリーフ', 'ノンクラ調整', '上下接着'
  ];

  // 部署に合わせて担当者リストを並べ替える
  const sortedStaffGroups = useMemo(() => {
    const currentDeptLabel = DEPARTMENT_CONFIGS[selectedDept]?.label || '';
    
    return [...STAFF_GROUPS].sort((a, b) => {
      const getScore = (groupName: string) => {
        if (currentDeptLabel === groupName) return 100;
        if (currentDeptLabel.includes(groupName)) return 90;
        if (groupName.includes(currentDeptLabel)) return 90;
        // 特殊なマッピング
        if (currentDeptLabel === '大阪模型' && groupName === '模型') return 95;
        if (currentDeptLabel === '埋没・カット計量' && groupName === '埋没') return 95;
        return 0;
      };
      return getScore(b.groupName) - getScore(a.groupName);
    });
  }, [selectedDept]);

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
      const others: string[] = [];

      editData.items.forEach(item => {
        let itemName = item.itemName;
        
        // 「その他 (カテゴリー)」形式の復元
        if (editData.department === Department.DENTURE && itemName.startsWith('その他 (')) {
            const match = itemName.match(/その他 \((.+)\)/);
            if (match) {
                const category = match[1];
                const otherIdx = others.length;
                if (otherIdx < 3) {
                  others.push(category);
                  const key = `その他-${otherIdx}`;
                  dDetails[key] = {
                      insured: item.countInsured || 0,
                      insuredComp: item.countInsuredCompleted || 0,
                      self: item.countSelf || 0,
                      selfComp: item.countSelfCompleted || 0,
                      time: item.timeMinutes || 0
                  };
                }
                return; // その他として処理したので次へ
            }
        }

        if (editData.department === Department.DENTURE && item.countInsured !== undefined) {
            dDetails[itemName] = {
                insured: item.countInsured || 0,
                insuredComp: item.countInsuredCompleted || 0,
                self: item.countSelf || 0,
                selfComp: item.countSelfCompleted || 0,
                time: item.timeMinutes || 0
            };
        } else {
            counts[itemName] = item.count;
            if (item.timeMinutes) times[itemName] = item.timeMinutes;
        }
      });

      if (others.length > 0) {
        setOtherSubItems(prev => {
          const newOnes = [...prev];
          others.forEach((o, i) => { newOnes[i] = o; });
          return newOnes;
        });
      }
      setItemCounts(counts);
      setItemTimes(times);
      setDentureDetails(dDetails);
    }
  }, [editData]);

  useEffect(() => {
    setActiveSectionIndex(0);
    if (!editData) {
      setItemCounts({});
      setItemTimes({});
      setDentureDetails({});
      setOtherSubItems(['トリミング', 'リリーフ', '上下接着']);
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
    
    // 大阪模型の合計自動計算
    if (selectedDept === Department.OSAKA_MODEL) {
        const urgentItems = ['ノーマル模型(急ぎ)', '貼り付け模型(急ぎ)', 'インレー・コア模型(急ぎ)'];
        const totalItems = [
          'ノーマル模型【メタル】(総製作)', 
          'ノーマル模型【CAD】(総製作)', 
          '貼り付け模型【メタル】(総製作)', 
          '貼り付け模型【CAD】(総製作)', 
          'インレー・コア模型(総製作)'
        ];
        
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
    if (isSaving) return;
    if (!window.confirm("日報を保存して報告しますか？")) return;
    setIsSaving(true);

    try {
      let reportItems: DailyReportItem[] = [];
      const currentConfig = DEPARTMENT_CONFIGS[selectedDept];
      const allAllowedItems = new Set(currentConfig.sections.flatMap(s => s.items));

      // シンプル入力項目の抽出 (現在の部署の項目のみに絞り、0より大きいものだけを保存)
      const simpleItems: DailyReportItem[] = (Object.entries(itemCounts) as [string, number][])
          .filter(([name, count]) => count > 0 && allAllowedItems.has(name))
          .map(([name, count], idx) => ({
              itemId: `s-${idx}-${Date.now()}`,
              itemName: name,
              count: count,
              timeMinutes: itemTimes[name] || 0
          }));

      if (selectedDept === Department.DENTURE) {
          // デンチャー部署の場合、詳細入力項目も抽出して統合
          const detailedItems: DailyReportItem[] = (Object.entries(dentureDetails) as [string, {
              insured: number;
              insuredComp: number;
              self: number;
              selfComp: number;
              time: number;
          }][])
              .filter(([name, d]) => {
                const isOther = name.startsWith('その他-');
                return (isOther || allAllowedItems.has(name)) && (d.insured > 0 || d.self > 0 || d.time > 0);
              })
              .map(([name, d], idx) => {
                  let finalName = name;
                  if (name.startsWith('その他-')) {
                      const otherIdx = parseInt(name.split('-')[1]);
                      finalName = `その他 (${otherSubItems[otherIdx]})`;
                  }
                  return {
                      itemId: `d-${idx}-${Date.now()}`,
                      itemName: finalName,
                      count: d.insured + d.self,
                      countInsured: d.insured,
                      countInsuredCompleted: d.insuredComp,
                      countSelf: d.self,
                      countSelfCompleted: d.selfComp,
                      timeMinutes: d.time
                  };
              });
          
          reportItems = [...simpleItems, ...detailedItems];
      } else {
          reportItems = simpleItems;
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
        remarks,
        issues,
        createdAt: Date.now(),
      };

      const success = await saveReport(newReport);
      if (success) {
        alert(editData ? '✅ 日報を更新しました' : '✅ 日報が保存されました');
        if (editData) navigate('/', { state: {} });
        onSuccess();
        if(!editData) window.location.reload();
      } else {
        alert('⚠️ 保存に失敗しました');
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      alert('⚠️ エラーが発生しました');
      setIsSaving(false);
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">報告者 <span className="text-[10px] text-blue-500 font-normal ml-1">※自部署が優先表示されています</span></label>
              <select required value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm border bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">担当者を選択</option>
                {sortedStaffGroups.map((group) => (
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
                if (hasTabs && activeSectionIndex !== secIdx) return null;
                
                const isDentureDetailedSection = selectedDept === Department.DENTURE && 
                                                 section.title !== '基本' && 
                                                 section.title !== '3D/CAD';

                return (
                  <div key={secIdx} className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                        {section.items.map((item) => {
                            if (isDentureDetailedSection) {
                                // 「その他」項目の場合は3行表示する
                                if (item === 'その他') {
                                  return [0, 1, 2].map((idx) => {
                                    const key = `その他-${idx}`;
                                    const d = dentureDetails[key] || { insured: 0, insuredComp: 0, self: 0, selfComp: 0, time: 0 };
                                    return (
                                      <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm border-l-4 border-l-rose-500">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                            <div className="lg:w-64 shrink-0 flex items-center gap-2">
                                                <label className="text-sm font-black text-slate-700">その他 ({idx + 1})</label>
                                                <select 
                                                    value={otherSubItems[idx]} 
                                                    onChange={(e) => {
                                                      const newOnes = [...otherSubItems];
                                                      newOnes[idx] = e.target.value;
                                                      setOtherSubItems(newOnes);
                                                    }}
                                                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none font-bold text-blue-600"
                                                >
                                                    {otherCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 flex-1">
                                                <input type="number" placeholder="保険" value={d.insured || ''} onChange={e => handleDentureDetailChange(key, 'insured', e.target.value)} className="border border-blue-200 bg-white rounded-lg p-2 text-sm text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none" />
                                                <input type="number" placeholder="完成" value={d.insuredComp || ''} onChange={e => handleDentureDetailChange(key, 'insuredComp', e.target.value)} className="border border-sky-200 bg-white rounded-lg p-2 text-sm text-sky-900 focus:ring-2 focus:ring-sky-400 outline-none" />
                                                <input type="number" placeholder="自費" value={d.self || ''} onChange={e => handleDentureDetailChange(key, 'self', e.target.value)} className="border border-purple-200 bg-white rounded-lg p-2 text-sm text-purple-900 focus:ring-2 focus:ring-purple-400 outline-none" />
                                                <input type="number" placeholder="完成" value={d.selfComp || ''} onChange={e => handleDentureDetailChange(key, 'selfComp', e.target.value)} className="border border-indigo-200 bg-white rounded-lg p-2 text-sm text-indigo-900 focus:ring-2 focus:ring-indigo-400 outline-none" />
                                                <input type="number" placeholder="時間" value={d.time || ''} onChange={e => handleDentureDetailChange(key, 'time', e.target.value)} className="border border-orange-200 bg-white rounded-lg p-2 text-sm text-orange-900 focus:ring-2 focus:ring-orange-400 outline-none" />
                                            </div>
                                        </div>
                                      </div>
                                    );
                                  });
                                }

                                const d = dentureDetails[item] || { insured: 0, insuredComp: 0, self: 0, selfComp: 0, time: 0 };
                                return (
                                    <div key={item} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                            <div className="lg:w-64 shrink-0 flex items-center gap-2">
                                                <label className="text-sm font-bold text-gray-700">{item}</label>
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 flex-1">
                                                <input 
                                                  type="number" 
                                                  placeholder="保険" 
                                                  value={d.insured || ''} 
                                                  onChange={e => handleDentureDetailChange(item, 'insured', e.target.value)} 
                                                  className="border border-blue-200 bg-blue-50/50 rounded-lg p-2 text-sm text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none" 
                                                />
                                                <input 
                                                  type="number" 
                                                  placeholder="完成" 
                                                  value={d.insuredComp || ''} 
                                                  onChange={e => handleDentureDetailChange(item, 'insuredComp', e.target.value)} 
                                                  className="border border-sky-200 bg-sky-50/50 rounded-lg p-2 text-sm text-sky-900 focus:ring-2 focus:ring-sky-400 outline-none" 
                                                />
                                                <input 
                                                  type="number" 
                                                  placeholder="自費" 
                                                  value={d.self || ''} 
                                                  onChange={e => handleDentureDetailChange(item, 'self', e.target.value)} 
                                                  className="border border-purple-200 bg-purple-50/50 rounded-lg p-2 text-sm text-purple-900 focus:ring-2 focus:ring-purple-400 outline-none" 
                                                />
                                                <input 
                                                  type="number" 
                                                  placeholder="完成" 
                                                  value={d.selfComp || ''} 
                                                  onChange={e => handleDentureDetailChange(item, 'selfComp', e.target.value)} 
                                                  className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-2 text-sm text-indigo-900 focus:ring-2 focus:ring-indigo-400 outline-none" 
                                                />
                                                <input 
                                                  type="number" 
                                                  placeholder="時間" 
                                                  value={d.time || ''} 
                                                  onChange={e => handleDentureDetailChange(item, 'time', e.target.value)} 
                                                  className="border border-orange-200 bg-orange-50/50 rounded-lg p-2 text-sm text-orange-900 focus:ring-2 focus:ring-orange-400 outline-none" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 px-2">
                                    <label className="text-sm text-gray-600">{item}</label>
                                    <div className="flex items-center gap-2">
                                        {(section.title === '3D/CAD' || selectedDept === Department.CAD_CAM) && (
                                            <input
                                                type="number"
                                                placeholder="分"
                                                value={itemTimes[item] === undefined ? '' : itemTimes[item]}
                                                onChange={(e) => setItemTimes(prev => ({...prev, [item]: parseInt(e.target.value) || 0}))}
                                                className="w-16 text-right border rounded-md p-2 text-sm border-amber-200 bg-amber-50/20"
                                            />
                                        )}
                                        <div className="flex items-center gap-1">
                                          <input
                                              type="number"
                                              min="0"
                                              placeholder="0"
                                              readOnly={item.includes('総数')}
                                              value={itemCounts[item] === undefined ? '' : itemCounts[item]}
                                              onChange={(e) => handleCountChange(item, e.target.value)}
                                              className={`w-24 text-right border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 
                                                ${itemCounts[item] > 0 ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-300'}
                                                ${item.includes('総数') ? 'bg-slate-100 font-black cursor-not-allowed' : ''}
                                              `}
                                          />
                                          {selectedDept !== Department.DENTURE && (
                                            <span className="text-xs font-bold text-slate-400 w-4">本</span>
                                          )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" /> 備考・連絡事項
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="特記事項があれば入力してください"
                className="w-full h-24 border border-gray-300 rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> 問題点・課題
              </label>
              <textarea
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                placeholder="トラブルや共有すべき問題があれば入力してください"
                className="w-full h-24 border border-rose-200 rounded-xl p-3 text-sm bg-rose-50/30 focus:ring-2 focus:ring-rose-500 outline-none resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className={`flex items-center gap-2 px-12 py-4 rounded-full shadow-xl transition-all font-bold ${
                isSaving ? 'bg-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />} 日報を保存して報告
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
