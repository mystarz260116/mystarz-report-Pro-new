
import React, { useMemo } from 'react';
import { DailyReport, Department } from '../types';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { DEPARTMENT_CONFIGS } from '../constants';
import { TrendingUp, Users, Calendar, Activity, BarChart2, Download } from 'lucide-react';
import { standardizeDate } from '../services/reportService';

const SPECIAL_ITEM_GROUPS = [
  {
    group: '自費',
    color: '#8b5cf6',
    dept: Department.COMPLETE_A,
    items: [
      { label: 'フルジルコニア ステイン・完成(Cr)',      keys: ['フルジルコニア ステイン・完成(Cr)'],      depts: [Department.COMPLETE_A] },
      { label: 'フルジルコニア ステイン・完成(インレー)', keys: ['フルジルコニア ステイン・完成(インレー)'], depts: [Department.COMPLETE_A] },
      { label: 'ステイン・完成 Cr(e.max)',              keys: ['ステイン・完成 Cr(e.max)'],              depts: [Department.COMPLETE_A] },
      { label: 'ステイン・完成 インレー(e.max)',         keys: ['ステイン・完成 インレー(e.max)'],         depts: [Department.COMPLETE_A] },
      { label: 'ステイン・完成 ラミネート(e.max)',           keys: ['ステイン・完成 ラミネート(e.max)'],           depts: [Department.COMPLETE_A] },
      { label: 'ジルコニア・レイヤリング(築盛)',            keys: ['レイヤリング(築盛)(Zir)'],                   depts: [Department.COMPLETE_A] },
      { label: 'ジルコニア・レイヤリング(形成修正・完成)',   keys: ['レイヤリング(形成修正・完成)(Zir)'],          depts: [Department.COMPLETE_A] },
    ],
  },
  {
    group: 'CAD/CAM',
    color: '#0891b2',
    dept: Department.CAD_CAM_3,
    items: [
      { label: '模型あり', keys: ['模型あり'], depts: [Department.CAD_CAM_3] },
      { label: '模型なし', keys: ['模型なし'], depts: [Department.CAD_CAM_3] },
    ],
  },
  {
    group: 'メタル',
    color: '#ec4899',
    dept: Department.METAL_3,
    items: [
      { label: 'HB金属裏装',    keys: ['HB金属裏装', 'HB(金属裏装)'],                                    depts: [Department.METAL_3] },
      { label: 'HBジャケット',  keys: ['HBジャケット', 'HJK'],                                           depts: [Department.METAL_3] },
      { label: 'HBインレー',    keys: ['HBインレー', 'HB（インレー）'],                                   depts: [Department.METAL_3] },
      { label: 'HR',            keys: ['HR'],                                                            depts: [Department.METAL_1, Department.METAL_3] },
      { label: 'ファイバーコア', keys: ['ファイバーコア', 'ファイバーコア(保険)', 'ファイバーコア(自費)'],  depts: [Department.METAL_3] },
      { label: 'クラウン',      keys: ['クラウン'],                                                       depts: [Department.METAL_2] },
      { label: 'インレー',      keys: ['インレー'],                                                       depts: [Department.METAL_2] },
      { label: 'コア',          keys: ['コア'],                                                           depts: [Department.METAL_2] },
    ],
  },
];

interface DashboardProps { label?: string; reports: DailyReport[] }

const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  
  // --- 🛠️ 重複排除処理 ---
  const finalReports = useMemo(() => {
    const safeReports = Array.isArray(reports) ? reports : [];
    const dedupedMap = new Map<string, DailyReport>();
    [...safeReports].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach(r => {
      dedupedMap.set(r.id, r);
    });
    return Array.from(dedupedMap.values());
  }, [reports]);

  const deptProductionData = useMemo(() => {
    const data: Record<string, { name: string, count: number, color: string }> = {};
    Object.values(Department).forEach(d => {
      data[d] = { name: DEPARTMENT_CONFIGS[d].label, count: 0, color: DEPARTMENT_CONFIGS[d].color };
    });

    finalReports.forEach(r => {
      r.items.forEach(item => {
        let targetDept = r.department;
        const itemName = item.itemName;
        
        if (itemName === 'CAD/CAM(設計)' || itemName === 'CAD/CAM(完成)') {
            targetDept = Department.CAD_CAM;
        } else {
            const isOsakaCadItem = itemName === 'ノーマル模型【CAD】(総製作)' || itemName === '貼り付け模型【CAD】(総製作)';
            const isDentureCadItem = r.department === Department.DENTURE;
            
            if (itemName.includes('CAD') && !isOsakaCadItem && !isDentureCadItem) {
                targetDept = Department.CAD_CAM;
            }
        }
        
        if (data[targetDept]) {
            // 大阪模型の場合は「総数」項目のみをカウント（二重計上防止）
            if (targetDept !== Department.OSAKA_MODEL || itemName.includes('総数')) {
                data[targetDept].count += item.count;
            }
        }
      });
    });

    return Object.values(data).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }, [finalReports]);

  const monthlyTrend = useMemo(() => {
    const trend: Record<string, number> = {};
    const now = new Date();
    
    for(let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      trend[dateKey] = 0;
    }

    finalReports.forEach(r => {
      if (!r.date) return;
      const normalizedDate = standardizeDate(r.date);
      if (trend[normalizedDate] !== undefined) {
        // 全社トレンドでも大阪模型は「総数」のみを計算対象にする
        const dailySum = r.items.reduce((sum, item) => {
            if (r.department === Department.OSAKA_MODEL && !item.itemName.includes('総数')) {
                return sum;
            }
            return sum + item.count;
        }, 0);
        trend[normalizedDate] += dailySum;
      }
    });

    return Object.entries(trend).map(([date, count]) => ({
      date: date.substring(5),
      count
    }));
  }, [finalReports]);

  const monthColumns = useMemo(() => {
    const now = new Date();
    return [2, 1, 0].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${d.getMonth() + 1}月${offset === 0 ? '（今月）' : ''}`,
      };
    });
  }, []);

  const specialItemTotals = useMemo(() => {
    return SPECIAL_ITEM_GROUPS.map(group => ({
      ...group,
      items: group.items.map(item => {
        const targetDepts = item.depts;
        const monthTotals = monthColumns.map(({ year, month }) => {
          const reports = finalReports.filter(r => {
            if (!r.date || !targetDepts.includes(r.department)) return false;
            const parts = standardizeDate(r.date).split('-');
            return Number(parts[0]) === year && Number(parts[1]) - 1 === month;
          });
          return reports.reduce((sum, r) =>
            sum + r.items
              .filter(i => item.keys.includes(i.itemName))
              .reduce((s, i) => s + i.count, 0)
          , 0);
        });
        return { ...item, monthTotals };
      }),
    }));
  }, [finalReports, monthColumns]);

  const handleDownloadSpecialCSV = () => {
    const headers = ['部署', '品目', ...monthColumns.map(c => c.label)];
    const rows: string[][] = [headers];
    specialItemTotals.forEach(group => {
      group.items.forEach(item => {
        rows.push([group.group, item.label, ...item.monthTotals.map(String)]);
      });
    });
    const csv = '﻿' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `特定品目月別比較_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ラボ・アナリティクス</h2>
          <p className="text-slate-500 text-xs font-medium">各部署の稼働状況と生産推移の確認</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-700">
            {new Date().getFullYear()}年{new Date().getMonth() + 1}月
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 min-h-[400px]">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> 30日間の生産推移（全社）
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="count" name="総生産数" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" /> 部署別の実績内訳
          </h3>
          <div className="space-y-6">
            {deptProductionData.length > 0 ? (
              deptProductionData.map((d, i) => {
                const maxCount = Math.max(...deptProductionData.map(x => x.count), 1);
                const percentage = (d.count / maxCount) * 100;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">{d.name}</span>
                      <span className="text-slate-900">{d.count.toLocaleString()} <span className="text-slate-400 font-medium">unit</span></span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: d.color }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Activity className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No Data Available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" /> 特定品目 月別比較（直近3ヶ月）
          </h3>
          <button
            onClick={handleDownloadSpecialCSV}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-blue-200"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 font-black text-slate-500 border border-slate-200 w-52">品目</th>
                {monthColumns.map((col, i) => (
                  <th key={col.label} className={`text-center py-3 px-6 font-black border border-slate-200 ${i === 2 ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specialItemTotals.map(group => (
                <React.Fragment key={group.group}>
                  <tr style={{ backgroundColor: group.color + '12' }}>
                    <td colSpan={4} className="py-2 px-4 border border-slate-200">
                      <span className="font-black tracking-widest text-[11px]" style={{ color: group.color }}>
                        ▌ {group.group}
                      </span>
                    </td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.label} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-600 border border-slate-200">{item.label}</td>
                      {item.monthTotals.map((total, i) => (
                        <td key={i} className={`text-center py-2.5 px-6 border border-slate-200 font-black ${i === 2 ? 'text-blue-700 bg-blue-50/40' : 'text-slate-700'}`}>
                          {total > 0 ? total.toLocaleString() : <span className="text-slate-300 font-normal">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-4">※ 直近3ヶ月分のデータを表示。それ以前は「最新データを取得」では表示されません。</p>
      </div>

    </div>
  );
};

export default Dashboard;
