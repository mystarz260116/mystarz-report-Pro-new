
import React, { useState, useMemo } from 'react';
import { DailyReport, Department } from '../types';
import { DEPARTMENTS_LIST, isHoliday } from '../constants';
import { ChevronLeft, ChevronRight, Table, Filter, Sigma, Calendar as CalendarIcon, Info, Download } from 'lucide-react';

interface StatisticsProps {
  reports: DailyReport[];
}

const Statistics: React.FC<StatisticsProps> = ({ reports }) => {
  // 初期表示を「現在の月」の1日に設定
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filterDept, setFilterDept] = useState<Department | 'ALL'>('ALL');

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const calcInfo = useMemo(() => {
    const now = new Date();
    const vYear = currentDate.getFullYear();
    const vMonth = currentDate.getMonth();
    
    const isThisMonth = (now.getFullYear() === vYear && now.getMonth() === vMonth);
    const endDay = isThisMonth ? now.getDate() : new Date(vYear, vMonth + 1, 0).getDate();

    let businessDays = 0;
    const activeDays: number[] = [];

    for (let d = 1; d <= endDay; d++) {
      const dateToCheck = new Date(vYear, vMonth, d);
      if (!isHoliday(dateToCheck)) {
        businessDays++;
        activeDays.push(d);
      }
    }

    return {
      denom: Math.max(1, businessDays),
      activeDays,
      endDay,
      vYear,
      vMonth
    };
  }, [currentDate]);

  const daysInMonth = useMemo(() => {
    const days = [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const month = date.getMonth();
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const tableData = useMemo(() => {
    const deptMap = new Map<Department, {
        items: Map<string, Map<number, number>>;
        dailyTotal: Map<number, number>;
    }>();

    DEPARTMENTS_LIST.forEach(d => deptMap.set(d.id, { items: new Map(), dailyTotal: new Map() }));

    const safeReports = Array.isArray(reports) ? reports : [];
    
    safeReports.forEach(r => {
      // 修正：日付標準化を強化
      if (!r.date) return;
      const normalized = r.date.split(/[T ]/)[0].replace(/\//g, '-');
      const dateParts = normalized.split('-');
      if (dateParts.length < 3) return;

      const y = parseInt(dateParts[0], 10);
      const m = parseInt(dateParts[1], 10);
      const d = parseInt(dateParts[2], 10);

      if (y === currentDate.getFullYear() && (m - 1) === currentDate.getMonth()) {
        r.items.forEach(item => {
          let targetDept = r.department;
          
          // 大阪模型のCAD項目は統合から除外する
          const isOsakaCadItem = item.itemName === 'ノーマル模型【CAD】(総製作)' || item.itemName === '貼り付け模型【CAD】(総製作)';
          
          // 「CAD」という文字列が含まれており、かつ除外対象でない場合はCAD/CAMセクションに統合する
          if (item.itemName.includes('CAD') && !isOsakaCadItem) {
              targetDept = Department.CAD_CAM;
          }
          
          const info = deptMap.get(targetDept);
          if (!info) return;

          if (!info.items.has(item.itemName)) info.items.set(item.itemName, new Map());
          const dayMap = info.items.get(item.itemName)!;
          
          const currentCount = dayMap.get(d) || 0;
          dayMap.set(d, currentCount + item.count);
          
          const currentDailyTotal = info.dailyTotal.get(d) || 0;
          info.dailyTotal.set(d, currentDailyTotal + item.count);
        });
      }
    });
    return deptMap;
  }, [currentDate, reports]);

  const handleDownloadCSV = () => {
    const headers = ['部署', '品目'];
    daysInMonth.forEach(d => headers.push(`${d.getDate()}日`));
    headers.push('月合計', '日平均');

    const csvRows: string[][] = [headers];

    DEPARTMENTS_LIST.filter(d => filterDept === 'ALL' || filterDept === d.id).forEach(dept => {
      const data = tableData.get(dept.id);
      if (!data || data.items.size === 0) return;

      const itemNames = Array.from(data.items.keys()).sort() as string[];
      itemNames.forEach(name => {
        const dayMap = data.items.get(name);
        const row: string[] = [dept.label, name];
        let monthlySum = 0;
        let businessSum = 0;

        daysInMonth.forEach(d => {
          const day = d.getDate();
          const val = dayMap?.get(day) || 0;
          row.push(val.toString());
          monthlySum += val;
          if (calcInfo.activeDays.includes(day)) businessSum += val;
        });

        row.push(monthlySum.toString());
        row.push((businessSum / calcInfo.denom).toFixed(1));
        csvRows.push(row);
      });

      const totalRow: string[] = [dept.label, '【部署合計】'];
      let deptMonthlySum = 0;
      let deptBusinessSum = 0;
      daysInMonth.forEach(d => {
        const day = d.getDate();
        const val = data.dailyTotal.get(day) || 0;
        totalRow.push(val.toString());
        deptMonthlySum += val;
        if (calcInfo.activeDays.includes(day)) deptBusinessSum += val;
      });
      totalRow.push(deptMonthlySum.toString());
      totalRow.push((deptBusinessSum / calcInfo.denom).toFixed(1));
      csvRows.push(totalRow);
      csvRows.push([]);
    });

    const csvContent = csvRows.map(r => r.join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `月間集計_${calcInfo.vYear}年${calcInfo.vMonth + 1}月.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><Table className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">月間集計表</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
               <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{calcInfo.vYear}年 {calcInfo.vMonth + 1}月</span>
               <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                 <CalendarIcon className="w-3 h-3" />
                 計算の分母：{calcInfo.denom} 日間 (稼働日のみ)
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Download className="w-4 h-4" />
            CSVダウンロード
          </button>
          <select 
            value={filterDept} 
            onChange={(e) => setFilterDept(e.target.value as any)}
            className="bg-slate-100 border-none rounded-xl text-xs font-black px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">全部署を表示</option>
            {DEPARTMENTS_LIST.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <div className="flex bg-slate-900 rounded-xl p-1 text-white shadow-lg">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-6 flex items-center font-black text-xs min-w-[80px] justify-center">{calcInfo.vMonth + 1}月</span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden h-[700px] flex flex-col">
        <div className="overflow-auto scrollbar-thin">
          <table className="w-full border-collapse text-[10px] table-fixed">
            <thead className="sticky top-0 z-50 bg-slate-100">
              <tr>
                <th className="p-4 text-left font-black text-slate-500 w-[180px] bg-slate-100 sticky left-0 border-r border-b">品目 / 日付</th>
                {daysInMonth.map(d => {
                  const day = d.getDate();
                  const isHolidayDate = isHoliday(d);
                  const isToday = new Date().toDateString() === d.toDateString();
                  const weekDay = ['日','月','火','水','木','金','土'][d.getDay()];
                  return (
                    <th key={day} className={`px-1 py-3 text-center border-r border-b ${isHolidayDate ? 'bg-rose-50 text-rose-400' : isToday ? 'bg-blue-50 text-blue-600 font-black' : 'text-slate-400 bg-slate-100'}`}>
                      {day}<br/><span className="text-[8px] opacity-70">{weekDay}</span>
                    </th>
                  );
                })}
                <th className="px-2 py-3 bg-slate-200 text-slate-900 font-black w-[60px] border-b text-center">月計</th>
                <th className="px-2 py-3 bg-blue-100 text-blue-800 font-black w-[85px] border-b sticky right-0 text-center shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">日平均</th>
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS_LIST.filter(d => filterDept === 'ALL' || filterDept === d.id).map(dept => {
                const data = tableData.get(dept.id);
                if (!data || data.items.size === 0) return null;
                const itemNames = Array.from(data.items.keys()).sort() as string[];

                return (
                  <React.Fragment key={dept.id}>
                    <tr className="bg-slate-50 font-black border-b">
                      <td className="p-3 text-slate-900 border-r sticky left-0 bg-slate-50" style={{ borderLeft: `4px solid ${dept.color}` }}>{dept.label}</td>
                      <td colSpan={daysInMonth.length + 2} className="p-0"></td>
                      <td className="sticky right-0 bg-blue-50 border-l border-blue-100"></td>
                    </tr>

                    {itemNames.map(name => {
                      const dayMap = data.items.get(name);
                      const monthlyTotal = (Array.from(dayMap?.values() || []) as number[]).reduce((a: number, b: number) => a + b, 0);
                      
                      let businessSum = 0;
                      calcInfo.activeDays.forEach(d => businessSum += dayMap?.get(d) || 0);
                      const avg = (businessSum / calcInfo.denom).toFixed(1);

                      return (
                        <tr key={name} className="border-b hover:bg-slate-50/50 transition-colors group">
                          <td className="p-3 text-slate-600 border-r sticky left-0 bg-white truncate group-hover:bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{name}</td>
                          {daysInMonth.map(d => {
                            const val = dayMap?.get(d.getDate()) || 0;
                            const isHolidayDate = isHoliday(d);
                            return (
                              <td key={d.getDate()} className={`px-1 text-center border-r ${isHolidayDate ? 'bg-rose-50/20' : ''} ${val > 0 ? 'text-slate-900 font-bold' : 'text-slate-200'}`}>
                                {val || '-'}
                              </td>
                            );
                          })}
                          <td className="bg-slate-50 text-center font-black text-slate-700">{monthlyTotal.toLocaleString()}</td>
                          <td className="bg-blue-50/50 text-center font-black text-blue-700 sticky right-0 border-l border-blue-100 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                             {avg}
                             <div className="text-[8px] text-blue-300 font-normal leading-none mt-0.5">{businessSum}÷{calcInfo.denom}d</div>
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-100 border-b-2 border-slate-200 font-black">
                      <td className="p-3 text-slate-900 border-r sticky left-0 bg-slate-100 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                         <div className="flex items-center gap-1"><Sigma className="w-3 h-3" />{dept.label} 合計</div>
                      </td>
                      {daysInMonth.map(d => {
                        const total = data.dailyTotal.get(d.getDate()) || 0;
                        return <td key={d.getDate()} className={`text-center border-r ${total > 0 ? 'text-slate-900' : 'text-slate-200'}`}>{total || '-'}</td>;
                      })}
                      <td className="bg-slate-200 text-center text-slate-900">{(Array.from(data.dailyTotal.values()) as number[]).reduce((a: number, b: number) => a + b, 0).toLocaleString()}</td>
                      <td className="bg-blue-600 text-white text-center sticky right-0 shadow-lg z-20">
                        {(() => {
                           let sum = 0;
                           calcInfo.activeDays.forEach(d => sum += data.dailyTotal.get(d) || 0);
                           return (sum / calcInfo.denom).toFixed(1);
                        })()}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
         <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
         <div className="text-xs text-blue-800 leading-relaxed">
            <p className="font-bold mb-1">表示が反映されない場合</p>
            <p>スプレッドシートからデータを再読み込みするには、サイドバーの「最新データを取得」ボタンを押してください。</p>
            <p className="mt-1">※ 日付形式の互換性を向上させ、Googleスプレッドシート上の日付（スラッシュ区切り、1桁月日など）も正しく標準化して読み取れるように修正しました。</p>
         </div>
      </div>
    </div>
  );
};

export default Statistics;
