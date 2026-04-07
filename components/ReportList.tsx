
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyReport } from '../types';
import { DEPARTMENT_CONFIGS, SHOW_DANGER_ZONE } from '../constants';
import { Search, Download, Database, Trash2, Edit2, Loader2, User } from 'lucide-react';
import { downloadCSV, exportDataJSON, clearAllReports, deleteReport } from '../services/reportService';

interface ReportListProps {
  reports: DailyReport[];
}

const ReportList: React.FC<ReportListProps> = ({ reports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  // ユニークな担当者リスト（五十音順）
  const staffNames = useMemo(() =>
    [...new Set(reports.map(r => r.staffName))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ja')),
    [reports]
  );

  const filteredReports = reports.filter(r => {
    const deptLabel = DEPARTMENT_CONFIGS[r.department]?.label || r.department;
    const matchesSearch = !searchTerm ||
      r.staffName.includes(searchTerm) ||
      r.department.includes(searchTerm) ||
      deptLabel.includes(searchTerm);
    const matchesStaff = !selectedStaff || r.staffName === selectedStaff;
    return matchesSearch && matchesStaff;
  });

  const handlePersonCSV = () => {
    const name = selectedStaff;
    const target = reports.filter(r => r.staffName === name);
    if (target.length === 0) return;
    let csv = "\uFEFF日付,部署,担当者,項目名,数量合計,保険数,保険完成,自費数,自費完成,製作時間,備考,問題点\n";
    target.forEach(r => {
      const deptLabel = DEPARTMENT_CONFIGS[r.department]?.label || r.department;
      r.items.forEach(i => {
        csv += `${r.date},${deptLabel},${r.staffName},${i.itemName},${i.count},${i.countInsured || 0},${i.countInsuredCompleted || 0},${i.countSelf || 0},${i.countSelfCompleted || 0},${i.timeMinutes || 0},"${r.remarks}","${r.issues}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSingleDelete = async (id: string) => {
    if (!window.confirm("この日報データを削除しますか？\n（Googleスプレッドシートからも削除されます）")) return;
    setDeletingId(id);
    try {
      const success = await deleteReport(id);
      if (success) {
        window.location.reload();
      } else {
        alert("削除に失敗しました。ネットワークの状態を確認してください。");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (report: DailyReport) => {
    navigate('/', { state: { editReport: report } });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            日報履歴
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedStaff && (
              <button
                onClick={handlePersonCSV}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 border border-blue-200 transition-colors"
                title={`${selectedStaff} のデータをCSV出力`}
              >
                <User className="w-4 h-4" /> 個人CSV
              </button>
            )}
            <button
              onClick={downloadCSV}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 border border-green-200 transition-colors"
              title="全データをCSV形式でダウンロード"
            >
              <Download className="w-4 h-4" /> CSV出力
            </button>
            <button
              onClick={exportDataJSON}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200 transition-colors"
              title="データのバックアップ（JSON）"
            >
              <Download className="w-4 h-4" /> 保存
            </button>
            {SHOW_DANGER_ZONE && (
              <button
                onClick={clearAllReports}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100 border border-rose-200 transition-colors"
                title="全データを削除してリセット"
              >
                <Trash2 className="w-4 h-4" /> 全削除
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="キーワード検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full bg-white"
            >
              <option value="">担当者で絞り込む</option>
              {staffNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || selectedStaff) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{filteredReports.length} 件表示</span>
            <button
              onClick={() => { setSearchTerm(''); setSelectedStaff(''); }}
              className="text-blue-500 hover:underline"
            >
              絞り込みをクリア
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-6 py-3">日付</th>
              <th className="px-6 py-3">部署</th>
              <th className="px-6 py-3">担当者</th>
              <th className="px-6 py-3">主な実績</th>
              <th className="px-6 py-3">備考</th>
              <th className="px-6 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReports.map((report) => {
              const isDeleting = deletingId === report.id;
              const deptConfig = DEPARTMENT_CONFIGS[report.department];
              return (
                <tr key={report.id} className={`hover:bg-gray-50 transition-colors ${isDeleting ? 'opacity-50 pointer-events-none bg-slate-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{report.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2 py-1 rounded-full text-xs text-white whitespace-nowrap"
                      style={{ backgroundColor: deptConfig?.color || '#999' }}
                    >
                      {deptConfig?.label || report.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">{report.staffName}</td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {report.items.slice(0, 3).map(i => {
                      let text = `${i.itemName}(${i.count})`;
                      if (i.customTimeRange) text += ` [${i.customTimeRange}]`;
                      return text;
                    }).join(', ')}
                    {report.items.length > 3 && '...'}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-400">
                    {report.issues ? <span className="text-red-500 font-bold mr-2">!</span> : null}
                    {report.remarks || report.issues || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(report)}
                        disabled={!!deletingId}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                        title="修正（フォームに読み込む）"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSingleDelete(report.id)}
                        disabled={!!deletingId}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                        title="この行を削除"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  データが見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportList;
