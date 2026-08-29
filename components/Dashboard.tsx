
import React, { useMemo } from 'react';
import { DailyReport, Department } from '../types';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { DEPARTMENT_CONFIGS } from '../constants';
import { TrendingUp, Users, Calendar, Activity, BarChart2 } from 'lucide-react';
import { standardizeDate } from '../services/reportService';

const SPECIAL_ITEM_GROUPS = [
  {
    group: '自費',
    color: '#8b5cf6',
    dept: Department.COMPLETE_A,
    items: [
      { label: 'フルジルコニア ステイン・完成(Cr)',      keys: ['フルジルコニア ステイン・完成(Cr)'] },
      { label: 'フルジルコニア ステイン・完成(インレー)', keys: ['フルジルコニア ステイン・完成(インレー)'] },
      { label: 'ステイン・完成 Cr(e.max)',              keys: ['ステイン・完成 Cr(e.max)'] },
      { label: 'ステイン・完成 インレー(e.max)',         keys: ['ステイン・完成 インレー(e.max)'] },
      { label: 'ステイン・完成 ラミネート(e.max)',       keys: ['ステイン・完成 ラミネート(e.max)'] },
    ],
  },
  {
    group: 'メタル③',
    color: '#ec4899',
    dept: Department.METAL_3,
    items: [
      { label: 'HB金属裏装',   keys: ['HB金属裏装', 'HB(金属裏装)'] },
      { label: 'HBジャケット', keys: ['HBジャケット', 'HJK'] },
      { label: 'HBインレー',   keys: ['HBインレー', 'HB（インレー）'] },
      { label: 'HR',           keys: ['HR'] },
      { label: 'ファイバーコア', keys: ['ファイバーコア', 'ファイバーコア(保険)', 'ファイバーコア(自費)'] },
    ],
  },
  {
    group: 'メタル①',
    color: '#10b981',
    dept: Department.METAL_1,
    items: [
      { label: 'HR', keys: ['HR'] },
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
        const monthTotals = monthColumns.map(({ year, month }) => {
          const reports = finalReports.filter(r => {
            if (!r.date || r.department !== group.dept) return false;
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
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-500" /> 特定品目 月別比較（直近3ヶ月）
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 pr-4 font-black text-slate-500 w-48">品目</th>
                {monthColumns.map(col => (
                  <th key={col.label} className={`text-center py-2 px-4 font-black ${col.label.includes('今月') ? 'text-blue-600' : 'text-slate-400'}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specialItemTotals.map(group => (
                <React.Fragment key={group.group}>
                  <tr>
                    <td colSpan={4} className="pt-5 pb-1">
                      <span className="text-xs font-black tracking-widest px-2 py-0.5 rounded-full" style={{ color: group.color, backgroundColor: group.color + '18' }}>
                        {group.group}
                      </span>
                    </td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.label} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-4 text-slate-600">{item.label}</td>
                      {item.monthTotals.map((total, i) => (
                        <td key={i} className={`text-center py-2 px-4 font-black ${i === 2 ? 'text-blue-700' : 'text-slate-700'}`}>
                          {total > 0 ? total.toLocaleString() : <span className="text-slate-200">—</span>}
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
